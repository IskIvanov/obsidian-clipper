import { EditorState, Transaction } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { vim } from '@replit/codemirror-vim';

/**
 * Replace a textarea with a CodeMirror editor that uses Vim key bindings.
 * The textarea stays the form's API: its `value` reads from and writes to the
 * editor, so code that sets `field.value` directly keeps working.
 */
export function createVimEditor(field: HTMLTextAreaElement): EditorView {
	const host = document.createElement('div');
	host.className = 'vim-editor';
	field.after(host);
	field.hidden = true;

	const view = new EditorView({
		parent: host,
		state: EditorState.create({
			doc: field.value,
			extensions: [
				// Vim must come first so its keymap runs before the default one.
				vim({ status: true }),
				history(),
				keymap.of([...defaultKeymap, ...historyKeymap]),
				EditorView.lineWrapping,
				placeholder(() => {
					const span = document.createElement('span');
					span.textContent = field.placeholder;
					return span;
				}),
				EditorView.contentAttributes.of({
					'aria-label': field.getAttribute('aria-label') || field.placeholder,
					spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off',
				}),
			],
		}),
	});

	Object.defineProperty(field, 'value', {
		configurable: true,
		get: () => view.state.doc.toString(),
		set: (value: string) => {
			if (value === view.state.doc.toString()) return;
			// Filled-in template content is not something the user can undo.
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: value },
				annotations: Transaction.addToHistory.of(false),
			});
		},
	});
	field.focus = () => view.focus();

	return view;
}
