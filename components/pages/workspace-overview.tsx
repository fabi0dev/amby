'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDocumentTree } from '@/hooks/use-documents';
import { FileText, Clock } from '@phosphor-icons/react';
import { cn, formatRecentDate } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface TreeDocument {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
}

export function WorkspaceOverview({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { data: tree, isLoading } = useDocumentTree(workspaceId);

  const recentlyUpdated = useMemo(() => {
    if (!tree || !Array.isArray(tree)) return [];
    const docs = (tree as { document: TreeDocument }[])
      .map((node) => node.document)
      .filter(Boolean);
    return [...docs].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [tree]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[200px] animate-fade-in">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LoadingSpinner size="md" />
          <span className="text-sm animate-pulse">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden animate-fade-in">
      <div className="flex-1 overflow-y-auto min-h-0 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="border-b bg-gradient-to-r from-background via-background to-muted/10">
            <div className="px-6 py-6 md:px-8">
              <nav className="flex items-center gap-6" aria-label="Filtros">
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-smooth pb-3 border-b-2 border-primary text-primary',
                  )}
                >
                  <Clock size={22} weight="regular" />
                  Atualizado recentemente
                </button>
              </nav>
            </div>
          </div>

          <div className="px-6 py-6 md:px-8">
            {recentlyUpdated.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center">
                Nenhum documento ainda. Crie uma nova página para começar.
              </p>
            ) : (
              <ul className="space-y-0 divide-y divide-border/60">
                {recentlyUpdated.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/workspace/${workspaceId}/${doc.id}`)}
                      className="flex w-full items-center gap-3 px-2 py-3 -mx-2 rounded-lg text-left hover:bg-muted/60 transition-smooth group"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted/80 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-smooth">
                        <FileText size={22} weight="regular" />
                      </div>
                      <span className="flex-1 min-w-0 font-medium truncate">
                        {doc.title || 'Sem título'}
                      </span>
                      <span className="flex-shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatRecentDate(doc.updatedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
