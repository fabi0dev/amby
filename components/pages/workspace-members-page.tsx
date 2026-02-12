'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Role } from '@prisma/client';
import { Users, ArrowLeft, UserPlus, UserMinus } from '@phosphor-icons/react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  inviteToWorkspace,
  updateMemberRole,
  removeMember,
  cancelInvite,
} from '@/app/actions/workspace';

type Invite = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string | Date;
  invitedBy: { id: string; name: string | null; email: string };
};

interface WorkspaceMembersPageProps {
  workspace: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      userId: string;
      role: Role;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
    invites?: Invite[];
  };
  currentUserId: string;
  canManageMembers: boolean;
}

type InviteRole = 'ADMIN' | 'VIEWER';

const WORKSPACE_PERMISSIONS: { value: InviteRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'VIEWER', label: 'Membro' },
];

const getPermissionLabel = (role: Role) => {
  if (role === 'OWNER' || role === 'ADMIN') return 'Admin';
  return 'Membro';
};

export function WorkspaceMembersPage({
  workspace,
  currentUserId,
  canManageMembers,
}: WorkspaceMembersPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('VIEWER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(
    null,
  );
  const [removeLoading, setRemoveLoading] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null);

  const invites = workspace.invites ?? [];
  const currentMember = workspace.members.find((m) => m.userId === currentUserId);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    const result = await inviteToWorkspace({
      workspaceId: workspace.id,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
    setInviteLoading(false);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Convite enviado' });
    setInviteEmail('');
    setInviteRole('VIEWER');
    setInviteOpen(false);
    router.refresh();
  };

  const handleUpdateRole = async (userId: string, role: InviteRole) => {
    setUpdatingRole(userId);
    const result = await updateMemberRole({ workspaceId: workspace.id, userId, role });
    setUpdatingRole(null);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Permissão atualizada' });
    router.refresh();
  };

  const handleRemove = async () => {
    if (!memberToRemove) return;
    setRemoveLoading(true);
    const result = await removeMember({
      workspaceId: workspace.id,
      userId: memberToRemove.userId,
    });
    setRemoveLoading(false);
    setMemberToRemove(null);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Membro removido' });
    router.refresh();
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingInvite(inviteId);
    const result = await cancelInvite({ workspaceId: workspace.id, inviteId });
    setCancellingInvite(null);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Convite cancelado' });
    router.refresh();
  };

  const canChangeMember = (member: { userId: string; role: Role }) => {
    if (!canManageMembers) return false;
    if (member.role === 'OWNER') return false;
    if (currentMember?.role === 'ADMIN' && member.role === 'ADMIN') return false;
    return true;
  };

  return (
    <div className="flex h-full flex-col mx-auto">
      <div className="border-b bg-card/50">
        <div className="flex items-center gap-4 max-w-5xl mx-auto px-6 md:px-8 py-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/w/${workspace.id}`)}
            className="h-9 w-9"
            title="Voltar ao workspace"
          >
            <ArrowLeft size={22} />
          </Button>
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-semibold truncate">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie quem pode acessar este workspace e quais ações cada pessoa pode realizar.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-shrink-0">
        <div className="w-full max-w-5xl px-6 py-8 md:px-8">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users size={22} />
                    Pessoas neste workspace ({workspace.members.length})
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Veja quem pode acessar este workspace e ajuste permissões de forma segura.
                  </p>
                </div>
                {canManageMembers && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 whitespace-nowrap"
                    onClick={() => setInviteOpen(true)}
                  >
                    <UserPlus size={22} />
                    Adicionar membro
                  </Button>
                )}
              </div>

              <div className="space-y-2 bg-card rounded-lg border p-4 md:p-6">
                {workspace.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-medium leading-tight">
                          {member.user.name || member.user.email}
                        </div>
                        <div className="text-sm text-muted-foreground leading-tight">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canChangeMember(member) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 min-w-[120px]"
                              disabled={updatingRole === member.userId}
                            >
                              {updatingRole === member.userId ? '...' : getPermissionLabel(member.role)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {WORKSPACE_PERMISSIONS.map((perm) => (
                              <DropdownMenuItem
                                key={perm.value}
                                onClick={() => handleUpdateRole(member.userId, perm.value)}
                              >
                                {perm.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-sm px-2 py-1 rounded bg-muted text-muted-foreground">
                        {getPermissionLabel(member.role)}
                        </span>
                      )}
                      {canManageMembers &&
                        member.role !== 'OWNER' &&
                        (currentMember?.role === 'OWNER' || member.role !== 'ADMIN') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              setMemberToRemove({
                                userId: member.userId,
                                name: member.user.name || member.user.email,
                              })
                            }
                          >
                            <UserMinus size={22} />
                          </Button>
                        )}
                    </div>
                  </div>
                ))}

                {workspace.members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro ainda. Adicione alguém para começar a colaborar.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 focus:outline-none">
            <div className="rounded-lg border bg-background p-5 shadow-lg animate-scale-in">
              <Dialog.Title className="text-base font-semibold">Convidar membro</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Envie um convite por e-mail. O usuário precisará ter uma conta no sistema.
              </Dialog.Description>
              <form onSubmit={handleInvite} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="invite-email">E-mail</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="invite-role">Permissão</Label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as InviteRole)}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {WORKSPACE_PERMISSIONS.map((perm) => (
                      <option key={perm.value} value={perm.value}>
                        {perm.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading ? 'Enviando...' : 'Enviar convite'}
                  </Button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={!!memberToRemove}
        title="Remover membro"
        description={
          memberToRemove
            ? `Tem certeza que deseja remover ${memberToRemove.name} do workspace?`
            : undefined
        }
        confirmLabel="Remover"
        loading={removeLoading}
        onConfirm={handleRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      />
    </div>
  );
}
