import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface EditorCoreRef {
  editor: Editor | null;
  getHTML: () => string;
  getText: () => string;
  setContent: (content: string) => void;
  getSelectedText: () => string;
}

interface EditorCoreProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  onSelectionChange?: (hasSelection: boolean, selectedText: string) => void;
  className?: string;
  editable?: boolean;
}

export const EditorCore = forwardRef<EditorCoreRef, EditorCoreProps>(
  ({ initialContent = '', placeholder = 'Начните писать...', onChange, onSelectionChange, className, editable = true }, ref) => {
    
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
        Highlight.configure({
          multicolor: true,
        }),
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline cursor-pointer hover:text-primary/80',
          },
        }),
        TextStyle,
        Color,
      ],
      content: initialContent,
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        const selectedText = hasSelection ? editor.state.doc.textBetween(from, to, ' ') : '';
        onSelectionChange?.(hasSelection, selectedText);
      },
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[60vh] px-1',
        },
      },
    });

    useImperativeHandle(ref, () => ({
      editor,
      getHTML: () => editor?.getHTML() || '',
      getText: () => editor?.getText() || '',
      setContent: (content: string) => {
        editor?.commands.setContent(content);
      },
      getSelectedText: () => {
        if (!editor) return '';
        const { from, to } = editor.state.selection;
        return editor.state.doc.textBetween(from, to, ' ');
      },
    }));

    useEffect(() => {
      if (editor && initialContent && editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }, [editor, initialContent]);

    return (
      <div className={cn('rich-editor', className)}>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

EditorCore.displayName = 'EditorCore';
