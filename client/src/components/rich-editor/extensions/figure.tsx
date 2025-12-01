import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Loader2, 
  Pencil, 
  Check, 
  X, 
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  ImageIcon,
  Feather,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Компонент для отображения Figure (image + caption)
function FigureComponent({ node, updateAttributes, deleteNode, selected }: any) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [isAltPopoverOpen, setIsAltPopoverOpen] = useState(false);
  const [isGeneratingAlt, setIsGeneratingAlt] = useState(false);
  const [caption, setCaption] = useState(node.attrs.caption || '');
  const [alt, setAlt] = useState(node.attrs.alt || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingFromPrompt, setIsGeneratingFromPrompt] = useState(false);
  
  const handleSaveCaption = useCallback(() => {
    updateAttributes({ caption });
    setIsEditingCaption(false);
  }, [caption, updateAttributes]);
  
  const handleSaveAlt = useCallback(() => {
    updateAttributes({ alt });
    setIsAltPopoverOpen(false);
  }, [alt, updateAttributes]);
  
  const generateAltText = useCallback(async () => {
    setIsGeneratingAlt(true);
    try {
      const response = await fetch('/api/generate-alt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: node.attrs.src }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlt(data.altText);
        updateAttributes({ alt: data.altText });
      }
    } catch (error) {
      console.error('Failed to generate alt text:', error);
    } finally {
      setIsGeneratingAlt(false);
    }
  }, [node.attrs.src, updateAttributes]);
  
  // Генерация alt-текста по пользовательскому промпту через Даля
  const generateAltFromPrompt = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGeneratingFromPrompt(true);
    try {
      const response = await fetch('/api/generate-alt-from-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: node.attrs.src,
          userPrompt: aiPrompt,
          currentCaption: caption,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlt(data.altText);
      }
    } catch (error) {
      console.error('Failed to generate alt text from prompt:', error);
    } finally {
      setIsGeneratingFromPrompt(false);
    }
  }, [node.attrs.src, aiPrompt, caption]);
  
  const setAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment });
  }, [updateAttributes]);
  
  return (
    <NodeViewWrapper className="figure-wrapper my-4" data-alignment={node.attrs.alignment || 'center'}>
      <motion.figure
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative group rounded-lg overflow-hidden border border-transparent transition-all',
          selected && 'ring-2 ring-primary ring-offset-2 border-primary/20',
          node.attrs.alignment === 'left' && 'mr-auto',
          node.attrs.alignment === 'right' && 'ml-auto',
          node.attrs.alignment === 'center' && 'mx-auto',
        )}
        style={{ maxWidth: node.attrs.width || '100%' }}
      >
        {/* Toolbar при hover/selected - ВСЕГДА видимый при selected */}
        <AnimatePresence>
          {(selected || isAltPopoverOpen) && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between gap-2 p-2 bg-background/95 backdrop-blur rounded-lg shadow-lg border border-border"
            >
              {/* Выравнивание */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-8 w-8 p-0', node.attrs.alignment === 'left' && 'bg-muted')}
                  onClick={() => setAlignment('left')}
                  title="По левому краю"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-8 w-8 p-0', node.attrs.alignment === 'center' && 'bg-muted')}
                  onClick={() => setAlignment('center')}
                  title="По центру"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-8 w-8 p-0', node.attrs.alignment === 'right' && 'bg-muted')}
                  onClick={() => setAlignment('right')}
                  title="По правому краю"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="w-px h-6 bg-border" />

              {/* Alt-текст и Подпись */}
              <div className="flex gap-1">
                <Popover open={isAltPopoverOpen} onOpenChange={setIsAltPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 px-3 gap-1.5',
                        node.attrs.alt && 'text-green-600 bg-green-50 hover:bg-green-100'
                      )}
                      title="Alt-текст"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-xs font-medium">Alt</span>
                      {node.attrs.alt && <Check className="h-3 w-3" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="center" side="bottom">
                    <Tabs defaultValue="manual" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual" className="text-xs">
                          <Pencil className="h-3 w-3 mr-1.5" />
                          Вручную
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="text-xs">
                          <Feather className="h-3 w-3 mr-1.5" />
                          Спросить Даля
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="manual" className="p-4 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Описание изображения (Alt-текст)
                          </label>
                          <Textarea
                            value={alt}
                            onChange={(e) => setAlt(e.target.value)}
                            placeholder="Опишите, что изображено на картинке для незрячих пользователей..."
                            className="min-h-[80px] text-sm resize-none"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Alt-текст помогает незрячим пользователям понять содержимое изображения
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsAltPopoverOpen(false)}
                          >
                            Отмена
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSaveAlt}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Сохранить
                          </Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="ai" className="p-4 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Как описать изображение?
                          </label>
                          <Textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Например: Опиши это изображение кратко, акцентируя внимание на главном объекте..."
                            className="min-h-[60px] text-sm resize-none"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={generateAltText}
                            disabled={isGeneratingAlt || isGeneratingFromPrompt}
                          >
                            {isGeneratingAlt ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Авто-описание
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-primary"
                            onClick={generateAltFromPrompt}
                            disabled={!aiPrompt.trim() || isGeneratingAlt || isGeneratingFromPrompt}
                          >
                            {isGeneratingFromPrompt ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Feather className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Спросить Даля
                          </Button>
                        </div>
                        
                        {alt && (
                          <div className="pt-2 border-t">
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                              Результат (можно отредактировать):
                            </label>
                            <Textarea
                              value={alt}
                              onChange={(e) => setAlt(e.target.value)}
                              className="min-h-[60px] text-sm resize-none bg-green-50/50 border-green-200"
                            />
                            <div className="flex justify-end mt-2">
                              <Button 
                                size="sm" 
                                onClick={handleSaveAlt}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-3.5 w-3.5 mr-1.5" />
                                Применить
                              </Button>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 px-3 gap-1.5',
                    caption && 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  )}
                  onClick={() => setIsEditingCaption(true)}
                  title="Подпись"
                >
                  <Type className="h-4 w-4" />
                  <span className="text-xs font-medium">Подпись</span>
                  {caption && <Check className="h-3 w-3" />}
                </Button>
              </div>

              <div className="w-px h-6 bg-border" />

              {/* Удалить */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={deleteNode}
                title="Удалить изображение"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Скрытый тулбар при hover (не selected) */}
        <div className={cn(
          'absolute top-2 right-2 z-10 flex gap-1 p-1 bg-background/90 rounded-md shadow-sm border border-border transition-opacity',
          !selected && 'opacity-0 group-hover:opacity-100',
          selected && 'opacity-0 pointer-events-none'
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); }}
          >
            Нажмите для редактирования
          </Button>
        </div>

        {/* Изображение */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          className="w-full h-auto cursor-pointer"
          draggable={false}
        />
        
        {/* Caption / подпись */}
        <figcaption className="bg-muted/50 px-3 py-2">
          {isEditingCaption ? (
            <div className="flex gap-2">
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Подпись к изображению..."
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCaption();
                  if (e.key === 'Escape') setIsEditingCaption(false);
                }}
              />
              <Button size="sm" className="h-8" onClick={handleSaveCaption}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setIsEditingCaption(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-muted/80 rounded px-1 py-0.5 -mx-1 transition-colors"
              onClick={() => setIsEditingCaption(true)}
            >
              <span className={cn(
                'text-sm',
                caption ? 'text-muted-foreground' : 'text-muted-foreground/50 italic'
              )}>
                {caption || 'Нажмите, чтобы добавить подпись...'}
              </span>
              <div className="flex items-center gap-1">
                {node.attrs.alt && (
                  <span 
                    className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded cursor-help" 
                    title={`Alt: ${node.attrs.alt}`}
                  >
                    ALT ✓
                  </span>
                )}
              </div>
            </div>
          )}
        </figcaption>
      </motion.figure>
    </NodeViewWrapper>
  );
}

// TipTap Extension
export const Figure = Node.create({
  name: 'figure',
  
  group: 'block',
  
  atom: true, // Важно: делает ноду атомарной
  
  draggable: true,
  
  selectable: true,
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
      alignment: {
        default: 'center',
      },
      width: {
        default: '100%',
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: (dom) => {
          const img = (dom as HTMLElement).querySelector('img');
          const figcaption = (dom as HTMLElement).querySelector('figcaption');
          return {
            src: img?.getAttribute('src'),
            alt: img?.getAttribute('alt') || '',
            caption: figcaption?.textContent || '',
          };
        },
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      { class: 'figure-node', 'data-alignment': HTMLAttributes.alignment },
      [
        'img',
        mergeAttributes(HTMLAttributes, { 
          src: HTMLAttributes.src, 
          alt: HTMLAttributes.alt 
        }),
      ],
      ['figcaption', {}, HTMLAttributes.caption || ''],
    ];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(FigureComponent);
  },
  
  addCommands() {
    return {
      setFigure: (options: { src: string; alt?: string; caption?: string }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

// Типизация для команд
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}
