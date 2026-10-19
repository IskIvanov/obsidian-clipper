import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { vim } from '@replit/codemirror-vim';

/**
 * Get the extensions for the Vim editor.
 */
const getExtensions = (textarea: HTMLTextAreaElement): Extension[] => [
	vim({ status: true }),
	history(),
	keymap.of([...defaultKeymap, ...historyKeymap]),
	EditorView.lineWrapping,
	placeholder(textarea.placeholder),
	EditorView.contentAttributes.of({ 'aria-label': textarea.placeholder }),
];

/**
 * Create a new editor state with the given document and extensions.
 */
const createEditorState = (doc: string, extensions: Extension[]) => EditorState.create({ doc, extensions });

/**
 * Replace a textarea with a CodeMirror editor that uses Vim key bindings.
 * The textarea stays the form's API: its `value` reads from and writes to the
 * editor, so code that sets `textarea.value` directly keeps working.
 */
export function createVimEditor(textarea: HTMLTextAreaElement): EditorView {	
	const extensions = getExtensions(textarea);
	const container = document.createElement('div');
	container.className = 'vim-editor';
	textarea.after(container);
	textarea.hidden = true;
	const view = new EditorView({ parent: container, state: createEditorState(textarea.value, extensions) });

	Object.defineProperty(textarea, 'value', {
		get: () => view.state.doc.toString(),
		set: (value: string) => {
			if (value === view.state.doc.toString()) return;
			// Filled-in template content starts a new note, so start a fresh state:
			// undo history from the previous note must not carry over.
			view.setState(createEditorState(value, extensions));
		},
	});

	return view;
}
