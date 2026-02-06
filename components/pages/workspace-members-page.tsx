'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Role } from '@prisma/client'
import {
  Users,
  ArrowLeft,
  UserPlus,
  UserMinus,
  PaperPlaneTilt,
  X,
} from '@phosphor-icons/react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  inviteToWorkspace,
  updateMemberRole,
  removeMember,
  cancelInvite,
} from '@/app/actions/workspace'

type Invite = {
  id: string
  email: string
  role: Role
  expiresAt: string | Date
  invitedBy: { id: string; name: string | null; email: string }
}

interface WorkspaceMembersPageProps {
  workspace: {
    id: string
    name: string
    members: Array<{
      id: string
      userId: string
      role: Role
      user: {
        id: string
        name: string | null
        email: string
        image: string | null
      }
    }>
    invites?: Invite[]
  }
  currentUserId: string
  canManageMembers: boolean
}

type InviteRole = 'ADMIN' | 'EDITOR' | 'VIEWER'

const ROLES: { value: InviteRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'VIEWER', label: 'Visualizador' },
]

const getRoleLabel = (role: Role) => {
  const labels: Record<Role, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    EDITOR: 'Editor',
    VIEWER: 'Visualizador',
  }
  return labels[role]
}

export function WorkspaceMembersPage({
  workspace,
  currentUserId,
  canManageMembers,
}: WorkspaceMembersPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteRole>('VIEWER')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null)

  const invites = workspace.invites ?? []

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    const result = await inviteToWorkspace({
      workspaceId: workspace.id,
      email: inviteEmail.trim(),
      role: inviteRole,
    })
    setInviteLoading(false)
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' })
      return
    }
    toast({ title: 'Convite enviado' })
    setInviteEmail('')
    setInviteRole('VIEWER')
    setInviteOpen(false)
    router.refresh()
  }

  const handleUpdateRole = async (userId: string, role: InviteRole) => {
    setUpdatingRole(userId)
    const result = await updateMemberRole({ workspaceId: workspace.id, userId, role })
    setUpdatingRole(null)
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' })
      return
    }
    toast({ title: 'Papel atualizado' })
    router.refresh()
  }

  const handleRemove = async () => {
    if (!memberToRemove) return
    setRemoveLoading(true)
    const result = await removeMember({
      workspaceId: workspace.id,
      userId: memberToRemove.userId,
    })
    setRemoveLoading(false)
    setMemberToRemove(null)
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' })
      return
    }
    toast({ title: 'Membro removido' })
    router.refresh()
  }

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingInvite(inviteId)
    const result = await cancelInvite({ workspaceId: workspace.id, inviteId })
    setCancellingInvite(null)
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' })
      return
    }
    toast({ title: 'Convite cancelado' })
    router.refresh()
  }

  const canChangeMember = (member: { userId: string; role: Role }) => {
    if (!canManageMembers) return false
    if (member.role === 'OWNER') return false
    const current = workspace.members.find((m) => m.userId === currentUserId)
    if (current?.role === 'ADMIN' && member.role === 'ADMIN') return false
    return true
  }

  return (
    <div className="flex h-full flex-col mx-auto">
      <div className="border-b bg-card">
        <div className="flex items-center gap-4 max-w-3xl mx-auto px-6 md:px-8 py-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft size={22} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Membros do Espaço</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie quem pode acessar e colaborar neste workspace
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-shrink-0">
        <div className="w-full max-w-3xl px-6 py-8 md:px-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users size={22} />
                  Membros ({workspace.members.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Convide novas pessoas e gerencie os papéis dos membros existentes.
                </p>
              </div>
              {canManageMembers && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setInviteOpen(true)}
                >
                  <UserPlus size={22} />
                  Adicionar membro
                </Button>
              )}
            </div>

            <div className="space-y-2 bg-card rounded-lg border p-6">
              {workspace.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">
                        {member.user.name || member.user.email}
                      </div>
                      <div className="text-sm text-muted-foreground">{member.user.email}</div>
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
                            {updatingRole === member.userId
                              ? '...'
                              : getRoleLabel(member.role)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ROLES.map((r) => (
                            <DropdownMenuItem
                              key={r.value}
                              onClick={() => handleUpdateRole(member.userId, r.value)}
                            >
                              {r.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-sm px-2 py-1 rounded bg-muted text-muted-foreground">
                        {getRoleLabel(member.role)}
                      </span>
                    )}
                    {canManageMembers &&
                      member.role !== 'OWNER' &&
                      (workspace.members.find((m) => m.userId === currentUserId)?.role ===
                        'OWNER' ||
                        member.role !== 'ADMIN') && (
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

          {canManageMembers && invites.length > 0 && (
            <>
              <Separator />
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <PaperPlaneTilt size={22} />
                  Convites pendentes ({invites.length})
                </h2>
                <div className="space-y-2 bg-card rounded-lg border p-4">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <div className="font-medium">{invite.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {getRoleLabel(invite.role)} · Convite enviado por{' '}
                          {invite.invitedBy.name || invite.invitedBy.email}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        disabled={cancellingInvite === invite.id}
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        {cancellingInvite === invite.id ? '...' : 'Cancelar convite'}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <Separator />

          <section className="space-y-2">
            <Label className="text-xs text-muted-foreground">Workspace atual</Label>
            <p className="text-sm text-muted-foreground">{workspace.name}</p>
          </section>
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
                  <Label htmlFor="invite-role">Papel</Label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as InviteRole)}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
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
  )
}
