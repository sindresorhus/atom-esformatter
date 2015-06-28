'use babel';
import esformatter from 'esformatter';

function init(editor, onSave) {
	if (!editor) {
		return;
	}

	const selectedText = onSave ? null : editor.getSelectedText();
	const text = selectedText || editor.getText();
	let retText = '';

	try {
		retText = esformatter.format(text, esformatter.rc(editor.getURI()));
	} catch (err) {
		console.error(err);
		atom.beep();
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

export let config = {
	formatOnSave: {
		type: 'boolean',
		default: false
	}
};

export let activate = () => {
	atom.workspace.observeTextEditors(editor => {
		editor.getBuffer().onWillSave(() => {
			const isJS = editor.getGrammar().scopeName === 'source.js';

			if (isJS && atom.config.get('esformatter.formatOnSave')) {
				init(editor, true);
			}
		});
	});

	atom.commands.add('atom-workspace', 'esformatter', () => {
		init(atom.workspace.getActiveTextEditor());
	});
};
