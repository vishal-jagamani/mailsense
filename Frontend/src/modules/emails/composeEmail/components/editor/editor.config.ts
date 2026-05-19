import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';

export const getEditorExtensions = (placeholder: string) => [
    StarterKit,
    Placeholder.configure({
        placeholder,
    }),
    Link.configure({
        openOnClick: false,
    }),
];
