import { Editor } from '@tiptap/react';
import React from 'react';

interface Props {
    editor: Editor;
}

const EditorToolbar: React.FC<Props> = ({ editor }) => {
    if (!editor) return null;

    return (
        <div className="flex gap-2 border-b p-2">
            <button onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()}>•</button>
        </div>
    );
};

export default EditorToolbar;
