import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDocumentStore } from '@/stores/document-store';
import { updateDocument } from '@/app/actions/documents';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys } from '@/lib/query-keys';
import type { ChatMessage } from './chat-types';

interface UseChatApplyToDocumentParams {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

interface UseChatApplyToDocumentReturn {
  applyingMessageId: string | null;
  canApplyToDocument: boolean;
  handleApplyToDocument: (message: ChatMessage) => Promise<void>;
}

export function useChatApplyToDocument(
  params: UseChatApplyToDocumentParams,
): UseChatApplyToDocumentReturn {
  const { setMessages } = params;

  const { currentWorkspace } = useWorkspaceStore();
  const { currentDocument, setCurrentDocument } = useDocumentStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(null);

  const parseInlineMarkdown = (text: string) => {
    const nodes: any[] = [];

    const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const matchStart = match.index;
      const matchEnd = pattern.lastIndex;

      if (matchStart > lastIndex) {
        const plain = text.slice(lastIndex, matchStart);
        if (plain.trim()) {
          nodes.push({ type: 'text', text: plain });
        }
      }

      if (match[2]) {
        nodes.push({
          type: 'text',
          text: match[2],
          marks: [{ type: 'bold' }],
        });
      } else if (match[3]) {
        nodes.push({
          type: 'text',
          text: match[3],
          marks: [{ type: 'italic' }],
        });
      } else if (match[4]) {
        nodes.push({
          type: 'text',
          text: match[4],
          marks: [{ type: 'code' }],
        });
      } else if (match[5] && match[6]) {
        nodes.push({
          type: 'text',
          text: match[5],
          marks: [
            {
              type: 'link',
              attrs: { href: match[6] },
            },
          ],
        });
      }

      lastIndex = matchEnd;
    }

    if (lastIndex < text.length) {
      const plain = text.slice(lastIndex);
      if (plain.trim()) {
        nodes.push({ type: 'text', text: plain });
      }
    }

    if (!nodes.length) {
      nodes.push({ type: 'text', text });
    }

    return nodes;
  };

  const markdownToTiptapDoc = (markdown: string) => {
    const lines = markdown.split(/\r?\n/);
    const nodes: any[] = [];

    let paragraphBuffer: string[] = [];
    let currentList: null | {
      type: 'bullet' | 'ordered';
      items: string[];
    } = null;

    const flushParagraph = () => {
      if (!paragraphBuffer.length) return;
      const text = paragraphBuffer.join(' ').trim();
      paragraphBuffer = [];
      if (!text) return;
      nodes.push({
        type: 'paragraph',
        content: parseInlineMarkdown(text),
      });
    };

    const flushList = () => {
      if (!currentList || !currentList.items.length) return;
      const listItems = currentList.items.map((item) => ({
        type: 'listItem',
        content: [
          {
            type: 'paragraph',
            content: parseInlineMarkdown(item),
          },
        ],
      }));
      nodes.push({
        type: currentList.type === 'bullet' ? 'bulletList' : 'orderedList',
        content: listItems,
      });
      currentList = null;
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        continue;
      }

      const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        nodes.push({
          type: 'heading',
          attrs: { level },
          content: parseInlineMarkdown(text),
        });
        continue;
      }

      const bulletMatch = /^[-*+]\s+(.*)$/.exec(trimmed);
      const orderedMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed);

      if (bulletMatch || orderedMatch) {
        flushParagraph();
        const isOrdered = !!orderedMatch;
        const itemText = (bulletMatch ? bulletMatch[1] : orderedMatch?.[2]) ?? '';

        if (!currentList || currentList.type !== (isOrdered ? 'ordered' : 'bullet')) {
          flushList();
          currentList = {
            type: isOrdered ? 'ordered' : 'bullet',
            items: [],
          };
        }

        currentList.items.push(itemText);
        continue;
      }

      paragraphBuffer.push(trimmed);
    }

    flushParagraph();
    flushList();

    return {
      type: 'doc',
      content: nodes.length
        ? nodes
        : [
            {
              type: 'paragraph',
              content: [],
            },
          ],
    };
  };

  const stripDuplicateTitleFromMarkdown = (markdown: string, docTitle: string) => {
    if (!docTitle?.trim()) return markdown;
    const normalizedTitle = docTitle
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const lines = markdown.split(/\r?\n/);
    const first = lines[0]?.trim() ?? '';
    const h1Match = /^#\s+(.+)$/.exec(first);
    if (h1Match) {
      const headingText = h1Match[1]
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (headingText === normalizedTitle) {
        return lines.slice(1).join('\n').trimStart();
      }
    }
    return markdown;
  };

  const handleApplyToDocument = async (message: ChatMessage) => {
    if (!currentDocument?.id || !message.actions?.documentMarkdown) return;

    try {
      setApplyingMessageId(message.id);
      let appliedMarkdown = message.actions.documentMarkdown;
      appliedMarkdown = stripDuplicateTitleFromMarkdown(
        appliedMarkdown,
        currentDocument.title ?? '',
      );
      const content = markdownToTiptapDoc(appliedMarkdown);
      const serializableContent = JSON.parse(JSON.stringify(content));

      const result = await updateDocument({
        documentId: currentDocument.id,
        content: serializableContent,
      } as any);

      if (result?.error) {
        toast({
          title: 'Erro ao aplicar no documento',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      if (result?.data) {
        const updated = {
          ...(currentDocument as any),
          content: serializableContent,
        };
        setCurrentDocument(updated);
        const workspaceId = currentWorkspace?.id;
        if (workspaceId) {
          queryClient.setQueryData(
            queryKeys.documents.detail(workspaceId, currentDocument.id).queryKey,
            (old: unknown) => (old ? { ...(old as object), ...updated } : updated),
          );
          queryClient.invalidateQueries({
            queryKey: queryKeys.documents.tree(workspaceId).queryKey,
          });
        }
        params.setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? {
                  ...m,
                  actions: {
                    ...(m.actions || {}),
                    documentMarkdown: appliedMarkdown,
                    applied: true,
                  },
                }
              : m,
          ),
        );
        toast({
          title: 'Documento atualizado',
          description: 'As alterações sugeridas foram aplicadas.',
        });
      }
    } catch (err) {
      console.error('Erro ao aplicar sugestão no documento:', err);
      toast({
        title: 'Erro ao aplicar no documento',
        description: 'Ocorreu um erro ao atualizar o documento.',
        variant: 'destructive',
      });
    } finally {
      setApplyingMessageId(null);
    }
  };

  return {
    applyingMessageId,
    canApplyToDocument: Boolean(currentDocument),
    handleApplyToDocument,
  };
}
