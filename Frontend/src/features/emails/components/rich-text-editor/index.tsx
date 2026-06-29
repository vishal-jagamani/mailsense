'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import React, { useEffect } from 'react';

import { useIsMobile } from '@shared/hooks';
import { getEditorExtensions } from './editor.config';

interface RichTextEditorProps {
    content: string;
    onContentChange: (value: string) => void;
    placeholder?: string;
    editable?: boolean;
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onContentChange,
    placeholder = 'Write something...',
    editable = true,
    className = '',
}) => {
    const isMobile = useIsMobile();

    const editor = useEditor({
        extensions: getEditorExtensions(placeholder),
        content,
        editable,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none h-full w-full',
            },
        },
        onUpdate: ({ editor }) => {
            onContentChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    // sync external value (important for edit/reset cases)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className={`flex h-full w-full flex-col overflow-auto ${className}`}>
            <EditorContent editor={editor} className={`h-full w-full ${isMobile ? 'text-xs' : 'text-sm'}`} />
        </div>
    );
};

export default RichTextEditor;
