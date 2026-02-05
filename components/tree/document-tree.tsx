"use client"

import { useState, useRef, useEffect } from "react"
import { useDocumentTree } from "@/hooks/use-documents"
import { useDocumentStore } from "@/stores/document-store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { createDocument, deleteDocument } from "@/app/actions/documents"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { useToast } from "@/components/ui/use-toast"
import { DotsThree, Plus } from "@phosphor-icons/react"

interface TreeNode {
  id: string
  documentId: string
  parentId: string | null
  path: string
  depth: number
  order: number
  document: {
    id: string
    title: string
    slug: string
    updatedAt: string
  }
}

function TreeItem({ node, workspaceId }: { node: TreeNode; workspaceId: string }) {
  const { setCurrentDocument, currentDocument } = useDocumentStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isActive = currentDocument?.id === node.document.id
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuContainerRef.current?.contains(e.target as Node)) return
      setIsMenuOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isMenuOpen])

  const handleClick = async () => {
    router.push(`/workspace/${workspaceId}/${node.document.id}`)
  }

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen((prev) => !prev)
  }

  const handleDeleteDocument = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      const result = await deleteDocument(node.documentId)
      if (result?.success) {
        if (currentDocument?.id === node.document.id) {
          setCurrentDocument(null)
          router.push(`/workspace/${workspaceId}`)
        }
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.tree(workspaceId).queryKey,
        })
        toast({ title: "Página excluída" })
      } else {
        toast({
          title: "Erro",
          description: result?.error ?? "Não foi possível excluir a página",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  return (
    <div className="select-none" ref={menuContainerRef}>
      <div
        className={`relative flex items-center gap-2 rounded-md px-2 py-1.5 transition-smooth group cursor-pointer ${isActive
          ? "bg-primary/20 border-l-2 border-primary text-primary"
          : "hover:bg-primary/10"
          }`}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
      >
        <span
          className={`text-xs transition-smooth ${isActive
            ? "text-primary"
            : "text-primary/60 group-hover:text-primary"
            }`}
        >
          •
        </span>
        <button
          onClick={handleClick}
          className={`flex-1 text-left text-sm font-medium transition-smooth ${isActive
            ? "text-primary font-semibold"
            : "text-foreground hover:text-primary"
            }`}
        >
          {node.document.title}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 transition-smooth hover:scale-110 hover:bg-primary/20 hover:text-primary ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          onClick={handleToggleMenu}
        >
          <DotsThree size={22} weight="bold" />
        </Button>

        {isMenuOpen && (
          <div className="absolute right-2 top-8 z-20 min-w-[140px] rounded-md border bg-popover py-1 shadow-lg animate-in animate-scale-in origin-top-right">
            <button
              className="flex w-full items-center px-3 py-1.5 text-left text-sm text-destructive transition-smooth hover:bg-destructive/10 rounded-sm mx-1"
              onClick={handleDeleteDocument}
            >
              Excluir página
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Excluir página"
        description="Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export function DocumentTree({ workspaceId }: { workspaceId: string }) {
  const { data: tree, isLoading } = useDocumentTree(workspaceId)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateDocument = async () => {
    setIsCreating(true)
    try {
      const result = await createDocument({
        workspaceId,
        title: "Novo Documento",
      })
      if (result.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.tree(workspaceId).queryKey,
        })
        toast({ title: "Documento criado" })
      } else {
        toast({
          title: "Erro",
          description: result.error ?? "Não foi possível criar o documento",
          variant: "destructive",
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-2">
      <div className="flex items-center justify-between px-1 flex-shrink-0">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Páginas
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-primary/10 hover:text-primary hover:scale-110 transition-smooth"
          onClick={handleCreateDocument}
          disabled={isCreating}
          aria-label={isCreating ? "Criando..." : "Nova página"}
        >
          {isCreating ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Plus size={22} />
          )}
        </Button>
      </div>

      <div className="document-tree-list flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-md border border-border/50 bg-muted/30 py-1 pr-1 transition-smooth">
        {isLoading ? (
          <div className="p-2 text-sm text-muted-foreground animate-pulse">Carregando...</div>
        ) : tree && tree.length > 0 ? (
          <div className="space-y-0.5 pl-1">
            {tree.map((node: TreeNode, index: number) => (
              <div
                key={node.id}
                className="animate-stagger-in"
                style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
              >
                <TreeItem node={node} workspaceId={workspaceId} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 text-sm text-muted-foreground animate-fade-in">
            Nenhum documento ainda. Crie um novo!
          </div>
        )}
      </div>
    </div>
  )
}
