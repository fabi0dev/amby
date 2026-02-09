'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createDocument } from '@/app/actions/documents';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUIStore } from '@/stores/ui-store';
import { useToast } from '@/components/ui/use-toast';
import { Plus, MagnifyingGlass, FileText, UsersThree, Clock } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';
import { formatRecentDate } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  documents: Array<{
    id: string;
    title: string;
    slug: string;
    updatedAt: Date;
  }>;
}

interface RecentDocument {
  id: string;
  title: string;
  slug: string;
  updatedAt: Date;
  workspace: {
    id: string;
    name: string;
  };
}

export function HomePage({
  userName,
  workspaces,
  recentDocuments,
}: {
  userName: string;
  workspaces: Workspace[];
  recentDocuments: RecentDocument[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

  // Define um workspace padrão no store quando estiver na Home
  useEffect(() => {
    if (!workspaces.length) return;
    if (!currentWorkspace || !workspaces.some((w) => w.id === currentWorkspace.id)) {
      // Os tipos podem não bater 100% entre Prisma e o tipo local,
      // mas para o store basta garantir id e name.
      setCurrentWorkspace({
        ...(currentWorkspace as any),
        ...workspaces[0],
      } as any);
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

  const handleNewPage = async () => {
    const workspaceId = currentWorkspace?.id || workspaces[0]?.id;
    if (!workspaceId) return;
    setIsCreating(true);
    try {
      const result = await createDocument({
        workspaceId,
        title: 'Nova Página',
      });
      if (result.data) {
        toast({ title: 'Página criada' });
        router.push(`/workspace/${workspaceId}/${result.data.id}?focus=title`);
      } else {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível criar a página',
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewDocument = (workspaceId: string, documentId: string) => {
    router.push(`/workspace/${workspaceId}/${documentId}`);
  };

  const MAX_RECENT = 5;

  const visibleRecentDocuments = recentDocuments.slice(0, MAX_RECENT);

  const getWorkspaceInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  };

  const getWorkspaceFromDocument = (doc: RecentDocument) => {
    return workspaces.find((w) => w.id === doc.workspace.id);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0 flex justify-center">
        <div className="w-full max-w-5xl">
          <header className="px-6 pt-8 md:px-8 flex flex-col gap-2 animate-fade-in-up">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Início
            </p>
            <h1 className="text-2xl font-semibold text-foreground">Olá, {userName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse rapidamente seus espaços e páginas recentes.
            </p>
          </header>

          {/* Espaços */}
          <section className="px-6 pt-8 md:px-8 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Espaços aos quais você pertence
              </h2>
              {workspaces.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {workspaces.length} espaço
                  {workspaces.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {workspaces.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground space-y-3 bg-card/60">
                <p>Você ainda não participa de nenhum espaço.</p>
                <Button size="sm" variant="outline" onClick={() => setIsCreateWorkspaceOpen(true)}>
                  <Plus size={16} className="mr-1" />
                  Criar primeiro workspace
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/workspace/${workspace.id}`}
                    className="group flex flex-col rounded-xl border bg-card/80 px-4 py-4 hover:bg-primary/5 hover:border-primary/40 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                        {getWorkspaceInitials(workspace.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-smooth">
                          {workspace.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {workspace.documents.length} página
                          {workspace.documents.length !== 1 ? 's' : ''} • espaço
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Separador + recentes */}
          <section className="mt-10 border-t bg-gradient-to-r from-background via-background to-muted/10">
            <div className="px-6 py-5 md:px-8">
              <nav
                className="flex items-center gap-2 text-sm font-medium text-primary"
                aria-label="Documentos recentes"
              >
                <Clock size={20} weight="regular" />
                Atualizado recentemente
              </nav>
            </div>

            <div className="px-6 pb-10 md:px-8">
              {visibleRecentDocuments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center">
                  Nenhuma página recente ainda. Crie uma nova página para começar.
                </p>
              ) : (
                <ul className="space-y-0 divide-y divide-border/60">
                  {visibleRecentDocuments.map((doc) => {
                    const workspace = getWorkspaceFromDocument(doc);
                    return (
                      <li key={doc.id}>
                        <button
                          type="button"
                          onClick={() => handleViewDocument(doc.workspace.id, doc.id)}
                          className="flex w-full items-center gap-3 px-2 py-3 -mx-2 rounded-lg text-left hover:bg-muted/60 transition-smooth group"
                        >
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted/80 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-smooth">
                            <FileText size={20} weight="regular" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-smooth">
                              {doc.title || 'Sem título'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.workspace.name}
                            </p>
                          </div>
                          {workspace && (
                            <span className="inline-flex items-center rounded-full border bg-muted/60 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
                              {workspace.name}
                            </span>
                          )}
                          <span className="flex-shrink-0 text-xs text-muted-foreground tabular-nums ml-2">
                            {formatRecentDate(doc.updatedAt)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
      <CreateWorkspaceDialog
        open={isCreateWorkspaceOpen}
        onOpenChange={setIsCreateWorkspaceOpen}
        onCreated={(workspace) => {
          setCurrentWorkspace({
            ...(currentWorkspace as any),
            id: workspace.id,
            name: workspace.name,
          } as any);
          router.push(`/workspace/${workspace.id}`);
        }}
      />
    </div>
  );
}
