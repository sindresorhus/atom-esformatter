'use strict';
var esformatter = require('esformatter');
var plugin = module.exports;

function init(editor, onSave) {
	if (!editor) {
		return;
	}

	var selectedText = onSave ? null : editor.getSelectedText();
	var text = selectedText || editor.getText();
	var retText = '';

	try {
		retText = esformatter.format(text, esformatter.rc(editor.getUri()));
	} catch (err) {
		console.error(err);
		atom.beep();
		return;
	}

	var cursorPosition = editor.getCursorBufferPosition();

	if (selectedText) {
		editor.setTextInBufferRange(editor.getSelectedBufferRange(), retText);
	} else {
		editor.setText(retText);
	}

	editor.setCursorBufferPosition(cursorPosition);
}

plugin.config = {
	formatOnSave: {
		type: 'boolean',
		default: false
	}
};

plugin.activate = function () {
	atom.workspace.eachEditor(function (editor) {
		editor.getBuffer().on('will-be-saved', function () {
			var isJS = editor.getGrammar().scopeName === 'source.js';

			if (isJS && atom.config.get('esformatter.formatOnSave')) {
				init(editor, true);
			}
		});
	});

	atom.commands.add('atom-workspace', 'esformatter', function () {
		init(atom.workspace.getActiveTextEditor());
	});
};
