'use strict';
var esformatter = require('esformatter');

function init(editor, onSave) {
	if (!editor) {
		return;
	}

	var selectedText = onSave ? null : editor.getSelectedText();
	var text = selectedText || editor.getText();
	var retText = '';

	try {
		retText = esformatter.format(text, esformatter.rc(editor.getURI()));
	} catch (err) {
		console.error(err);
		atom.beep();
		return;
	}

	var cursorPosition = editor.getCursorBufferPosition();
	var line = editor.getFirstVisibleScreenRow();

	if (selectedText) {
		editor.setTextInBufferRange(editor.getSelectedBufferRange(), retText);
	} else {
		editor.setText(retText);
	}

	editor.setCursorBufferPosition(cursorPosition);

	if (editor.getScreenLineCount() >= line) {
		editor.scrollToScreenPosition([line + 2, 0]);
	}
}

exports.config = {
	formatOnSave: {
		type: 'boolean',
		default: false
	}
};

exports.activate = function () {
	atom.workspace.observeTextEditors(function (editor) {
		editor.getBuffer().onWillSave(function () {
			var isJS = editor.getGrammar().scopeName === 'source.js';

			if (isJS && atom.config.get('esformatter.formatOnSave')) {
				init(editor, true);
			}
		});
	});

	atom.commands.add('atom-text-editor', 'esformatter', function () {
		init(atom.workspace.getActiveTextEditor());
	});
};
