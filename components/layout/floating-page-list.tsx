'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { List, CaretLeft, CaretDown, Check, Folder, FileText } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { DocumentTree } from '@/components/tree/document-tree';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/use-projects';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { cn } from '@/lib/utils';

export const SIDEBAR_PANEL_WIDTH = 280;
const TOP_BAR_OFFSET = 56;

/** Largura reservada quando o painel está fechado (botão flutuante: left 12 + w-10 40 + gap 8) */
export const FLOATING_BUTTON_OFFSET = 60;

interface FloatingPageListProps {
  workspaceId: string;
  workspaceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
}

export function FloatingPageList({
  workspaceId,
  workspaceName,
  open,
  onOpenChange,
  projectId,
}: FloatingPageListProps) {
  const router = useRouter();
  const setLastProjectIdForWorkspace = useWorkspaceStore((s) => s.setLastProjectIdForWorkspace);
  const { data: projects = [], isLoading } = useProjects(workspaceId);

  const currentProject = projectId
    ? projects.find((p: { id: string }) => p.id === projectId)
    : null;

  const panelLabel = currentProject ? currentProject.name : projectId ? 'Projeto' : 'Projetos';

  const { data: hasUnassignedDocuments = false } = useQuery({
    queryKey: ['documents-has-no-project', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/tree?workspaceId=${workspaceId}`);
      if (!res.ok) return false;
      const tree = await res.json();
      return tree.some((n: { document: { projectId?: string | null } }) => !n.document?.projectId);
    },
    enabled: !!workspaceId,
  });

  return (
    <>
      {!open && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(true)}
          className={cn(
            'fixed z-40 h-10 w-10 rounded-full border border-border bg-card shadow-sm',
            'hover:bg-accent hover:border-primary/30 hover:text-primary transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
          style={{
            top: TOP_BAR_OFFSET + 12,
            left: 12,
          }}
          aria-label="Abrir lista de documentos"
        >
          <List size={22} weight="bold" />
        </Button>
      )}

      <div
        className={cn(
          'fixed left-0 z-40 flex flex-col border-r border-border bg-card transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          width: SIDEBAR_PANEL_WIDTH,
          top: TOP_BAR_OFFSET,
          height: `calc(100vh - ${TOP_BAR_OFFSET}px)`,
        }}
      >
        <div className="flex flex-1 flex-col min-h-0">
          <div className="flex shrink-0 flex-col gap-1  border-border px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors',
                      'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                    )}
                    disabled={isLoading}
                  >
                    <Folder size={16} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{isLoading ? 'Carregando...' : panelLabel}</span>
                    <CaretDown size={14} className="shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[12rem] max-w-[14rem]">
                  {hasUnassignedDocuments && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/workspace/${workspaceId}/overview`}
                        className="gap-2"
                        onClick={() => {
                          setLastProjectIdForWorkspace(workspaceId, null);
                          onOpenChange(false);
                        }}
                      >
                        <FileText size={14} className="shrink-0" />
                        <span>Documentos sem projeto</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {projects.map((p: { id: string; name: string }) => (
                    <DropdownMenuItem key={p.id} asChild>
                      <Link
                        href={`/workspace/${workspaceId}/project/${p.id}`}
                        className="gap-2"
                        onClick={() => onOpenChange(false)}
                      >
                        {projectId === p.id ? (
                          <Check size={14} className="shrink-0" />
                        ) : (
                          <span className="w-[14px] shrink-0" />
                        )}
                        <span className="truncate">{p.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/workspace/${workspaceId}`}
                      className="gap-2"
                      onClick={() => {
                        setLastProjectIdForWorkspace(workspaceId, null);
                        onOpenChange(false);
                      }}
                    >
                      {!projectId ? (
                        <Check size={14} className="shrink-0" />
                      ) : (
                        <span className="w-[14px] shrink-0" />
                      )}
                      <span>Todos os projetos</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Recolher painel"
              >
                <CaretLeft size={18} weight="bold" />
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden p-3 pt-0">
            <DocumentTree
              workspaceId={workspaceId}
              workspaceName={workspaceName}
              projectId={projectId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
