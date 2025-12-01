import { Mark, mergeAttributes } from '@tiptap/core';

export interface SuggestionHighlightOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    suggestionHighlight: {
      setSuggestionHighlight: (attributes: { id: string; type: 'deletion' | 'insertion' | 'suggestion'; suggestionType?: 'style' | 'tone' | 'grammar' | 'policy' }) => ReturnType;
      unsetSuggestionHighlight: () => ReturnType;
    };
  }
}

export const SuggestionHighlight = Mark.create<SuggestionHighlightOptions>({
  name: 'suggestionHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-suggestion-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-suggestion-id': attributes.id };
        },
      },
      type: {
        default: 'suggestion',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          return { 'data-type': attributes.type };
        },
      },
      suggestionType: {
        default: 'style',
        parseHTML: element => element.getAttribute('data-suggestion-type'),
        renderHTML: attributes => {
          if (!attributes.suggestionType) return {};
          return { 'data-suggestion-type': attributes.suggestionType };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-suggestion-highlight]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes['data-type'] || 'suggestion';
    const suggestionType = HTMLAttributes['data-suggestion-type'] || 'style';
    
    let className = '';
    let style = '';
    
    switch (type) {
      case 'deletion':
        className = 'line-through';
        style = 'color: #ef4444; text-decoration-color: #f87171;';
        break;
      case 'insertion':
        style = 'color: #059669;';
        break;
      case 'suggestion':
      default:
        // Используем inline стили для гарантированного применения цветов
        const baseStyle = 'text-decoration: underline wavy; text-decoration-thickness: 1px; text-underline-offset: 2px; cursor: pointer; transition: background-color 0.2s;';
        
        switch (suggestionType) {
          case 'tone':
            // Тон - голубой
            style = baseStyle + 'background-color: #dbeafe; text-decoration-color: #60a5fa;';
            break;
          case 'grammar':
            // Грамматика - зелёный
            style = baseStyle + 'background-color: #dcfce7; text-decoration-color: #4ade80;';
            break;
          case 'policy':
            // Политика - фиолетовый
            style = baseStyle + 'background-color: #f3e8ff; text-decoration-color: #c084fc;';
            break;
          case 'style':
          default:
            // Стиль - оранжевый/жёлтый
            style = baseStyle + 'background-color: #fef3c7; text-decoration-color: #fbbf24;';
            break;
        }
        break;
    }

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-suggestion-highlight': '',
        class: className,
        style: style,
      }),
      0,
    ];
  },
});
