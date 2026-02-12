'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { updateWorkspace, addWorkspaceApp, removeWorkspaceApp } from '@/app/actions/workspace';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SettingsSectionCard } from '@/components/ui/settings-section-card';
import { AppIcon } from '@/components/dashboard/app-icon';
import { APP_REGISTRY } from '@/apps/registry';
import { Trash, Users, Check, Plus } from '@phosphor-icons/react';
import { Role } from '@prisma/client';
import { PageHeader } from '@/components/layout/page-header';
import { useRouter } from 'next/navigation';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';

interface WorkspaceSettingsPageProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    members: Array<{
      id: string;
      role: Role;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
    workspaceApps?: Array<{ appId: string }>;
  };
  canManageWorkspace?: boolean;
}

export function WorkspaceSettingsPage({
  workspace,
  canManageWorkspace = false,
}: WorkspaceSettingsPageProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || '');
  const [togglingAppId, setTogglingAppId] = useState<string | null>(null);

  const enabledAppIds = useMemo(
    () => new Set((workspace.workspaceApps ?? []).map((wa) => wa.appId)),
    [workspace.workspaceApps],
  );

  const workspaceInitials = useMemo(() => {
    const trimmed = workspace.name.trim();
    if (!trimmed) return 'WS';
    const parts = trimmed.split(' ');
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [workspace.name]);

  const hostname = useMemo(() => {
    return `${workspace.slug}.amby.com`;
  }, [workspace.slug]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateWorkspace({
        workspaceId: workspace.id,
        name,
        description: description || null,
      });
      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sucesso',
          description: 'Workspace atualizado com sucesso',
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar workspace:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar workspace',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionLabel = (role: Role) => {
    if (role === 'OWNER' || role === 'ADMIN') return 'Admin';
    return 'Membro';
  };

  const handleToggleWorkspaceApp = async (appId: string) => {
    if (togglingAppId) return;
    setTogglingAppId(appId);
    const isEnabled = enabledAppIds.has(appId);
    const result = isEnabled
      ? await removeWorkspaceApp({ workspaceId: workspace.id, appId })
      : await addWorkspaceApp({ workspaceId: workspace.id, appId });
    setTogglingAppId(null);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    } else {
      toast({
        title: isEnabled ? 'App removido do espaço' : 'App ativado no espaço',
      });
      router.refresh();
    }
  };

  const handleConfirmDeleteWorkspace = async () => {
    setIsDeleting(true);
    try {
      // TODO: implementar deleteWorkspace server action
      await new Promise((r) => setTimeout(r, 800));
      toast({
        title: 'Em desenvolvimento',
        description: 'Exclusão de workspace será implementada em breve.',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-0">
      <PageHeader
        title="Configurações do workspace"
        description={`${workspace.name} — geral, apps e membros`}
        showBackButton
        onBack={() => router.push(`/w/${workspace.id}`)}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/settings/workspace/${workspace.id}/members`} className="gap-2">
                <Users size={18} />
                Membros
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsCreateWorkspaceOpen(true)}>
              Novo workspace
            </Button>
          </div>
        }
      />

      {/* Content - altura natural; scroll fica no MainLayout */}
      <div className="flex justify-center flex-shrink-0">
        <div className="w-full max-w-3xl px-6 py-8 md:px-8 animate-fade-in-up">
          <div className="space-y-10">
            <SettingsSectionCard title="Geral">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                    {workspaceInitials}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="workspaceName">Nome do workspace</Label>
                    <Input
                      id="workspaceName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome do workspace"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspaceDescription">Descrição</Label>
                  <Input
                    id="workspaceDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição (opcional)"
                  />
                </div>

                <div>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </SettingsSectionCard>

            {canManageWorkspace && (
              <SettingsSectionCard
                title="Apps do workspace"
                description="Quem entra neste workspace vê apenas estes apps. Ative ou desative conforme a necessidade do time."
              >
                <ul className="space-y-2">
                  {APP_REGISTRY.map((app) => {
                    const enabled = enabledAppIds.has(app.id);
                    const busy = togglingAppId === app.id;
                    return (
                      <li
                        key={app.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <AppIcon name={app.icon} size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{app.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {app.description}
                          </p>
                        </div>
                        <Button
                          variant={enabled ? 'secondary' : 'default'}
                          size="sm"
                          disabled={busy}
                          onClick={() => handleToggleWorkspaceApp(app.id)}
                          className="shrink-0 gap-1.5"
                        >
                          {busy ? (
                            '...'
                          ) : enabled ? (
                            <>
                              <Check size={16} />
                              Ativo
                            </>
                          ) : (
                            <>
                              <Plus size={16} />
                              Ativar
                            </>
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </SettingsSectionCard>
            )}

            <SettingsSectionCard title="Zona de perigo" icon={<Trash size={22} />} danger>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Excluir workspace</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ao excluir o workspace, todos os documentos e dados serão permanentemente
                    removidos. Esta ação não pode ser desfeita.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isDeleting}
                  >
                    <Trash size={22} className="mr-2" />
                    Excluir workspace
                  </Button>
                </div>
              </div>
            </SettingsSectionCard>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir workspace"
        description="Tem certeza? Todos os documentos e dados serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={isDeleting}
        onConfirm={handleConfirmDeleteWorkspace}
      />
      <CreateWorkspaceDialog
        open={isCreateWorkspaceOpen}
        onOpenChange={setIsCreateWorkspaceOpen}
        onCreated={(newWorkspace) => {
          toast({
            title: 'Workspace criado',
            description: 'Você foi redirecionado para o novo espaço.',
          });
          router.push(`/w/${newWorkspace.id}`);
        }}
      />
    </div>
  );
}
