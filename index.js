/** @babel */

const SUPPORTED_SCOPES = [
	'source.js',
	'source.jsx',
	'source.js.jsx'
];

function esformatterModulePath(editor) {
	let path = require('path');
	let fs = require('fs');

	const editorPath = editor.getPath();
	const projectPath = atom.project.relativizePath(editorPath)[0];

	if (projectPath != null) {
		try {
			const esformatterPath = path.join(projectPath, "node_modules/esformatter");
			fs.accessSync(esformatterPath);
			return esformatterPath;
		} catch (err) {
			console.error(err);
		}
	}

	console.log('Could not find esformatter module in the project. Falling back to internal esformatter shipped with package.');
	return 'esformatter';
}

function init(editor, onSave) {
	if (!editor) {
		return;
	}

	let esformatter = require(esformatterModulePath(editor));

	const selectedText = onSave ? null : editor.getSelectedText();
	const text = selectedText || editor.getText();
	let retText = '';

	try {
		retText = esformatter.format(text, esformatter.rc(editor.getURI()));
	} catch (err) {
		console.error(err);
		atom.notifications.addError('esformatter', {detail: err.message});
		return;
	}

	const editorEl = atom.views.getView(editor);
	const cursorPosition = editor.getCursorBufferPosition();
	const line = editorEl.getFirstVisibleScreenRow() + editor.displayBuffer.getVerticalScrollMargin();

	if (selectedText) {
		editor.setTextInBufferRange(editor.getSelectedBufferRange(), retText);
	} else {
		editor.setText(retText);
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

export const activate = () => {
	atom.workspace.observeTextEditors(editor => {
		editor.getBuffer().onWillSave(() => {
			const isJS = SUPPORTED_SCOPES.indexOf(editor.getGrammar().scopeName) !== -1;

			if (isJS && atom.config.get('esformatter.formatOnSave')) {
				init(editor, true);
			}
		});
	});

	atom.commands.add('atom-workspace', 'esformatter', () => {
		init(atom.workspace.getActiveTextEditor());
	});
};
