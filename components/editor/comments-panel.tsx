import { Editor } from '@tiptap/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDocumentStore } from '@/stores/document-store';

interface CommentsPanelProps {
  editor: Editor;
  /** Quando true, não renderiza o cabeçalho (título + Fechar); usado quando o cabeçalho está na barra do editor */
  hideHeader?: boolean;
}

export function CommentsPanel({ editor, hideHeader = false }: CommentsPanelProps) {
  const {
    currentDocument,
    activeCommentId,
    setActiveCommentId,
  } = useDocumentStore();

  const comments = currentDocument?.comments ?? [];

  const handleGoToComment = (commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;
    const position = (comment as any).position as { from?: number; to?: number } | null | undefined;

    if (!position || typeof position.from !== 'number' || typeof position.to !== 'number') {
      return;
    }

    editor
      .chain()
      .focus(undefined, { scrollIntoView: true })
      .setTextSelection({ from: position.from, to: position.to })
      .setMark('commentHighlight')
      .run();

    setActiveCommentId(comment.id);
  };

  const isCommentsOpen = useDocumentStore((s) => s.isCommentsOpen);

  return (
    <aside
      aria-label="Painel de comentários"
      className={[
        'transition-[width,opacity] duration-200 ease-out border-l border-border flex flex-col overflow-hidden bg-card',
        isCommentsOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none',
      ].join(' ')}
    >
      {!hideHeader && (
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Comentários</span>
          <button
            type="button"
            onClick={() => useDocumentStore.getState().setIsCommentsOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
      {comments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground px-4 py-6">
          Nenhum comentário neste documento.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1 px-3 py-3">
          {comments.map((comment) => {
            const isActive = comment.id === activeCommentId;
            const createdAt = comment.createdAt
              ? format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })
              : '';
            const userName = (comment as any).user?.name ?? 'Usuário';
            const position = (comment as any).position as
              | { from?: number; to?: number }
              | null
              | undefined;
            let selectionText = '';

            if (position && typeof position.from === 'number' && typeof position.to === 'number') {
              try {
                selectionText = editor.state.doc.textBetween(position.from, position.to, ' ');
              } catch {
                selectionText = '';
              }
            }

            if (!selectionText) {
              selectionText = 'Trecho comentado';
            }

            return (
              <button
                key={comment.id}
                type="button"
                onClick={() => handleGoToComment(comment.id)}
                className={[
                  'w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-primary/10' : 'hover:bg-muted/40',
                ].join(' ')}
              >
                <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                  {selectionText}
                </p>
                <p className="text-sm text-foreground line-clamp-3 mb-1">{comment.content}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[55%]">{userName}</span>
                  {createdAt && <span>{createdAt}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default CommentsPanel;
