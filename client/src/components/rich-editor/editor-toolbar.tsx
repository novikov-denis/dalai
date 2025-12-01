import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Highlighter,
  RemoveFormatting,
  Minus,
  Table,
  Image,
  Youtube,
  Plus,
  Trash2,
  RowsIcon,
  ColumnsIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, tooltip, children }: ToolbarButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'h-8 w-8 p-0 hover:bg-muted',
              isActive && 'bg-muted text-primary'
            )}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const HIGHLIGHT_COLORS = [
  { name: 'Жёлтый', color: '#fef08a' },
  { name: 'Зелёный', color: '#bbf7d0' },
  { name: 'Голубой', color: '#bfdbfe' },
  { name: 'Розовый', color: '#fecdd3' },
  { name: 'Оранжевый', color: '#fed7aa' },
  { name: 'Фиолетовый', color: '#ddd6fe' },
];

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isYoutubePopoverOpen, setIsYoutubePopoverOpen] = useState(false);

  const setLink = useCallback(() => {
    if (linkUrl === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setIsLinkPopoverOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl) {
      // Используем Figure вместо простого Image для поддержки подписей
      editor?.chain().focus().setFigure({ src: imageUrl, alt: '', caption: '' }).run();
    }
    setIsImagePopoverOpen(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl) {
      editor?.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
    }
    setIsYoutubePopoverOpen(false);
    setYoutubeUrl('');
  }, [editor, youtubeUrl]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10',
      className
    )}>
      {/* История */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        tooltip="Отменить (⌘Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        tooltip="Повторить (⌘⇧Z)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Заголовки */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        tooltip="Заголовок 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        tooltip="Заголовок 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        tooltip="Заголовок 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Форматирование текста */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        tooltip="Жирный (⌘B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        tooltip="Курсив (⌘I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        tooltip="Подчёркнутый (⌘U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        tooltip="Зачёркнутый"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        tooltip="Код"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Выделение цветом */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 w-8 p-0 hover:bg-muted',
              editor.isActive('highlight') && 'bg-muted text-primary'
            )}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-1">
            {HIGHLIGHT_COLORS.map(({ name, color }) => (
              <button
                key={color}
                onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
            <button
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="w-6 h-6 rounded border border-border hover:bg-muted flex items-center justify-center"
              title="Убрать выделение"
            >
              <RemoveFormatting className="h-3 w-3" />
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Ссылка */}
      <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 w-8 p-0 hover:bg-muted',
              editor.isActive('link') && 'bg-muted text-primary'
            )}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setLink()}
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={setLink} className="h-8">
              {editor.isActive('link') ? 'Обновить' : 'Добавить'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Списки */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        tooltip="Маркированный список"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        tooltip="Нумерованный список"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        tooltip="Цитата"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        tooltip="Разделитель"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Выравнивание */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        tooltip="По левому краю"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        tooltip="По центру"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        tooltip="По правому краю"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Очистить форматирование */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        tooltip="Очистить форматирование"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Таблица */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 w-8 p-0 hover:bg-muted',
              editor.isActive('table') && 'bg-muted text-primary'
            )}
          >
            <Table className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="space-y-2">
            <Button size="sm" variant="ghost" className="w-full justify-start text-xs" onClick={insertTable}>
              <Plus className="h-3 w-3 mr-2" /> Вставить таблицу 3×3
            </Button>
            {editor.isActive('table') && (
              <>
                <Separator />
                <Button size="sm" variant="ghost" className="w-full justify-start text-xs" onClick={() => editor.chain().focus().addRowAfter().run()}>
                  <RowsIcon className="h-3 w-3 mr-2" /> Добавить строку
                </Button>
                <Button size="sm" variant="ghost" className="w-full justify-start text-xs" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                  <ColumnsIcon className="h-3 w-3 mr-2" /> Добавить столбец
                </Button>
                <Separator />
                <Button size="sm" variant="ghost" className="w-full justify-start text-xs" onClick={() => editor.chain().focus().deleteRow().run()}>
                  <Trash2 className="h-3 w-3 mr-2" /> Удалить строку
                </Button>
                <Button size="sm" variant="ghost" className="w-full justify-start text-xs" onClick={() => editor.chain().focus().deleteColumn().run()}>
                  <Trash2 className="h-3 w-3 mr-2" /> Удалить столбец
                </Button>
                <Button size="sm" variant="ghost" className="w-full justify-start text-xs text-destructive" onClick={() => editor.chain().focus().deleteTable().run()}>
                  <Trash2 className="h-3 w-3 mr-2" /> Удалить таблицу
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Изображение */}
      <Popover open={isImagePopoverOpen} onOpenChange={setIsImagePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <Image className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Вставьте URL изображения</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addImage()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={addImage} className="h-8">
                Вставить
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* YouTube */}
      <Popover open={isYoutubePopoverOpen} onOpenChange={setIsYoutubePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <Youtube className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Вставьте ссылку на YouTube видео</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addYoutube()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={addYoutube} className="h-8">
                Вставить
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
