'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { diffLines, type Change } from 'diff';
import Image from 'next/image';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useDocumentVersions, type DocumentVersionWithUser } from '@/hooks/use-documents';
import { queryKeys } from '@/lib/query-keys';
import { getMarkdownFromContent } from '@/lib/document-content';
import { updateDocument } from '@/app/actions/documents';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/stores/document-store';

function formatVersionDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm', { locale: ptBR });
  if (isYesterday(d)) return `Ontem, ${format(d, 'HH:mm', { locale: ptBR })}`;
  return format(d, "dd 'de' MMM, yyyy HH:mm", { locale: ptBR });
}

function getDiffChanges(oldText: string, newText: string): Change[] {
  return diffLines(oldText, newText);
}

/** Agrupa alterações em "hunks" (blocos consecutivos added/removed) para navegação */
function getChangeHunks(changes: Change[]): number {
  let hunks = 0;
  let inBlock = false;
  for (const c of changes) {
    if (c.added || c.removed) {
      if (!inBlock) {
        hunks++;
        inBlock = true;
      }
    } else {
      inBlock = false;
    }
  }
  return hunks;
}

function HistoryMarkdown({ markdown, className }: { markdown: string; className?: string }) {
  if (!markdown) return null;

  return (
    <div
      className={cn(
        'history-formatted text-sm text-foreground [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-semibold [&_h1:first-child]:mt-0 [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-medium [&_p]:my-2 [&_p:first-child]:mt-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}

type HistoryVersionListProps = {
  versions: DocumentVersionWithUser;
  selectedVersion: DocumentVersionWithUser[number] | null;
  isLoading: boolean;
  isRestoring: boolean;
  onSelectVersion: (version: DocumentVersionWithUser[number]) => void;
  onCancel: () => void;
  onRestore: () => void;
};

function HistoryVersionList({
  versions,
  selectedVersion,
  isLoading,
  isRestoring,
  onSelectVersion,
  onCancel,
  onRestore,
}: HistoryVersionListProps) {
  const hasVersions = versions.length > 0;

  return (
    <div className="flex w-72 shrink-0 flex-col border-r bg-muted/30">
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : !hasVersions ? (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
          Nenhuma versão anterior.
        </div>
      ) : (
        <div className="page-history-scroll flex-1 overflow-y-auto p-2">
          {versions.map((v) => {
            const meta =
              v.metadata && typeof v.metadata === 'object'
                ? (v.metadata as {
                    fromWorkspaceName?: string | null;
                    toWorkspaceName?: string | null;
                  })
                : {};

            const movedLabel =
              v.event === 'moved'
                ? meta.fromWorkspaceName && meta.toWorkspaceName
                  ? `Documento movido de ${meta.fromWorkspaceName} para ${meta.toWorkspaceName}`
                  : 'Documento movido para outro espaço'
                : null;

            const isSelected = selectedVersion?.id === v.id;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVersion(v)}
                className={cn(
                  'mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                  isSelected ? 'bg-primary/15 text-primary' : 'hover:bg-muted',
                )}
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                  {v.user.image ? (
                    <Image src={v.user.image} alt="" fill className="object-cover" sizes="32px" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                      {(v.user.name ?? '?').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-foreground">
                      {v.user.name ?? 'Usuário'}
                    </p>
                    <span className="flex-shrink-0 text-[11px] text-muted-foreground">
                      {formatVersionDate(v.createdAt)}
                    </span>
                  </div>
                  {movedLabel && (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        Movida
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {movedLabel}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {hasVersions && (
        <div className="flex shrink-0 gap-2 border-t p-3">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            disabled={!selectedVersion || isRestoring}
            onClick={onRestore}
          >
            {isRestoring ? 'Restaurando...' : 'Restaurar'}
          </Button>
        </div>
      )}
    </div>
  );
}

type HistoryContentProps = {
  selectedVersion: DocumentVersionWithUser[number] | null;
  highlightChanges: boolean;
  onHighlightChangesChange: (value: boolean) => void;
  diffChanges: Change[] | null;
  selectedIndex: number;
  totalHunks: number;
  currentHunk: number;
  changeIndex: number;
  setChangeIndex: (updater: (prev: number) => number) => void;
  selectedMarkdown: string;
};

function HistoryContent({
  selectedVersion,
  highlightChanges,
  onHighlightChangesChange,
  diffChanges,
  selectedIndex,
  totalHunks,
  currentHunk,
  changeIndex,
  setChangeIndex,
  selectedMarkdown,
}: HistoryContentProps) {
  if (!selectedVersion) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Selecione uma versão para visualizar
      </div>
    );
  }

  const showDiff = highlightChanges && diffChanges && selectedIndex >= 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={highlightChanges}
            onChange={(e) => onHighlightChangesChange(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Destacar alterações
        </label>
        {highlightChanges && totalHunks > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {currentHunk} de {totalHunks}
            </span>
            <button
              type="button"
              className="rounded p-1 hover:bg-muted disabled:opacity-40"
              onClick={() => setChangeIndex((i) => Math.max(0, i - 1))}
              disabled={changeIndex <= 0}
              aria-label="Alteração anterior"
            >
              ▲
            </button>
            <button
              type="button"
              className="rounded p-1 hover:bg-muted disabled:opacity-40"
              onClick={() => setChangeIndex((i) => Math.min(totalHunks - 1, i + 1))}
              disabled={changeIndex >= totalHunks - 1}
              aria-label="Próxima alteração"
            >
              ▼
            </button>
          </div>
        )}
      </div>
      <div className="page-history-scroll flex-1 overflow-y-auto p-4">
        {showDiff ? (
          <div className="space-y-3">
            {diffChanges!.map((part, i) => {
              const diffClassName = part.added
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : part.removed
                  ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                  : undefined;

              return <HistoryMarkdown key={i} markdown={part.value} className={diffClassName} />;
            })}
          </div>
        ) : selectedMarkdown ? (
          <HistoryMarkdown markdown={selectedMarkdown} />
        ) : (
          <p className="text-sm text-muted-foreground">(vazio)</p>
        )}
      </div>
    </div>
  );
}

export function PageHistoryModal({
  open,
  onOpenChange,
  workspaceId,
  documentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  documentId: string;
}) {
  const { data: versions = [], isLoading } = useDocumentVersions(workspaceId, documentId);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersionWithUser[number] | null>(
    null,
  );
  const [highlightChanges, setHighlightChanges] = useState(false);
  const [changeIndex, setChangeIndex] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentDocument, setCurrentDocument } = useDocumentStore();

  const selectedIndex = useMemo(
    () => (selectedVersion ? versions.findIndex((v) => v.id === selectedVersion.id) : -1),
    [versions, selectedVersion],
  );

  const previousVersion = useMemo(() => {
    if (selectedIndex <= 0 || selectedIndex > versions.length - 1) return null;
    return versions[selectedIndex - 1] ?? null;
  }, [versions, selectedIndex]);

  const selectedMarkdown = useMemo(
    () => (selectedVersion ? getMarkdownFromContent(selectedVersion.content) : ''),
    [selectedVersion],
  );

  const previousMarkdown = useMemo(
    () => (previousVersion ? getMarkdownFromContent(previousVersion.content) : ''),
    [previousVersion],
  );

  const diffChanges = useMemo(() => {
    if (!highlightChanges || selectedIndex < 0) return null;
    return getDiffChanges(previousMarkdown, selectedMarkdown);
  }, [highlightChanges, previousMarkdown, selectedMarkdown, selectedIndex]);

  const totalHunks = useMemo(() => (diffChanges ? getChangeHunks(diffChanges) : 0), [diffChanges]);

  const currentHunk = Math.min(changeIndex + 1, Math.max(1, totalHunks));

  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (open && versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0] ?? null);
    }
    if (!open) {
      setSelectedVersion(null);
      setChangeIndex(0);
    }
  }, [open, versions, selectedVersion]);

  const handleRestore = async () => {
    if (!selectedVersion || !documentId) return;
    setIsRestoring(true);
    try {
      const result = await updateDocument({
        documentId,
        content: selectedVersion.content,
      });
      if (result.error) {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Versão restaurada' });
      // Atualizar store e cache no mesmo padrão do editor e do chat (aplicar no documento)
      const contentRestored = JSON.parse(JSON.stringify(selectedVersion.content));
      if (currentDocument?.id === documentId) {
        const updated = { ...currentDocument, content: contentRestored };
        setCurrentDocument(updated);
        queryClient.setQueryData(
          queryKeys.documents.detail(workspaceId, documentId).queryKey,
          (old: unknown) => (old ? { ...(old as object), ...updated } : updated),
        );
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.documents.versions(documentId).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.tree(workspaceId).queryKey,
      });
      onOpenChange(false);
    } finally {
      setIsRestoring(false);
    }
  };

  const displayVersions = useMemo(() => {
    if (!versions.length) return [];
    return [...versions];
  }, [versions]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] w-[95vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-background shadow-xl focus:outline-none animate-scale-in"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <Dialog.Title className="text-base font-semibold">Histórico do documento</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <HistoryVersionList
              versions={displayVersions}
              selectedVersion={selectedVersion}
              isLoading={isLoading}
              isRestoring={isRestoring}
              onSelectVersion={(v) => {
                setSelectedVersion(v);
                setChangeIndex(0);
              }}
              onCancel={() => onOpenChange(false)}
              onRestore={() => void handleRestore()}
            />

            <HistoryContent
              selectedVersion={selectedVersion}
              highlightChanges={highlightChanges}
              onHighlightChangesChange={setHighlightChanges}
              diffChanges={diffChanges}
              selectedIndex={selectedIndex}
              totalHunks={totalHunks}
              currentHunk={currentHunk}
              changeIndex={changeIndex}
              setChangeIndex={setChangeIndex}
              selectedMarkdown={selectedMarkdown}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
