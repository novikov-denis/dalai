import { unified } from 'remark';
import remarkParse from 'remark-parse';

// Получить plain-текст из Markdown максимально близко к ReactMarkdown
export function markdownToPlain(md: string): string {
  // Парсим Markdown в AST
  const tree = unified().use(remarkParse).parse(md || '');
  // Рекурсивно обходим AST и собираем только текстовые узлы
  function collectText(node: any): string {
    if (!node) return '';
    if (node.type === 'text') return node.value;
    if (Array.isArray(node.children)) {
      return node.children.map(collectText).join('');
    }
    return '';
  }
  return collectText(tree);
}
