'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { List, CaretLeft, CaretDown, Check, Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { DocumentTree } from '@/components/tree/document-tree';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useToast } from '@/components/ui/use-toast';
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
}

export function FloatingPageList({
  workspaceId,
  workspaceName,
  open,
  onOpenChange,
}: FloatingPageListProps) {
  const router = useRouter();
  const { setCurrentWorkspace } = useWorkspaceStore();
  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();
  const { toast } = useToast();
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

  const handleSwitchWorkspace = (id: string, name: string) => {
    setCurrentWorkspace({ id, name } as { id: string; name: string });
    router.push(`/workspace/${id}`);
  };

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
          aria-label="Abrir lista de páginas"
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
          <div className="flex shrink-0 flex-col gap-1 border-b border-border px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors',
                      'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                    )}
                    disabled={isLoadingWorkspaces}
                  >
                    <span className="truncate">
                      {isLoadingWorkspaces ? 'Carregando...' : workspaceName}
                    </span>
                    <CaretDown size={14} className="shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[12rem] max-w-[14rem]">
                  {workspaces.map((w) => (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => handleSwitchWorkspace(w.id, w.name)}
                      className="gap-2"
                    >
                      {workspaceId === w.id ? (
                        <Check size={14} className="shrink-0" />
                      ) : (
                        <span className="w-[14px] shrink-0" />
                      )}
                      <span className="truncate">{w.name}</span>
                    </DropdownMenuItem>
                  ))}
                  {workspaces.length === 0 && !isLoadingWorkspaces && (
                    <DropdownMenuItem disabled>Nenhum workspace disponível</DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setIsCreateWorkspaceOpen(true)}
                    className="mt-1 gap-2 border-t pt-2 text-sm"
                  >
                    <Plus size={14} className="shrink-0" />
                    <span className="leading-snug">Novo workspace</span>
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
            <DocumentTree workspaceId={workspaceId} workspaceName={workspaceName} />
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog
        open={isCreateWorkspaceOpen}
        onOpenChange={setIsCreateWorkspaceOpen}
        onCreated={(workspace) => {
          toast({ title: 'Workspace criado' });
          setCurrentWorkspace({ id: workspace.id, name: workspace.name });
          router.push(`/workspace/${workspace.id}`);
        }}
      />
    </>
  );
}
