/** @babel */
import path from 'path';
import {CompositeDisposable} from 'atom';
import importFrom from 'import-from';
import {allowUnsafeNewFunction} from 'loophole';

const SUPPORTED_SCOPES = [
	'source.js',
	'source.jsx',
	'source.js.jsx'
];

function init(editor, onSave) {
	const fp = editor.getPath();

	let esformatter;
	allowUnsafeNewFunction(() => {
		esformatter = importFrom.silent(path.dirname(fp), 'esformatter') || require('esformatter');
	});

	const selectedText = onSave ? null : editor.getSelectedText();
	const text = selectedText || editor.getText();

	let retText = '';

	try {
		retText = esformatter.format(text, esformatter.rc(fp));
	} catch (err) {
		console.error(err);
		atom.notifications.addError('esformatter', {detail: err.message});
		return;
	}

	const cursorPosition = editor.getCursorBufferPosition();
	const line = atom.views.getView(editor).getFirstVisibleScreenRow() +
		editor.getVerticalScrollMargin();

	if (selectedText) {
		editor.setTextInBufferRange(editor.getSelectedBufferRange(), retText);
	} else {
		editor.getBuffer().setTextViaDiff(retText);
	}

	editor.setCursorBufferPosition(cursorPosition);

	if (editor.getScreenLineCount() > line) {
		editor.scrollToScreenPosition([line, 0]);
	}
}

export const config = {
	formatOnSave: {
		type: 'boolean',
		default: false
	}
};

export function deactivate() {
	this.subscriptions.dispose();
}

export function activate() {
	this.subscriptions = new CompositeDisposable();

	this.subscriptions.add(atom.workspace.observeTextEditors(editor => {
		editor.getBuffer().onWillSave(() => {
			const isJS = SUPPORTED_SCOPES.includes(editor.getGrammar().scopeName);

			if (isJS && atom.config.get('esformatter.formatOnSave')) {
				init(editor, true);
			}
		});
	}));

	this.subscriptions.add(atom.commands.add('atom-workspace', 'esformatter', () => {
		const editor = atom.workspace.getActiveTextEditor();

		if (editor) {
			init(editor);
		}
	}));
}
