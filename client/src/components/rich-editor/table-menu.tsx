import { useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Merge,
  SplitSquareHorizontal,
  Grid3x3,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TableMenuProps {
  editor: Editor | null;
}

export function TableMenu({ editor }: TableMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!editor || !editor.isActive('table')) {
      setIsVisible(false);
      return;
    }

    // Найдём таблицу в DOM
    const { view } = editor;
    const { from } = view.state.selection;
    
    // Получаем координаты выбранной ячейки
    const coords = view.coordsAtPos(from);
    
    // Найдём ближайшую таблицу
    const tableNode = document.querySelector('.ProseMirror table');
    if (tableNode) {
      const tableRect = tableNode.getBoundingClientRect();
      const editorRect = view.dom.getBoundingClientRect();
      
      setPosition({
        top: tableRect.top - editorRect.top - 44, // Над таблицей
        left: tableRect.left - editorRect.left,
      });
      setIsVisible(true);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionChange = () => {
      updatePosition();
    };

    editor.on('selectionUpdate', handleSelectionChange);
    editor.on('transaction', handleSelectionChange);

    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
      editor.off('transaction', handleSelectionChange);
    };
  }, [editor, updatePosition]);

  if (!editor || !isVisible) return null;

  const MenuButton = ({ 
    onClick, 
    icon: Icon, 
    label, 
    variant = 'ghost',
    destructive = false 
  }: { 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string;
    variant?: 'ghost' | 'outline';
    destructive?: boolean;
  }) => (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-7 px-2 gap-1.5 text-xs font-medium',
        destructive && 'text-destructive hover:text-destructive hover:bg-destructive/10'
      )}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex items-center gap-1 p-1.5 bg-background border border-border rounded-lg shadow-lg">
          {/* Строки */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="h-7 w-7 p-0"
              title="Добавить строку сверху"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="h-7 w-7 p-0"
              title="Добавить строку снизу"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Удалить строку"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Столбцы */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="h-7 w-7 p-0"
              title="Добавить столбец слева"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="h-7 w-7 p-0"
              title="Добавить столбец справа"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Удалить столбец"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Объединение ячеек */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().mergeCells().run()}
              className="h-7 w-7 p-0"
              title="Объединить ячейки"
              disabled={!editor.can().mergeCells()}
            >
              <Merge className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().splitCell().run()}
              className="h-7 w-7 p-0"
              title="Разделить ячейку"
              disabled={!editor.can().splitCell()}
            >
              <SplitSquareHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Заголовок */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            className="h-7 px-2 gap-1.5 text-xs"
            title="Переключить заголовок"
          >
            <Grid3x3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Заголовок</span>
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Удалить таблицу */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Удалить таблицу"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
