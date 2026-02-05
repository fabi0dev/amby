'use client'

import { useMemo, useState } from 'react'
import { updateWorkspace } from '@/app/actions/workspace'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Trash } from '@phosphor-icons/react'
import { Role } from '@prisma/client'
import { PageHeader } from '@/components/layout/page-header'

interface WorkspaceSettingsPageProps {
  workspace: {
    id: string
    name: string
    slug: string
    description: string | null
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

export function WorkspaceSettingsPage({ workspace }: WorkspaceSettingsPageProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(workspace.name)
  const [description, setDescription] = useState(workspace.description || '')

  const workspaceInitials = useMemo(() => {
    const trimmed = workspace.name.trim()
    if (!trimmed) return 'WS'
    const parts = trimmed.split(' ')
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [workspace.name])

  const hostname = useMemo(() => {
    return `${workspace.slug}.amby.com`
  }, [workspace.slug])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await updateWorkspace({
        workspaceId: workspace.id,
        name,
        description: description || null,
      })
      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: 'Workspace atualizado com sucesso',
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar workspace:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar workspace',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = (role: Role) => {
    const labels = {
      OWNER: 'Proprietário',
      ADMIN: 'Administrador',
      EDITOR: 'Editor',
      VIEWER: 'Visualizador',
    }
    return labels[role]
  }

  const handleConfirmDeleteWorkspace = async () => {
    setIsDeleting(true)
    try {
      // TODO: implementar deleteWorkspace server action
      await new Promise((r) => setTimeout(r, 800))
      toast({
        title: 'Em desenvolvimento',
        description: 'Exclusão de workspace será implementada em breve.',
        variant: 'destructive',
      })
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex h-full flex-col mx-auto">
      <PageHeader
        title="Configurações do Espaço"
        description="Gerencie as configurações e membros do workspace"
        showBackButton
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex justify-center">
        <div className="w-full max-w-3xl px-6 py-8 md:px-8 animate-fade-in-up">
          <div className="space-y-10">
            {/* Geral */}
            <div>
              <h2 className="text-xl font-semibold mb-6">Geral</h2>
              <div className="space-y-8 bg-card rounded-lg border p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md bg-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                    {workspaceInitials}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="workspaceName">Nome</Label>
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
                    placeholder="Descrição do workspace (opcional)"
                  />
                </div>



                <div>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Zona de Perigo */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-destructive flex items-center gap-2">
                <Trash className="h-5 w-5" />
                Zona de Perigo
              </h2>
              <div className="space-y-4 bg-card rounded-lg border border-destructive/20 p-6">
                <div>
                  <h3 className="font-semibold mb-2">Excluir Workspace</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ao excluir o workspace, todos os documentos e dados serão permanentemente removidos.
                    Esta ação não pode ser desfeita.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isDeleting}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir Workspace
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Workspace"
        description="Tem certeza? Todos os documentos e dados serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={isDeleting}
        onConfirm={handleConfirmDeleteWorkspace}
      />
      <Toaster />
    </div>
  )
}
