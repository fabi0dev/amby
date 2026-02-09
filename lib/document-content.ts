/**
 * Utilitários para extrair texto e markdown do conteúdo JSON do editor (TipTap).
 */

export function countWords(content: unknown): number {
  if (!content || typeof content !== 'object') return 0;
  const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
  let text = '';
  const visit = (node: unknown) => {
    if (node && typeof node === 'object') {
      const n = node as Record<string, unknown>;
      if (typeof n.text === 'string') text += n.text + ' ';
      if (Array.isArray(n.content)) n.content.forEach(visit);
    }
  };
  visit(doc);
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function getMarkdownFromContent(content: unknown): string {
  if (!content || typeof content !== 'object') return '';
  const doc = content as { content?: Array<Record<string, unknown>> };
  const parts: string[] = [];
  const visit = (nodes: Array<Record<string, unknown>>, listPrefix = '') => {
    for (const node of nodes) {
      const type = node.type as string;
      const inner = (node.content as Array<Record<string, unknown>>) || [];
      if (type === 'paragraph') {
        const text = inner.map((c) => (c.text as string) || '').join('');
        parts.push(listPrefix ? `${listPrefix} ${text}` : text);
      } else if (type === 'heading') {
        const attrs = node.attrs as { level?: number } | undefined;
        const level = attrs?.level ?? 1;
        const text = inner.map((c) => (c.text as string) || '').join('');
        parts.push(`${'#'.repeat(level)} ${text}`);
      } else if (type === 'bulletList' || type === 'orderedList') {
        const isOrdered = type === 'orderedList';
        inner.forEach((item, i) => {
          const prefix = isOrdered ? `${i + 1}.` : '-';
          visit((item.content as Array<Record<string, unknown>>) || [], prefix);
        });
      } else if (type === 'blockquote') {
        const text = inner.map((c) => (c.text as string) || '').join('');
        parts.push(`> ${text}`);
      } else {
        visit(inner, listPrefix);
      }
    }
  };
  if (Array.isArray(doc.content)) visit(doc.content);
  return parts.filter(Boolean).join('\n\n');
}
