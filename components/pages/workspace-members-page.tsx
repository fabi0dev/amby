'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Role } from '@prisma/client'
import {
  Users,
  ArrowLeft,
  UserPlus,
  UserMinus,
} from '@phosphor-icons/react'

interface WorkspaceMembersPageProps {
  workspace: {
    id: string
    name: string
    members: Array<{
      id: string
      role: Role
      user: {
        id: string
        name: string | null
        email: string
        image: string | null
      }
    }>
  }
}

const getRoleLabel = (role: Role) => {
  const labels: Record<Role, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    EDITOR: 'Editor',
    VIEWER: 'Visualizador',
  }
  return labels[role]
}

export function WorkspaceMembersPage({ workspace }: WorkspaceMembersPageProps) {
  const router = useRouter()

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center gap-4 max-w-3xl mx-auto px-6 md:px-8 py-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex justify-center">
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
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus size={22} />
                Adicionar membro
              </Button>
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
                      <div className="text-sm text-muted-foreground">
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm px-2 py-1 rounded bg-muted text-muted-foreground">
                      {getRoleLabel(member.role)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <UserMinus size={22} className="text-destructive" />
                    </Button>
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

          <Separator />

          <section className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Workspace atual
            </Label>
            <p className="text-sm text-muted-foreground">
              {workspace.name}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

