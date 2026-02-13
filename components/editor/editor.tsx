'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { posToDOMRect } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useDocumentStore } from '@/stores/document-store';
import { useUIStore } from '@/stores/ui-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useIsMobile } from '@/hooks/use-media-query';
import { updateDocument } from '@/app/actions/documents';
import { useDebounce } from '@/hooks/use-debounce';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { BlockMenu } from './block-menu';
import { Toolbar } from './toolbar';
import { SaveStatus } from './save-status';
import { DocumentHeaderMenu } from './document-header-menu';
import CommentHighlight from './extensions/comment-highlight';
import CommentsPanel from './comments-panel';
import { TextSelection } from '@tiptap/pm/state';

export function Editor() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { currentWorkspace } = useWorkspaceStore();
  const {
    currentDocument,
    setCurrentDocument,
    setIsDirty,
    setIsSaving,
    isCommentsOpen,
    setIsCommentsOpen,
  } = useDocumentStore();
  const searchParams = useSearchParams();
  const workspaceId = currentWorkspace?.id ?? '';
  const defaultPageEditMode = useUIStore((s) => s.defaultPageEditMode);
  const fullWidth = useUIStore((s) => s.fullWidth);
  const setFullWidth = useUIStore((s) => s.setFullWidth);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const isMobile = useIsMobile();
  const shareModeParam = searchParams.get('mode');
  const initialReadOnly =
    shareModeParam === 'read'
      ? true
      : shareModeParam === 'edit'
        ? false
        : defaultPageEditMode === 'read';
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly);
  const [editorContent, setEditorContent] = useState<any>(currentDocument?.content || null);
  const [lastSavedContent, setLastSavedContent] = useState<string | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  /** Ignora o próximo onUpdate vindo de setContent programático ou da montagem inicial do editor */
  const ignoreNextUpdateRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectTimeoutRef = useRef<number | null>(null);
  const [clientId] = useState(() =>
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  );

  const documentsTreeBaseKey = queryKeys.documents.tree(workspaceId, null).queryKey.slice(0, 3);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Digite "/" para comandos.',
        showOnlyCurrent: true,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskItem.configure({ nested: true }),
      TaskList,
      CommentHighlight,
    ],
    immediatelyRender: false,
    editable: !isReadOnly,
    content: currentDocument?.content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    },
    onUpdate: ({ editor }) => {
      const computeBlockMenuPosition = () => {
        try {
          const view = editor.view;
          const { from } = editor.state.selection;
          const coords = view.coordsAtPos(from);
          const wrapperEl = editorWrapperRef.current;
          if (!wrapperEl) return null;
          const wrapperRect = wrapperEl.getBoundingClientRect();

          const top = coords.top - wrapperRect.top + 4;
          const left = coords.left - wrapperRect.left;

          return { top, left };
        } catch {
          return null;
        }
      };

      if (ignoreNextUpdateRef.current) {
        ignoreNextUpdateRef.current = false;
        const content = editor.getJSON();
        setEditorContent(content);
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from, ' ');
        const shouldShowBlockMenu = textBefore === '/';
        setShowBlockMenu(shouldShowBlockMenu);
        if (shouldShowBlockMenu) {
          const position = computeBlockMenuPosition();
          setBlockMenuPosition(position);
        } else {
          setBlockMenuPosition(null);
        }
        return;
      }

      setIsDirty(true);
      setIsSaving(true);
      const content = editor.getJSON();
      setEditorContent(content);
      // Envia conteúdo atualizado para outros clientes via WebSocket (edição cooperativa)
      try {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN && currentDocument?.id) {
          ws.send(
            JSON.stringify({
              type: 'content',
              documentId: currentDocument.id,
              clientId,
              content,
            }),
          );
        }
      } catch (err) {
        console.error('Erro ao enviar atualização em tempo real:', err);
      }
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from, ' ');
      const shouldShowBlockMenu = textBefore === '/';
      setShowBlockMenu(shouldShowBlockMenu);
      if (shouldShowBlockMenu) {
        const position = computeBlockMenuPosition();
        setBlockMenuPosition(position);
      } else {
        setBlockMenuPosition(null);
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === '/') {
          setShowBlockMenu(true);
        }
        if (event.key === 'Escape') {
          setShowBlockMenu(false);
        }
      },
      handleClick(view, pos, event) {
        const state = view.state;
        const { currentDocument, setActiveCommentId, setIsCommentsOpen } =
          useDocumentStore.getState();
        const comments = currentDocument?.comments ?? [];

        if (!comments.length) return false;

        const clickedComment = comments.find((comment) => {
          const position = (comment as any).position as
            | { from?: number; to?: number }
            | null
            | undefined;
          if (!position) return false;
          if (typeof position.from !== 'number' || typeof position.to !== 'number') {
            return false;
          }
          return pos >= position.from && pos <= position.to;
        });

        if (!clickedComment) return false;

        const position = (clickedComment as any).position as {
          from: number;
          to: number;
        };

        const tr = state.tr.setSelection(
          TextSelection.create(state.doc, position.from, position.to),
        );
        view.dispatch(tr);

        setActiveCommentId(clickedComment.id);
        setIsCommentsOpen(true);

        return true;
      },
    },
  });

  const debouncedContent = useDebounce(editorContent, 4000);

  // Atualizar modo de edição/leitura quando o link de compartilhamento define o parâmetro ?mode=
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'read') {
      setIsReadOnly(true);
    } else if (mode === 'edit') {
      setIsReadOnly(false);
    }
  }, [searchParams]);

  // Conexão WebSocket para sincronização em tempo real entre abas/usuários
  useEffect(() => {
    if (!currentDocument?.id) return;
    const wsUrl = process.env.NEXT_PUBLIC_REALTIME_URL ?? 'ws://localhost:3001';

    let isUnmounted = false;

    const clearReconnectTimeout = () => {
      if (wsReconnectTimeoutRef.current !== null) {
        window.clearTimeout(wsReconnectTimeoutRef.current);
        wsReconnectTimeoutRef.current = null;
      }
    };

    const connect = () => {
      if (isUnmounted) return;

      let ws: WebSocket | null = null;
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
      } catch (err) {
        console.error('Erro ao conectar WebSocket de colaboração:', err);
        // tenta reconectar depois de um tempo se falhar logo na criação
        clearReconnectTimeout();
        wsReconnectTimeoutRef.current = window.setTimeout(connect, 2000);
        return;
      }

      ws.onopen = () => {
        if (!currentDocument?.id || isUnmounted) return;
        ws?.send(
          JSON.stringify({
            type: 'join',
            documentId: currentDocument.id,
            clientId,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (
            msg.type === 'content' &&
            msg.documentId === currentDocument?.id &&
            msg.clientId !== clientId &&
            editor
          ) {
            ignoreNextUpdateRef.current = true;
            editor.commands.setContent(msg.content);
          }
        } catch (err) {
          console.error('Erro ao processar mensagem WebSocket:', err);
        }
      };

      const scheduleReconnect = () => {
        if (isUnmounted) return;
        clearReconnectTimeout();
        wsReconnectTimeoutRef.current = window.setTimeout(connect, 2000);
      };

      ws.onclose = () => {
        if (isUnmounted) return;
        scheduleReconnect();
      };

      ws.onerror = (event) => {
        console.error('WebSocket erro de colaboração:', event);
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      clearReconnectTimeout();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDocument?.id, editor, clientId]);

  // Fechar BubbleMenu ao clicar fora do menu (incluindo ao clicar em outro lugar do editor)
  useEffect(() => {
    if (!editor) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = e.target as Element;
      const insideBubbleMenu = el?.closest?.('.tippy-box, [data-tippy-root]');
      if (!insideBubbleMenu) {
        const { from } = editor.state.selection;
        editor.chain().focus(undefined, { scrollIntoView: false }).setTextSelection(from).run();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  useEffect(() => {
    if (editor && currentDocument) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(currentDocument.content);

      if (currentContent !== newContent && currentDocument.id) {
        ignoreNextUpdateRef.current = true;
        editor.commands.setContent(currentDocument.content);
        setEditorContent(currentDocument.content);
        setLastSavedContent(JSON.stringify(currentDocument.content));
        setIsDirty(false);
        setIsSaving(false);
      }
    }
  }, [editor, currentDocument, setEditorContent, setLastSavedContent, setIsDirty, setIsSaving]);

  // Inicializar quando o documento muda (ex.: troca de documento)
  useEffect(() => {
    if (currentDocument?.content && currentDocument.id) {
      const contentStr = JSON.stringify(currentDocument.content);
      if (!lastSavedContent || lastSavedContent !== contentStr) {
        ignoreNextUpdateRef.current = true;
        setEditorContent(currentDocument.content);
        setLastSavedContent(contentStr);
        setIsDirty(false);
        setIsSaving(false);
      }
    }
  }, [
    currentDocument,
    lastSavedContent,
    setEditorContent,
    setLastSavedContent,
    setIsDirty,
    setIsSaving,
  ]);

  useEffect(() => {
    // Não salvar se não tiver conteúdo, documento ou editor
    if (!debouncedContent || !currentDocument?.id || !editor) return;

    // Não salvar se não tiver lastSavedContent (primeira vez - apenas inicializar)
    if (!lastSavedContent) {
      setLastSavedContent(JSON.stringify(debouncedContent));
      setIsDirty(false);
      setIsSaving(false);
      return;
    }

    // Verificar se o conteúdo realmente mudou comparando com o último conteúdo salvo
    const newContent = JSON.stringify(debouncedContent);

    // Só salvar se o conteúdo mudou
    if (lastSavedContent !== newContent) {
      const saveContent = async () => {
        try {
          // Garantir payload serializável para a Server Action (evita exceção no cliente)
          const serializableContent = JSON.parse(JSON.stringify(debouncedContent));
          const result = await updateDocument({
            documentId: currentDocument.id,
            content: serializableContent,
          });

          if (result.error) {
            console.error('Erro ao salvar:', result.error);
            setIsSaving(false);
          } else if (result.data) {
            setIsDirty(false);
            setIsSaving(false);
            setLastSavedContent(newContent);
            const updated = { ...currentDocument, content: serializableContent };
            setCurrentDocument(updated);
            // Atualizar cache do React Query para refletir ao alternar documentos
            queryClient.setQueryData(
              queryKeys.documents.detail(workspaceId, currentDocument.id).queryKey,
              (old: unknown) => (old ? { ...(old as object), ...updated } : updated),
            );
            // Invalida todas as árvores de documentos deste workspace (inclui projetos específicos)
            queryClient.invalidateQueries({
              queryKey: documentsTreeBaseKey,
            });
          }
        } catch (error) {
          console.error('Erro ao salvar documento:', error);
          setIsSaving(false);
        }
      };

      saveContent();
    } else {
      // Se o conteúdo não mudou, garantir que os estados estão corretos
      setIsDirty(false);
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent]);

  // Focar título ao abrir documento nova (?focus=title)
  useEffect(() => {
    if (!currentDocument || searchParams.get('focus') !== 'title') return;
    const input = titleInputRef.current;
    if (input) {
      input.focus();
      input.select();
      const url = new URL(window.location.href);
      url.searchParams.delete('focus');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [currentDocument, searchParams]);

  if (!editor || !currentDocument) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Selecione um documento para editar
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-background overflow-hidden animate-fade-in">
      {/* Menu flutuante fixo no footer, centralizado; safe-area no mobile para não cobrir conteúdo */}
      <div
        className="fixed left-0 right-0 z-30 flex justify-center pointer-events-none px-3 sm:px-4"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-md transition-shadow duration-200 hover:shadow-lg sm:gap-3 sm:px-4 sm:py-2.5">
          <DocumentHeaderMenu
            isReadOnly={isReadOnly}
            onReadOnlyChange={setIsReadOnly}
            fullWidth={fullWidth}
            onFullWidthChange={setFullWidth}
            onInsertSuggestion={(text) => {
              if (!editor) return;
              editor
                .chain()
                .focus(undefined, { scrollIntoView: true })
                .insertContent({
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text,
                    },
                  ],
                })
                .run();
            }}
          />
          <SaveStatus />
        </div>
      </div>

      {/* Layout: editor com scroll próprio + painel de comentários fixo à direita */}
      <div className="flex-1 min-h-0 bg-background animate-fade-in flex min-w-0">
        {/* Coluna do editor (rola sozinha); reserva espaço quando painel de comentários está aberto */}
        <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
          <div
            className={cn(
              'h-full min-w-0 w-full mx-auto transition-[max-width] duration-200 px-4 sm:px-6 md:px-8',
              fullWidth ? 'max-w-4xl' : 'max-w-2xl',
              fullWidth && isCommentsOpen && !isMobile && 'pr-80',
            )}
          >
            {/* Título (rola junto com o conteúdo) */}
            <div className="pt-4 pb-2 pr-2 sm:pt-6 sm:pr-6">
              <input
                ref={titleInputRef}
                type="text"
                value={currentDocument.title}
                onChange={(e) => {
                  setCurrentDocument({
                    ...currentDocument,
                    title: e.target.value,
                  });
                }}
                onBlur={async () => {
                  if (!currentDocument?.title) return;
                  try {
                    setIsDirty(true);
                    setIsSaving(true);
                    const result = await updateDocument({
                      documentId: currentDocument.id,
                      title: currentDocument.title,
                    });
                    if (result.data && !result.error) {
                      setIsDirty(false);
                      const updated = { ...currentDocument, title: result.data.title };
                      setCurrentDocument(updated);
                      queryClient.setQueryData(
                        queryKeys.documents.detail(workspaceId, currentDocument.id).queryKey,
                        (old: unknown) => (old ? { ...(old as object), ...updated } : updated),
                      );
                      // Invalida todas as árvores de documentos deste workspace para atualizar o sidebar
                      queryClient.invalidateQueries({
                        queryKey: documentsTreeBaseKey,
                      });
                    }
                  } catch (err) {
                    console.error('Erro ao salvar título:', err);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-muted-foreground focus:text-primary transition-smooth"
                placeholder="Sem título"
              />
            </div>

            {/* Conteúdo do editor (pb para não ficar atrás do menu flutuante; no mobile mais espaço + safe-area) */}
            <div
              ref={editorWrapperRef}
              className="relative min-h-full pt-2 overflow-x-hidden overflow-y-auto pb-[max(8rem,calc(5rem+env(safe-area-inset-bottom,0px)))] sm:pb-28"
            >
              <BubbleMenu
                editor={editor}
                updateDelay={50}
                tippyOptions={{
                  duration: 100,
                  placement: 'top',
                  appendTo: () => document.body,
                  getReferenceClientRect: () => {
                    if (!editor || editor.isDestroyed) {
                      return document.body.getBoundingClientRect();
                    }
                    const { view, state } = editor;
                    const { from, to } = state.selection;
                    try {
                      const rect = posToDOMRect(view, from, to);
                      if (rect.width > 0 || rect.height > 0) return rect;
                    } catch {
                      // posToDOMRect pode falhar em algumas posições
                    }
                    return view.dom.getBoundingClientRect();
                  },
                  popperOptions: {
                    strategy: 'fixed',
                    modifiers: [
                      { name: 'offset', options: { offset: [0, 8] } },
                      { name: 'flip', options: { padding: 8 } },
                      { name: 'preventOverflow', options: { padding: 8 } },
                    ],
                  },
                }}
              >
                <Toolbar editor={editor} />
              </BubbleMenu>
              {showBlockMenu && editor && (
                <BlockMenu
                  editor={editor}
                  position={blockMenuPosition ?? undefined}
                  onClose={() => {
                    setShowBlockMenu(false);
                    setBlockMenuPosition(null);
                  }}
                />
              )}
              <EditorContent
                editor={editor}
                className="prose prose-slate dark:prose-invert max-w-none focus:outline-none break-words [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full [&_.ProseMirror]:prose-p:my-2 [&_.ProseMirror]:prose-headings:my-3 [&_.ProseMirror]:break-words"
              />
            </div>
          </div>
        </div>

        {/* Painel de comentários: overlay no mobile, lateral no desktop */}
        <div className={cn('flex-shrink-0', !isCommentsOpen && 'overflow-hidden')}>
          <CommentsPanel editor={editor} isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
}
