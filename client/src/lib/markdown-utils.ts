// Утилита для получения plain-текста из Markdown
import removeMd from 'remove-markdown';

export function getPlainTextFromMarkdown(md: string): string {
  return removeMd(md || '');
}
