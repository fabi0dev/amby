'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { User, Envelope, Lock, Trash } from '@phosphor-icons/react'
import { updateUser, changePassword } from '@/app/actions/user'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { PageHeader } from '@/components/layout/page-header'

export function UserSettingsPage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [name, setName] = useState(session?.user?.name || '')
  const [email] = useState(session?.user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await updateUser({ name })
      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        await update()
        toast({
          title: 'Sucesso',
          description: 'Perfil atualizado com sucesso',
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar perfil',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
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
          description: 'Senha alterada com sucesso',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao alterar senha',
        variant: 'destructive',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      // TODO: implementar deleteUser / excluir conta server action
      await new Promise((r) => setTimeout(r, 800))
      toast({
        title: 'Em desenvolvimento',
        description: 'Exclusão de conta será implementada em breve.',
        variant: 'destructive',
      })
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Configurações do Usuário"
        description="Gerencie suas informações pessoais e preferências"
        showBackButton
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex justify-center">
        <div className="w-full max-w-3xl px-6 py-8 md:px-8 animate-fade-in-up">
          {/* Perfil */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Perfil
              </h2>
              <div className="space-y-4 bg-card rounded-lg border p-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="pl-9 bg-muted/50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Segurança */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Segurança
              </h2>
              <div className="space-y-4 bg-card rounded-lg border p-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                  />
                </div>
                <Button variant="outline" onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Zona de Perigo */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-destructive flex items-center gap-2">
                <Trash className="h-5 w-5" />
                Zona de Perigo
              </h2>
              <div className="space-y-4 bg-card rounded-lg border border-destructive/20 p-6">
                <div>
                  <h3 className="font-semibold mb-2">Excluir Conta</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ao excluir sua conta, todos os seus dados serão permanentemente removidos.
                    Esta ação não pode ser desfeita.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isDeletingAccount}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir Conta
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
        title="Excluir Conta"
        description="Tem certeza? Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={isDeletingAccount}
        onConfirm={handleConfirmDeleteAccount}
      />
      <Toaster />
    </div>
  )
}
