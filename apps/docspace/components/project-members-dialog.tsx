'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProjectMembers, setProjectMember, removeProjectMember } from '@/app/actions/projects';
import { useWorkspace } from '@/hooks/use-workspace';
import { useToast } from '@/components/ui/use-toast';
import { Users, UserPlus, CaretDown, Check } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectRole } from '@prisma/client';

interface ProjectMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  workspaceId: string;
}

const PROJECT_ROLES: { value: ProjectRole; label: string }[] = [
  { value: 'EDITOR', label: 'Editor (pode editar documentos)' },
  { value: 'VIEWER', label: 'Visualizador (somente leitura)' },
];

const roleLabel = (role: ProjectRole) => PROJECT_ROLES.find((r) => r.value === role)?.label ?? role;

export function ProjectMembersDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  workspaceId,
}: ProjectMembersDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addUserId, setAddUserId] = useState<string>('');
  const [addRole, setAddRole] = useState<ProjectRole>('EDITOR');
  const [isAdding, setIsAdding] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: projectMembers = [], isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: open && !!projectId,
  });

  const workspaceMembers = (workspace?.members ?? []) as Array<{
    user: { id: string; name: string | null; email: string };
  }>;
  const projectMemberIds = new Set(projectMembers.map((m) => m.userId));
  const availableToAdd = workspaceMembers.filter((m) => !projectMemberIds.has(m.user.id));

  const handleAddMember = async () => {
    if (!addUserId || isAdding) return;
    setIsAdding(true);
    const result = await setProjectMember({ projectId, userId: addUserId, role: addRole });
    setIsAdding(false);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Membro adicionado ao projeto' });
    queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    setAddUserId('');
    setAddRole('EDITOR');
  };

  const handleUpdateRole = async (userId: string, role: ProjectRole) => {
    setUpdatingRole(userId);
    const result = await setProjectMember({ projectId, userId, role });
    setUpdatingRole(null);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Permissão atualizada' });
    queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
  };

  const handleRemove = async (userId: string) => {
    setRemoving(userId);
    const result = await removeProjectMember(projectId, userId);
    setRemoving(null);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Membro removido do projeto' });
    queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 focus:outline-none rounded-2xl border bg-background/95 px-6 py-6 shadow-xl animate-scale-in">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users size={22} className="text-primary" />
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Membros do projeto: {projectName}
              </Dialog.Title>
            </div>
            <Dialog.Description className="text-sm text-muted-foreground">
              Defina quem pode editar ou apenas visualizar os documentos deste projeto. Apenas membros
              do workspace podem ser adicionados.
            </Dialog.Description>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {projectMembers.map((pm) => (
                    <li
                      key={pm.id}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">
                          {pm.user.name || pm.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{pm.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 min-w-[120px] justify-between text-xs"
                              disabled={updatingRole === pm.userId}
                            >
                              <span className="truncate">{roleLabel(pm.role)}</span>
                              <CaretDown size={14} className="shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {PROJECT_ROLES.map((r) => (
                              <DropdownMenuItem
                                key={r.value}
                                onClick={() => handleUpdateRole(pm.userId, r.value)}
                              >
                                {pm.role === r.value ? (
                                  <Check size={14} className="mr-2 shrink-0" />
                                ) : (
                                  <span className="w-[14px] mr-2 inline-block shrink-0" />
                                )}
                                {r.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(pm.userId)}
                          disabled={removing === pm.userId}
                        >
                          {removing === pm.userId ? <LoadingSpinner size="sm" /> : 'Remover'}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>

                {availableToAdd.length > 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Adicionar membro do workspace
                    </Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[180px] justify-between"
                          >
                            <span className="truncate">
                              {addUserId
                                ? availableToAdd.find((m) => m.user.id === addUserId)?.user.name ||
                                  availableToAdd.find((m) => m.user.id === addUserId)?.user.email ||
                                  'Selecionar'
                                : 'Selecionar membro'}
                            </span>
                            <CaretDown size={14} className="shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {availableToAdd.map((m) => (
                            <DropdownMenuItem
                              key={m.user.id}
                              onClick={() => setAddUserId(m.user.id)}
                            >
                              {addUserId === m.user.id ? (
                                <Check size={14} className="mr-2 shrink-0" />
                              ) : (
                                <span className="w-[14px] mr-2 inline-block shrink-0" />
                              )}
                              {m.user.name || m.user.email}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[140px] justify-between"
                          >
                            <span className="truncate">{roleLabel(addRole)}</span>
                            <CaretDown size={14} className="shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {PROJECT_ROLES.map((r) => (
                            <DropdownMenuItem key={r.value} onClick={() => setAddRole(r.value)}>
                              {addRole === r.value ? (
                                <Check size={14} className="mr-2 shrink-0" />
                              ) : (
                                <span className="w-[14px] mr-2 inline-block shrink-0" />
                              )}
                              {r.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button size="sm" onClick={handleAddMember} disabled={!addUserId || isAdding}>
                        {isAdding ? <LoadingSpinner size="sm" /> : <UserPlus size={16} />}
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}

                {projectMembers.length === 0 && availableToAdd.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum membro no projeto. Adicione membros do workspace acima.
                  </p>
                )}
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
