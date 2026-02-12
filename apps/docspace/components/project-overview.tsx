'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDocumentTree } from '@/hooks/use-documents';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  Pencil,
  Users,
  Plus,
  MagnifyingGlass,
  CaretLeft,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatRecentDate } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { createDocument } from '@/app/actions/documents';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useToast } from '@/components/ui/use-toast';
import { getProject } from '@/app/actions/projects';
import { EditProjectDialog } from '@/apps/docspace/components/edit-project-dialog';
import { ProjectMembersDialog } from '@/apps/docspace/components/project-members-dialog';

interface ProjectOverviewProps {
  workspaceId: string;
  projectId: string;
}

interface TreeDocument {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
}

export function ProjectOverview({ workspaceId, projectId }: ProjectOverviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  });

  const { data: tree, isLoading: isLoadingTree } = useDocumentTree(workspaceId, projectId);

  const recentlyUpdated = useMemo(() => {
    if (!tree || !Array.isArray(tree)) return [];
    const docs = (tree as { document: TreeDocument }[])
      .map((node) => node.document)
      .filter(Boolean);
    return [...docs].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [tree]);

  const filteredPages = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recentlyUpdated;
    return recentlyUpdated.filter((doc) =>
      (doc.title || 'Sem título').toLowerCase().includes(term),
    );
  }, [recentlyUpdated, search]);

  const isLoading = isLoadingProject || isLoadingTree;

  const handleNewPage = async () => {
    setIsCreating(true);
    try {
      const result = await createDocument({
        workspaceId,
        projectId,
        title: 'Novo Documento',
      });
      if (result.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.tree(workspaceId, projectId).queryKey,
        });
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        toast({ title: 'Documento criado' });
        router.push(`/workspace/${workspaceId}/${result.data.id}?focus=title`);
      } else {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível criar o documento',
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading && !project) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[200px] animate-fade-in">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LoadingSpinner size="md" />
          <span className="text-sm animate-pulse">Carregando projeto...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden animate-fade-in">
      <div className="flex-1 overflow-y-auto min-h-0 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="bg-gradient-to-r from-background via-background to-muted/10 shadow-sm">
            <div className="px-6 py-6 md:px-8 space-y-3">
              <button
                type="button"
                onClick={() => router.push(`/workspace/${workspaceId}`)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-smooth"
              >
                <CaretLeft size={14} />
                <span>Docspace</span>
              </button>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
                  {project.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project._count.documents} documento
                    {project._count.documents !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil size={16} />
                    Editar projeto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setMembersOpen(true)}
                  >
                    <Users size={16} />
                    Membros
                  </Button>
                  <Button size="sm" className="gap-2" onClick={handleNewPage} disabled={isCreating}>
                    {isCreating ? <LoadingSpinner size="sm" /> : <Plus size={16} />}
                    Novo documento
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 md:px-8">
            {recentlyUpdated.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlass
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    type="search"
                    placeholder="Buscar documentos deste projeto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
            <nav className="flex items-center gap-2 text-sm font-medium text-primary mb-4">
              <Clock size={20} weight="regular" />
              Atualizado recentemente
            </nav>

            {recentlyUpdated.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-6 py-10 text-center text-sm text-muted-foreground">
                <p>Nenhum documento neste projeto ainda.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-2"
                  onClick={handleNewPage}
                  disabled={isCreating}
                >
                  <Plus size={16} />
                  Criar primeiro documento
                </Button>
              </div>
            ) : filteredPages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-6 py-8 text-center text-sm text-muted-foreground">
                <p>Nenhum documento encontrado para &quot;{search}&quot;.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredPages.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/workspace/${workspaceId}/${doc.id}`)}
                      className={cn(
                        'flex w-full items-center gap-3 px-2 py-3 -mx-2 rounded-lg text-left',
                        'hover:bg-muted/60 transition-smooth group',
                      )}
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted/80 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-smooth">
                        <FileText size={22} weight="regular" />
                      </div>
                      <span className="flex-1 min-w-0 font-medium truncate group-hover:text-primary transition-smooth">
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

      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }}
      />
      <ProjectMembersDialog
        open={membersOpen}
        onOpenChange={setMembersOpen}
        projectId={projectId}
        projectName={project.name}
        workspaceId={project.workspaceId}
      />
    </div>
  );
}
