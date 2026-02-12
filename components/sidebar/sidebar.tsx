'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUIStore } from '@/stores/ui-store';
import { House, Folder, MagnifyingGlass, Gear, Plus, Users } from '@phosphor-icons/react';
import { createDocument } from '@/app/actions/documents';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useToast } from '@/components/ui/use-toast';
import { DocumentTree } from '@/components/tree/document-tree';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SIDEBAR_NAV_ITEM, SIDEBAR_NAV_ITEM_ACTIVE } from './sidebar-constants';
import { cn } from '@/lib/utils';

interface SidebarProps {
  workspaceId?: string;
  hasDocument?: boolean;
  projectId?: string | null;
}

export function Sidebar({
  workspaceId: workspaceIdProp,
  hasDocument = false,
  projectId,
}: SidebarProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const router = useRouter();
  const pathname = usePathname();
  const workspaceId = workspaceIdProp ?? currentWorkspace?.id;
  const isOverview = !!workspaceId && pathname === `/workspace/${workspaceId}/overview`;
  const isDocspaceHome = !!workspaceId && pathname === `/workspace/${workspaceId}` && !hasDocument;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreatingPage, setIsCreatingPage] = useState(false);

  const handleSearch = () => {
    setSearchOpen(true);
  };

  const handleNewPage = async () => {
    if (!currentWorkspace) return;
    setIsCreatingPage(true);
    try {
      const result = await createDocument({
        workspaceId: currentWorkspace.id,
        title: 'Novo Documento',
        ...(projectId && { projectId }),
      });
      if (result.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.tree(currentWorkspace.id, projectId).queryKey,
        });
        toast({ title: 'Documento criado' });
        router.push(`/workspace/${currentWorkspace.id}/${result.data.id}?focus=title`);
      } else {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível criar o documento',
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreatingPage(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex h-full w-64 flex-col bg-gradient-to-b from-background/95 via-background to-muted/20 border-r border-border/40 animate-fade-in">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-4">
          <p className="text-sm text-muted-foreground max-w-[14rem]">
            Selecione um workspace no header para acessar o Docspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-background/95 via-background to-muted/20 border-r border-border/40 animate-fade-in">
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col flex-1 min-h-0 p-4 space-y-1">
          <div className="flex flex-col flex-1 min-h-0 pt-2 space-y-4 animate-fade-in-up">
            <div className="flex-shrink-0 rounded-xl bg-muted/10 px-3 py-2 space-y-1 shadow-sm">
              <div className="px-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Workspace
              </div>
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="sm" asChild className="justify-start gap-2 h-8">
                  <Link href={`/settings/workspace/${currentWorkspace.id}`}>
                    <Gear size={18} />
                    Configurações
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="justify-start gap-2 h-8">
                  <Link href={`/settings/workspace/${currentWorkspace.id}/members`}>
                    <Users size={18} />
                    Membros
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Navegação
              </div>
              <div className="mt-1 space-y-0.5">
                <Button
                  variant="ghost"
                  asChild
                  className={cn(SIDEBAR_NAV_ITEM, isDocspaceHome && SIDEBAR_NAV_ITEM_ACTIVE)}
                >
                  <Link href={workspaceId ? `/workspace/${workspaceId}` : '#'}>
                    <Folder size={22} />
                    Projetos
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  asChild
                  className={cn(SIDEBAR_NAV_ITEM, isOverview && SIDEBAR_NAV_ITEM_ACTIVE)}
                >
                  <Link href={workspaceId ? `/workspace/${workspaceId}/overview` : '#'}>
                    <House size={22} />
                    Visão geral
                  </Link>
                </Button>
                <Button variant="ghost" className={SIDEBAR_NAV_ITEM} onClick={handleSearch}>
                  <MagnifyingGlass size={22} />
                  Buscar
                </Button>
                <Button
                  variant="ghost"
                  className={SIDEBAR_NAV_ITEM}
                  onClick={handleNewPage}
                  disabled={isCreatingPage}
                >
                  {isCreatingPage ? <LoadingSpinner size="sm" /> : <Plus size={22} />}
                  {isCreatingPage ? 'Criando...' : 'Novo documento'}
                </Button>
              </div>
            </div>

            <DocumentTree
              workspaceId={currentWorkspace.id}
              workspaceName={currentWorkspace.name}
              projectId={projectId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
