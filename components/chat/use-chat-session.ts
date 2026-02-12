import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDocumentStore } from '@/stores/document-store';
import { useWorkspaces } from '@/hooks/use-workspaces';
import type { ChatMessage } from './chat-types';

const INACTIVITY_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 horas
const CHAT_STORAGE_KEY = 'docmost_chat_last_session';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Olá!',
  createdAt: new Date(),
};

export interface ChatSessionSummary {
  id: string;
  workspaceId: string;
  workspaceName: string;
  documentId: string | null;
  documentTitle: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredSession {
  sessionId: string;
  workspaceId: string;
}

interface UseChatSessionProps {
  open: boolean;
}

interface UseChatSessionReturn {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  isLoading: boolean;
  error: string | null;
  subtitle: string;
  /** Título do documento em contexto (null se nenhum ou se usuário removeu). */
  contextDocumentTitle: string | null;
  /** Remove o documento do contexto da sessão. */
  clearContext: () => Promise<void>;
  listRef: React.RefObject<HTMLDivElement>;
  handleSend: (overrideText?: string) => Promise<void>;
  handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement>;
  /** Limpa o chat atual e inicia nova conversa. */
  clearChat: () => void;
  /** Lista sessões para histórico. */
  loadSessions: () => Promise<ChatSessionSummary[]>;
  /** Troca para uma sessão do histórico. */
  switchToSession: (sessionId: string, workspaceId: string) => Promise<void>;
}

export function useChatSession({ open }: UseChatSessionProps): UseChatSessionReturn {
  const { currentWorkspace } = useWorkspaceStore();
  const { currentDocument } = useDocumentStore();
  const { data: workspaces = [] } = useWorkspaces();
  const firstWorkspace = workspaces[0];

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextDetached, setContextDetached] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const saveLastSession = useCallback((id: string, workspaceId: string) => {
    try {
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({ sessionId: id, workspaceId } satisfies StoredSession),
      );
    } catch {
      // localStorage indisponível
    }
  }, []);

  const clearStoredSession = useCallback(() => {
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // localStorage indisponível
    }
  }, []);

  const subtitle = useMemo(() => {
    if (error) {
      return error;
    }
    if (!currentWorkspace) {
      return 'Conversa geral. Selecione um workspace para usar a documentação como contexto.';
    }
    return 'Converse com a IA; pode usar a documentação do workspace quando relevante.';
  }, [currentWorkspace, error]);

  useEffect(() => {
    if (!open) return;
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  // Workspace para criar sessão: o selecionado ou o primeiro disponível (chat geral)
  const workspaceForSession = currentWorkspace ?? firstWorkspace;

  const loadMessagesForSession = useCallback(
    async (id: string) => {
      const messagesRes = await fetch(`/api/docspace/chat/sessions/${id}/messages`, {
        method: 'GET',
      });
      if (!messagesRes.ok) {
        const data = await messagesRes.json().catch(() => ({}));
        throw new Error(
          (data as any)?.error || 'Não foi possível carregar o histórico de mensagens.',
        );
      }
      const data = await messagesRes.json();
      const mapped: ChatMessage[] = (data as any[]).map((m: any) => ({
        id: m.id,
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content,
        createdAt: new Date(m.createdAt),
      }));
      if (mapped.length === 0) {
        mapped.push({ ...WELCOME_MESSAGE, createdAt: new Date() });
      }
      setMessages(mapped);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    if (!workspaceForSession) return;

    const ensureSessionAndMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let id: string | null = sessionId;

        if (!id) {
          let stored: StoredSession | null = null;
          try {
            const raw = localStorage.getItem(CHAT_STORAGE_KEY);
            if (raw) stored = JSON.parse(raw) as StoredSession;
          } catch {
            // ignora
          }

          const workspaceId = workspaceForSession.id;
          const now = Date.now();
          const cutoff = now - INACTIVITY_THRESHOLD_MS;

          if (stored?.sessionId && stored.workspaceId === workspaceId) {
            const listRes = await fetch('/api/docspace/chat/sessions');
            if (listRes.ok) {
              const list = (await listRes.json()) as any[];
              const found = list.find(
                (s: any) =>
                  s.id === stored!.sessionId && s.workspaceId === workspaceId,
              );
              if (found) {
                const updatedAt = new Date(found.updatedAt).getTime();
                if (updatedAt > cutoff) {
                  id = found.id;
                  setSessionId(id);
                  saveLastSession(id, workspaceId);
                }
              }
            }
          }

          if (!id) {
            const res = await fetch('/api/docspace/chat/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                workspaceId,
                documentId: contextDetached ? null : (currentDocument?.id ?? null),
                title: currentDocument?.title ?? null,
              }),
            });

            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(
                (data as any)?.error ||
                  'Não foi possível criar a sessão de chat. Verifique se você tem acesso ao workspace.',
              );
            }

            const data = await res.json();
            id = (data as any).id as string;
            setSessionId(id);
            saveLastSession(id, workspaceId);
          }
        }

        if (id) {
          await loadMessagesForSession(id);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Ocorreu um erro ao inicializar o chat.';
        setError(message);
        setMessages((prev) =>
          prev.length === 0
            ? [
                {
                  id: 'error',
                  role: 'assistant',
                  content: message,
                  createdAt: new Date(),
                },
              ]
            : prev,
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!sessionId) {
      void ensureSessionAndMessages();
    }
  }, [
    open,
    workspaceForSession,
    currentDocument?.id,
    currentDocument?.title,
    sessionId,
    contextDetached,
    loadMessagesForSession,
    saveLastSession,
  ]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input.trim()).trim();
    if (!text || isSending || isLoading) return;

    if (!workspaceForSession) {
      setError('Crie ou selecione um workspace para enviar mensagens.');
      return;
    }

    setError(null);

    let id = sessionId;

    try {
      setIsSending(true);

      if (!id) {
        const res = await fetch('/api/docspace/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: workspaceForSession.id,
            documentId: contextDetached ? null : (currentDocument?.id ?? null),
            title: currentDocument?.title ?? null,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as any)?.error ||
              'Não foi possível criar a sessão de chat. Verifique se você tem acesso ao workspace.',
          );
        }

        const data = await res.json();
        id = (data as any).id as string;
        setSessionId(id);
      }

      const timestamp = new Date();
      const userMessage: ChatMessage = {
        id: `user-${timestamp.getTime()}`,
        role: 'user',
        content: text,
        createdAt: timestamp,
      };

      setMessages((prev) => [...prev, userMessage]);
      if (!overrideText) setInput('');

      await fetch(`/api/docspace/chat/sessions/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });

      const historyForModel = [...messages, userMessage].map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const completionRes = await fetch(`/api/docspace/chat/sessions/${id}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForModel,
          generalChat: !currentWorkspace,
        }),
      });

      const completionData = (await completionRes.json().catch(() => ({}) as any)) as {
        message?: string;
        documentMarkdown?: string;
        openDocument?: { workspaceId: string; documentId: string; documentTitle?: string };
        suggestWorkspaceSearch?: boolean;
        workspaceSearchQuery?: string;
        chatAction?:
          | { type: 'create_workspace'; name: string }
          | { type: 'create_document'; workspaceId: string; title: string };
        error?: string;
      };

      if (!completionRes.ok) {
        const apiError =
          completionData?.message ||
          completionData?.error ||
          'Não foi possível obter a resposta da IA.';
        setError(apiError);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-error-${Date.now()}`,
            role: 'assistant',
            content: apiError,
            createdAt: new Date(),
          },
        ]);
        return;
      }

      const assistantText: string =
        completionData?.message || 'Desculpe, não consegui gerar uma resposta.';

      let documentMarkdown: string | undefined = completionData.documentMarkdown;

      if (!documentMarkdown) {
        const match = assistantText.match(/```DOCUMENT_MARKDOWN\s*([\s\S]*?)```/i);
        if (match?.[1]) {
          documentMarkdown = match[1].trim();
        }
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        createdAt: new Date(),
        actions: {
          ...(documentMarkdown && { documentMarkdown }),
          ...(completionData.openDocument && { openDocument: completionData.openDocument }),
          ...(completionData.suggestWorkspaceSearch && {
            suggestWorkspaceSearch: true,
            workspaceSearchQuery: completionData.workspaceSearchQuery,
          }),
          ...(completionData.chatAction && { chatAction: completionData.chatAction }),
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ocorreu um erro ao enviar sua mensagem.';
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: message,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const clearContext = async () => {
    setContextDetached(true);
    if (sessionId) {
      try {
        await fetch(`/api/docspace/chat/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: null }),
        });
      } catch {
        setContextDetached(false);
      }
    }
  };

  useEffect(() => {
    if (!currentDocument?.id) return;
    setContextDetached(false);
  }, [currentDocument?.id]);

  useEffect(() => {
    if (!sessionId || contextDetached || !currentDocument?.id) return;
    fetch(`/api/docspace/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: currentDocument.id }),
    }).catch(() => {});
  }, [sessionId, contextDetached, currentDocument?.id]);

  const clearChat = useCallback(() => {
    setSessionId(null);
    setMessages([{ ...WELCOME_MESSAGE, createdAt: new Date() }]);
    setError(null);
    clearStoredSession();
  }, [clearStoredSession]);

  const loadSessions = useCallback(async (): Promise<ChatSessionSummary[]> => {
    const res = await fetch('/api/docspace/chat/sessions');
    if (!res.ok) return [];
    const list = (await res.json()) as any[];
    return list.map((s: any) => ({
      id: s.id,
      workspaceId: s.workspaceId,
      workspaceName: s.workspace?.name ?? '',
      documentId: s.documentId ?? null,
      documentTitle: s.document?.title ?? null,
      title: s.title ?? null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }, []);

  const switchToSession = useCallback(
    async (targetSessionId: string, workspaceId: string) => {
      setError(null);
      setSessionId(targetSessionId);
      saveLastSession(targetSessionId, workspaceId);
      await loadMessagesForSession(targetSessionId);
    },
    [loadMessagesForSession, saveLastSession],
  );

  return {
    messages,
    setMessages,
    input,
    setInput,
    isSending,
    isLoading,
    error,
    subtitle,
    contextDocumentTitle: contextDetached ? null : (currentDocument?.title ?? null),
    clearContext,
    listRef,
    handleSend,
    handleKeyDown,
    clearChat,
    loadSessions,
    switchToSession,
  };
}
