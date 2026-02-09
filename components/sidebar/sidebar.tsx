'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUIStore } from '@/stores/ui-store';
import { House, MagnifyingGlass, Gear, Plus, CaretDown, Check } from '@phosphor-icons/react';
import { createDocument } from '@/app/actions/documents';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useToast } from '@/components/ui/use-toast';
import { DocumentTree } from '@/components/tree/document-tree';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SIDEBAR_NAV_ITEM, SIDEBAR_NAV_ITEM_ACTIVE } from './sidebar-constants';
import { cn } from '@/lib/utils';

interface SidebarProps {
  workspaceId?: string;
  hasDocument?: boolean;
}

export function Sidebar({ workspaceId: workspaceIdProp, hasDocument = false }: SidebarProps) {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const router = useRouter();
  const workspaceId = workspaceIdProp ?? currentWorkspace?.id;
  const isOverview = !!workspaceId && !hasDocument;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces();

  const handleSwitchWorkspace = (id: string, name: string) => {
    setCurrentWorkspace({ id, name } as typeof currentWorkspace);
    router.push(`/workspace/${id}`);
  };

  const handleSearch = () => {
    setSearchOpen(true);
  };

  const handleNewPage = async () => {
    if (!currentWorkspace) return;
    setIsCreatingPage(true);
    try {
      const result = await createDocument({
        workspaceId: currentWorkspace.id,
        title: 'Nova Página',
      });
      if (result.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.tree(currentWorkspace.id).queryKey,
        });
        toast({ title: 'Página criada' });
        router.push(`/workspace/${currentWorkspace.id}/${result.data.id}?focus=title`);
      } else {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível criar a página',
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreatingPage(false);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card animate-fade-in">
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col flex-1 min-h-0 p-4 space-y-1">
          {currentWorkspace ? (
            <div className="flex flex-col flex-1 min-h-0 pt-2 space-y-4 animate-fade-in-up">
              {/* Seletor de workspace */}
              <div className="flex-shrink-0 px-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                      )}
                      disabled={isLoadingWorkspaces}
                    >
                      <span className="truncate">
                        {isLoadingWorkspaces ? 'Carregando...' : currentWorkspace.name}
                      </span>
                      <CaretDown size={16} className="shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[14rem] max-w-[16rem]">
                    {workspaces.map((w) => (
                      <DropdownMenuItem
                        key={w.id}
                        onClick={() => handleSwitchWorkspace(w.id, w.name)}
                        className="gap-2"
                      >
                        {workspaceId === w.id ? (
                          <Check size={16} className="shrink-0" />
                        ) : (
                          <span className="w-4 shrink-0" />
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
                      <Plus size={16} className="shrink-0" />
                      <div className="flex flex-col">
                        <span className="leading-snug">Novo workspace</span>
                        <span className="text-[11px] text-muted-foreground leading-snug">
                          Crie um espaço separado para outro time ou projeto.
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex-shrink-0">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Geral
                </div>
                <div className="mt-1 space-y-0.5">
                  <Button
                    variant="ghost"
                    asChild
                    className={cn(SIDEBAR_NAV_ITEM, isOverview && SIDEBAR_NAV_ITEM_ACTIVE)}
                  >
                    <Link href={workspaceId ? `/workspace/${workspaceId}` : '#'}>
                      <House size={22} />
                      Visão geral
                    </Link>
                  </Button>
                  <Button variant="ghost" className={SIDEBAR_NAV_ITEM} onClick={handleSearch}>
                    <MagnifyingGlass size={22} />
                    Buscar
                  </Button>
                  <Button variant="ghost" asChild className={SIDEBAR_NAV_ITEM}>
                    <Link href={`/settings/workspace/${currentWorkspace.id}`}>
                      <Gear size={22} />
                      Workspace
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className={SIDEBAR_NAV_ITEM}
                    onClick={handleNewPage}
                    disabled={isCreatingPage}
                  >
                    {isCreatingPage ? <LoadingSpinner size="sm" /> : <Plus size={22} />}
                    {isCreatingPage ? 'Criando...' : 'Nova página'}
                  </Button>
                </div>
              </div>
              <DocumentTree
                workspaceId={currentWorkspace.id}
                workspaceName={currentWorkspace.name}
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-4">
              <div className="text-sm font-medium">Nenhum workspace selecionado</div>
              <p className="text-xs text-muted-foreground max-w-[14rem]">
                Crie um novo workspace para organizar documentos de um time ou projeto.
              </p>
              <Button
                size="sm"
                onClick={() => setIsCreateWorkspaceOpen(true)}
                disabled={isLoadingWorkspaces}
                className="mt-1"
              >
                <Plus size={18} className="mr-2" />
                Criar workspace
              </Button>
            </div>
          )}
        </div>
      </div>
      <CreateWorkspaceDialog
        open={isCreateWorkspaceOpen}
        onOpenChange={setIsCreateWorkspaceOpen}
        onCreated={(workspace) => {
          toast({ title: 'Workspace criado' });
          setCurrentWorkspace({
            id: workspace.id,
            name: workspace.name,
          } as typeof currentWorkspace);
          router.push(`/workspace/${workspace.id}`);
        }}
      />
    </div>
  );
}
