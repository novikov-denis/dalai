import React, { createContext, useContext, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { Suggestion } from '@/components/suggestion-card';
import { Pluggable } from 'unified';

// Context for managing highlights
const HighlightContext = createContext({
  activeSuggestionId: null as string | null,
  onSuggestionClick: (_id: string) => {},
  onMouseEnter: (_id: string | null) => {},
});

interface MarkdownPreviewWithHighlightsProps {
  content: string;
  suggestions?: Suggestion[];
  activeSuggestionId?: string | null;
  onSuggestionClick?: (id: string, start?: number, end?: number) => void;
  onMouseEnter?: (id: string | null) => void;
  className?: string;
}

// Компонент для подсветки текста рекомендации - стиль Notion
function HighlightSpan({ id, children }: { id: string; children: React.ReactNode }) {
  const { activeSuggestionId, onSuggestionClick, onMouseEnter } = useContext(HighlightContext);
  const isActive = activeSuggestionId === id;

  return (
    <span
      id={`highlight-${id}`}
      className={cn(
        'cursor-pointer transition-all duration-150',
        // Notion-style: тонкий волнистый/пунктирный подчёркивание
        isActive 
          ? 'bg-amber-100/80 decoration-amber-500 underline decoration-wavy decoration-2 underline-offset-2' 
          : 'bg-amber-50/60 decoration-amber-400/70 underline decoration-wavy decoration-1 underline-offset-2 hover:bg-amber-100/60 hover:decoration-2'
      )}
      onClick={() => onSuggestionClick(id)}
      onMouseEnter={() => onMouseEnter(id)}
      onMouseLeave={() => onMouseEnter(null)}
    >
      {children}
    </span>
  );
}

// Компонент для зачёркнутого текста (старый текст - красный цвет)
function DeletedText({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-red-500/80 line-through decoration-red-400/60 decoration-1">
      {children}
    </span>
  );
}

// Компонент для нового вставленного текста (зелёный цвет)
function InsertedText({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-emerald-600 font-medium">
      {children}
    </span>
  );
}

export function MarkdownPreviewWithHighlights({
  content,
  suggestions = [],
  activeSuggestionId,
  onSuggestionClick = () => {},
  onMouseEnter = () => {},
  className,
}: MarkdownPreviewWithHighlightsProps) {
  
  // Создаём карту замен для подсветки
  const highlightMap = useMemo(() => {
    const map = new Map<string, string>();
    
    const pendingSuggestions = suggestions
      .filter(s => s.status === 'pending')
      .sort((a, b) => b.original.length - a.original.length);
    
    for (const suggestion of pendingSuggestions) {
      if (!map.has(suggestion.original)) {
        map.set(suggestion.original, suggestion.id);
      }
    }
    
    return map;
  }, [suggestions]);
  
  // Подготавливаем контент - заменяем маркеры :::NEW::: на <ins>
  const cleanedContent = useMemo(() => {
    if (!content) return '';
    return content.replace(/:::NEW:::([\s\S]*?):::END_NEW:::/g, '<ins>$1</ins>');
  }, [content]);

  // Функция для подсветки текста в children
  function highlightText(text: string): React.ReactNode {
    if (!text || highlightMap.size === 0) {
      return text;
    }

    const fragments: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;
    
    // Конвертируем Map в массив для итерации
    const entries = Array.from(highlightMap.entries());

    while (remaining.length > 0) {
      // Ищем ближайшее совпадение
      let earliestMatch: { index: number; text: string; id: string } | null = null;
      
      for (const [originalText, id] of entries) {
        const index = remaining.indexOf(originalText);
        if (index !== -1) {
          if (earliestMatch === null || index < earliestMatch.index) {
            earliestMatch = { index, text: originalText, id };
          }
        }
      }

      if (earliestMatch) {
        // Добавляем текст до совпадения
        if (earliestMatch.index > 0) {
          fragments.push(remaining.substring(0, earliestMatch.index));
        }
        
        // Добавляем подсвеченный текст
        fragments.push(
          <HighlightSpan key={`hl-${earliestMatch.id}-${keyIndex++}`} id={earliestMatch.id}>
            {earliestMatch.text}
          </HighlightSpan>
        );
        
        remaining = remaining.substring(earliestMatch.index + earliestMatch.text.length);
      } else {
        fragments.push(remaining);
        break;
      }
    }

    return fragments.length === 1 && typeof fragments[0] === 'string' 
      ? fragments[0] 
      : <>{fragments}</>;
  }

  // Рекурсивно обрабатываем children
  function processChildren(children: React.ReactNode): React.ReactNode {
    if (children === null || children === undefined) {
      return children;
    }
    
    if (typeof children === 'string') {
      return highlightText(children);
    }
    
    if (typeof children === 'number' || typeof children === 'boolean') {
      return children;
    }
    
    if (Array.isArray(children)) {
      return children.map((child, i) => {
        const processed = processChildren(child);
        if (React.isValidElement(processed)) {
          return React.cloneElement(processed, { key: i });
        }
        return processed;
      });
    }
    
    if (React.isValidElement(children)) {
      const element = children as React.ReactElement<{ children?: React.ReactNode }>;
      if (element.props && element.props.children !== undefined) {
        return React.cloneElement(element, {
          ...element.props,
          children: processChildren(element.props.children),
        });
      }
    }
    
    return children;
  }

  const components: Partial<Components> = {
    // Параграфы - обрабатываем текст для подсветки
    p: ({ children }) => <p>{processChildren(children)}</p>,
    
    // Списки
    li: ({ children }) => <li>{processChildren(children)}</li>,
    
    // Заголовки
    h1: ({ children }) => <h1>{processChildren(children)}</h1>,
    h2: ({ children }) => <h2>{processChildren(children)}</h2>,
    h3: ({ children }) => <h3>{processChildren(children)}</h3>,
    h4: ({ children }) => <h4>{processChildren(children)}</h4>,
    
    // Форматирование
    strong: ({ children }) => <strong>{processChildren(children)}</strong>,
    em: ({ children }) => <em>{processChildren(children)}</em>,
    
    // Зачёркнутый текст (~~text~~) - красный цвет
    del: ({ children }) => <DeletedText>{processChildren(children)}</DeletedText>,
    
    // Вставленный текст (<ins>) - зелёный цвет
    ins: ({ children }) => <InsertedText>{children}</InsertedText>,
    
    // Код
    code: ({ children, className: codeClassName }) => {
      const isInline = !codeClassName;
      return isInline 
        ? <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code> 
        : <pre className="bg-muted p-4 rounded-lg overflow-x-auto"><code className="font-mono text-sm">{children}</code></pre>;
    },
  };

  return (
    <HighlightContext.Provider value={{ 
      activeSuggestionId: activeSuggestionId || null, 
      onSuggestionClick, 
      onMouseEnter,
    }}>
      <div className={cn('prose prose-sm max-w-none', className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw as unknown as Pluggable]}
          components={components}
        >
          {cleanedContent}
        </ReactMarkdown>
      </div>
    </HighlightContext.Provider>
  );
}