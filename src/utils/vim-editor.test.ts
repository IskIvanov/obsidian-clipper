// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { undo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { Vim, getCM } from '@replit/codemirror-vim';
import { createVimEditor } from './vim-editor';

const views: EditorView[] = [];

function editor(textarea: HTMLTextAreaElement) {
	const view = createVimEditor(textarea);
	views.push(view);
	return view;
}

function field(value = '') {
	const field = document.createElement('textarea');
	field.id = 'note-content-field';
	field.value = value;
	document.body.appendChild(field);
	return field;
}

afterEach(() => {
	views.splice(0).forEach(view => view.destroy());
	document.body.innerHTML = '';
});

describe('Vim editor', () => {
	it('keeps the textarea value in sync in both directions', () => {
		const textarea = field('first');
		const view = editor(textarea);
		expect(textarea.hidden).toBe(true);
		expect(view.state.doc.toString()).toBe('first');

		textarea.value = 'filled from template';
		expect(view.state.doc.toString()).toBe('filled from template');
		// Programmatic fills are not part of the undo history.
		undo(view);
		expect(textarea.value).toBe('filled from template');

		view.dispatch({ changes: { from: view.state.doc.length, insert: '!' } });
		expect(textarea.value).toBe('filled from template!');
	});

	it('edits the note with Vim commands', () => {
		const textarea = field('hello world');
		const view = editor(textarea);
		const cm = getCM(view)!;
		view.dispatch({ selection: { anchor: 0 } });

		Vim.handleKey(cm, 'w', 'user');
		expect(view.state.selection.main.head).toBe(6);
		for (const key of ['d', 'w']) Vim.handleKey(cm, key, 'user');
		expect(textarea.value).toBe('hello ');
	});

	it('does not undo into the previous note after a refill', () => {
		const textarea = field('hello world');
		const view = editor(textarea);
		const cm = getCM(view)!;
		view.dispatch({ selection: { anchor: 6 } });
		for (const key of ['d', 'w']) Vim.handleKey(cm, key, 'user');
		expect(textarea.value).toBe('hello ');

		textarea.value = 'new note';
		undo(view);
		expect(textarea.value).toBe('new note');
	});
});
