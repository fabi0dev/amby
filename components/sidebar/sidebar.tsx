'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/stores/workspace-store'
import {
  House,
  MagnifyingGlass,
  Gear,
  Plus,
} from '@phosphor-icons/react'
import { createDocument } from '@/app/actions/documents'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/components/ui/use-toast'
import { DocumentTree } from '@/components/tree/document-tree'

export function Sidebar() {
  const { data: session } = useSession()
  const { currentWorkspace } = useWorkspaceStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isCreatingPage, setIsCreatingPage] = useState(false)

  const handleHome = () => {
    router.push('/home')
  }

  const handleSearch = () => {
    // TODO: Implementar busca
    router.push('/home')
  }

  const handleNewPage = async () => {
    if (!currentWorkspace) return
    setIsCreatingPage(true)
    try {
      const result = await createDocument({
        workspaceId: currentWorkspace.id,
        title: 'Nova Página',
      })
      if (result.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.tree(currentWorkspace.id).queryKey,
        })
        toast({ title: 'Página criada' })
        router.push(`/workspace/${currentWorkspace.id}/${result.data.id}`)
      } else {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível criar a página',
          variant: 'destructive',
        })
      }
    } finally {
      setIsCreatingPage(false)
    }
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 shadow-sm animate-fade-in">
      {/* Navigation */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col flex-1 min-h-0 p-4 space-y-1">
          {/* Home */}
          <Button
            variant="ghost"
            className="w-full justify-start font-medium gap-2 h-9 hover:bg-primary/10 hover:text-primary hover:translate-x-0.5 transition-smooth"
            onClick={handleHome}
          >
            <House className="h-4 w-4" />
            Início
          </Button>

          {/* Geral Section */}
          {currentWorkspace && (
            <div className="flex flex-col flex-1 min-h-0 pt-4 space-y-4 animate-fade-in-up">
              <div className="flex-shrink-0">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Geral
                </div>
                <div className="mt-1 space-y-0.5">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm gap-2 h-8 text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-l-2 hover:border-primary hover:translate-x-0.5 transition-smooth"
                    onClick={handleHome}
                  >
                    <House className="h-3.5 w-3.5" />
                    Visão Geral
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm gap-2 h-8 text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-l-2 hover:border-primary hover:translate-x-0.5 transition-smooth"
                    onClick={handleSearch}
                  >
                    <MagnifyingGlass className="h-3.5 w-3.5" />
                    Buscar
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm gap-2 h-8 text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-l-2 hover:border-primary hover:translate-x-0.5 transition-smooth"
                    onClick={() => router.push(`/settings/workspace/${currentWorkspace.id}`)}
                  >
                    <Gear className="h-3.5 w-3.5" />
                    Configurações do Espaço
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm gap-2 h-8 text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-l-2 hover:border-primary hover:translate-x-0.5 transition-smooth"
                    onClick={handleNewPage}
                    disabled={isCreatingPage}
                  >
                    {isCreatingPage ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {isCreatingPage ? 'Criando...' : 'Nova Página'}
                  </Button>
                </div>
              </div>

              {/* Páginas do workspace */}
              <DocumentTree workspaceId={currentWorkspace.id} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Separator />
      <div className="p-4 animate-fade-in">
        <div className="mb-2 text-sm font-medium text-foreground">
          {session?.user?.name || session?.user?.email}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full transition-smooth hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => signOut()}
        >
          Sair
        </Button>
      </div>
    </div>
  )
}
