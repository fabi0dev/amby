'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';
import { CaretDown, Check, Plus, Briefcase } from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Nome curto: primeiras letras ou até 2 palavras, máx ~20 chars */
export function getWorkspaceShortName(name: string, maxLen = 20): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    const short = `${words[0]} ${words[1]}`.trim();
    return short.length > maxLen ? short.slice(0, maxLen) + '…' : short;
  }
  return trimmed.slice(0, maxLen) + '…';
}

/**
 * Calcula a rota de destino ao trocar de workspace.
 * Documento inicial do workspace é /w/[id] (apps), não Docspace.
 * Só navega se a tela atual for específica do workspace antigo; caso contrário só atualiza o store.
 */
function getTargetPathWhenSwitchingWorkspace(
  pathname: string | null,
  oldWorkspaceId: string,
  newWorkspaceId: string,
): string | null {
  if (!pathname) return null;
  const prefixW = `/w/${oldWorkspaceId}`;
  const prefixWorkspace = `/workspace/${oldWorkspaceId}`;
  const prefixSettings = `/settings/workspace/${oldWorkspaceId}`;

  if (pathname === prefixW || pathname.startsWith(prefixW + '/')) {
    return pathname.replace(prefixW, `/w/${newWorkspaceId}`);
  }
  if (pathname === prefixWorkspace || pathname.startsWith(prefixWorkspace + '/')) {
    const rest = pathname.slice(prefixWorkspace.length);
    if (rest === '' || rest === '/') return `/workspace/${newWorkspaceId}`;
    if (rest === '/overview' || rest.startsWith('/overview'))
      return `/workspace/${newWorkspaceId}/overview`;
    if (rest.startsWith('/project/')) return `/workspace/${newWorkspaceId}`;
    return `/workspace/${newWorkspaceId}`;
  }
  if (pathname === prefixSettings || pathname.startsWith(prefixSettings + '/')) {
    return pathname.replace(prefixSettings, `/settings/workspace/${newWorkspaceId}`);
  }
  return null;
}

export function WorkspaceSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  const handleSwitch = (id: string, name: string) => {
    setCurrentWorkspace({ id, name } as import('@prisma/client').Workspace);
    const oldId = currentWorkspace?.id;
    const target =
      oldId != null ? getTargetPathWhenSwitchingWorkspace(pathname ?? null, oldId, id) : null;
    if (target != null) {
      router.push(target);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
              'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            disabled={isLoading}
          >
            <Briefcase size={18} className="shrink-0 text-muted-foreground" />
            <span className="truncate max-w-[180px]">
              {isLoading ? 'Carregando...' : (currentWorkspace?.name ?? 'Selecionar workspace')}
            </span>
            <CaretDown size={14} className="shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[14rem] max-w-[16rem]">
          {workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              onClick={() => handleSwitch(w.id, w.name)}
              className="gap-2"
            >
              {currentWorkspace?.id === w.id ? (
                <Check size={16} className="shrink-0" />
              ) : (
                <span className="w-4 shrink-0" />
              )}
              <span className="truncate">{w.name}</span>
            </DropdownMenuItem>
          ))}
          {workspaces.length === 0 && !isLoading && (
            <DropdownMenuItem disabled>Nenhum workspace</DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="mt-1 gap-2 border-t pt-2 text-sm"
          >
            <Plus size={16} className="shrink-0" />
            <span>Novo workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(workspace) => {
          toast({ title: 'Workspace criado' });
          setCurrentWorkspace({
            id: workspace.id,
            name: workspace.name,
          } as import('@prisma/client').Workspace);
          router.push(`/w/${workspace.id}`);
        }}
      />
    </>
  );
}
