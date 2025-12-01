import { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Strikethrough, Highlighter, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectionMenuProps {
  editor: Editor | null;
  onAskAI?: (selectedText: string) => void;
}

export function SelectionMenu({ editor, onAskAI }: SelectionMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const updatePosition = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) {
      setIsVisible(false);
      return;
    }

    // Get the DOM coordinates of the selection
    const { view } = editor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);

    // Calculate center position above the selection
    const centerX = (start.left + end.left) / 2;
    const topY = Math.min(start.top, end.top) - 10;

    setPosition({ x: centerX, y: topY });
    setIsVisible(true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      // Small delay to ensure DOM is updated
      setTimeout(updatePosition, 10);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    
    // Also listen for mouse up to catch selections
    const handleMouseUp = () => {
      setTimeout(updatePosition, 10);
    };
    
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editor, updatePosition]);

  // Hide when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-selection-menu]')) {
        // Don't hide immediately, check if there's still a selection
        setTimeout(() => {
          if (editor) {
            const { from, to } = editor.state.selection;
            if (from === to) {
              setIsVisible(false);
            }
          }
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editor]);

  if (!editor || !isVisible) {
    return null;
  }

  const handleAskAI = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (selectedText && onAskAI) {
      onAskAI(selectedText);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-selection-menu
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 flex items-center gap-0.5 p-1 bg-background border border-border rounded-lg shadow-lg"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('h-7 w-7 p-0', editor.isActive('bold') && 'bg-muted')}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('h-7 w-7 p-0', editor.isActive('italic') && 'bg-muted')}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn('h-7 w-7 p-0', editor.isActive('underline') && 'bg-muted')}
          >
            <Underline className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn('h-7 w-7 p-0', editor.isActive('strike') && 'bg-muted')}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
            className={cn('h-7 w-7 p-0', editor.isActive('highlight') && 'bg-muted')}
          >
            <Highlighter className="h-3.5 w-3.5" />
          </Button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          {onAskAI && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAskAI}
              className="h-7 px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Спросить Даля</span>
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
