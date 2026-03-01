const BLOCK_BREAKS = [
  /<\/(p|div|section|article|blockquote|pre|h[1-6])>/gi,
  /<br\s*\/?>/gi,
  /<\/li>/gi,
  /<\/(ul|ol)>/gi,
];

const OPENING_LIST_ITEM = /<li[^>]*>/gi;
const TAGS = /<[^>]+>/g;
const WHITESPACE_BEFORE_NEWLINE = /[ \t]+\n/g;
const MULTIPLE_NEWLINES = /\n{3,}/g;

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function htmlToPlainText(html?: string | null): string {
  if (!html) {
    return '';
  }

  let text = html;

  BLOCK_BREAKS.forEach((pattern) => {
    text = text.replace(pattern, '\n');
  });

  text = text.replace(OPENING_LIST_ITEM, '- ');
  text = text.replace(TAGS, '');
  text = decodeEntities(text);
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(WHITESPACE_BEFORE_NEWLINE, '\n');
  text = text.replace(MULTIPLE_NEWLINES, '\n\n');

  return text.trim();
}
