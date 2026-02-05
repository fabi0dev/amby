'use client'

import { useMemo, useState } from 'react'
import { useDocumentStore } from '@/stores/document-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Globe,
  ChatCircle,
  List,
  DotsThree,
  Link as LinkIcon,
  DownloadSimple,
  ArrowRight,
  Export,
  Printer,
  Trash,
  ClockCounterClockwise,
  ArrowsOutLineHorizontal,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { deleteDocument } from '@/app/actions/documents'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function countWords(content: unknown): number {
  if (!content || typeof content !== 'object') return 0
  const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> }
  let text = ''
  const visit = (node: unknown) => {
    if (node && typeof node === 'object') {
      const n = node as Record<string, unknown>
      if (typeof n.text === 'string') text += n.text + ' '
      if (Array.isArray(n.content)) n.content.forEach(visit)
    }
  }
  visit(doc)
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function getMarkdownFromContent(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const doc = content as { content?: Array<Record<string, unknown>> }
  const parts: string[] = []
  const visit = (nodes: Array<Record<string, unknown>>, listPrefix = '') => {
    for (const node of nodes) {
      const type = node.type as string
      const inner = (node.content as Array<Record<string, unknown>>) || []
      if (type === 'paragraph') {
        const text = inner.map((c) => (c.text as string) || '').join('')
        parts.push(listPrefix ? `${listPrefix} ${text}` : text)
      } else if (type === 'heading') {
        const attrs = node.attrs as { level?: number } | undefined
        const level = attrs?.level ?? 1
        const text = inner.map((c) => (c.text as string) || '').join('')
        parts.push(`${'#'.repeat(level)} ${text}`)
      } else if (type === 'bulletList' || type === 'orderedList') {
        const isOrdered = type === 'orderedList'
        inner.forEach((item, i) => {
          const prefix = isOrdered ? `${i + 1}.` : '-'
          visit((item.content as Array<Record<string, unknown>>) || [], prefix)
        })
      } else if (type === 'blockquote') {
        const text = inner.map((c) => (c.text as string) || '').join('')
        parts.push(`> ${text}`)
      } else {
        visit(inner, listPrefix)
      }
    }
  }
  if (Array.isArray(doc.content)) visit(doc.content)
  return parts.filter(Boolean).join('\n\n')
}

export function DocumentHeaderMenu({
  isReadOnly,
  onReadOnlyChange,
  fullWidth,
  onFullWidthChange,
}: {
  isReadOnly: boolean
  onReadOnlyChange: (v: boolean) => void
  fullWidth: boolean
  onFullWidthChange: (v: boolean) => void
}) {
  const { currentDocument } = useDocumentStore()
  const { currentWorkspace } = useWorkspaceStore()
  const router = useRouter()
  const { toast } = useToast()

  const wordCount = useMemo(
    () => (currentDocument?.content ? countWords(currentDocument.content) : 0),
    [currentDocument?.content]
  )

  const handleCopyLink = async () => {
    if (!currentDocument || !currentWorkspace) return
    const url = typeof window !== 'undefined' ? `${window.location.origin}/workspace/${currentWorkspace.id}/${currentDocument.id}` : ''
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copiado', description: 'O link foi copiado para a área de transferência.' })
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar o link.', variant: 'destructive' })
    }
  }

  const handleCopyMarkdown = async () => {
    if (!currentDocument?.content) return
    const md = getMarkdownFromContent(currentDocument.content)
    try {
      await navigator.clipboard.writeText(md)
      toast({ title: 'Markdown copiado', description: 'O conteúdo foi copiado como Markdown.' })
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar.', variant: 'destructive' })
    }
  }

  const handleFullWidthToggle = (checked: boolean) => {
    onFullWidthChange(checked)
  }

  const [isMovingToTrash, setIsMovingToTrash] = useState(false)

  const handleMoveToTrash = async () => {
    if (!currentDocument || !currentWorkspace || isMovingToTrash) return
    setIsMovingToTrash(true)
    try {
      const result = await deleteDocument(currentDocument.id)
      if (result.error) {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Movido para a lixeira' })
      router.push(`/workspace/${currentWorkspace.id}`)
    } finally {
      setIsMovingToTrash(false)
    }
  }

  if (!currentDocument) return null

  const createdAt = currentDocument.createdAt
    ? format(new Date(currentDocument.createdAt), "EEEE, HH:mm", { locale: ptBR })
    : '—'

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 shrink-0">
        {/* Segmented: Editar / Ler */}
        <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => onReadOnlyChange(false)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              !isReadOnly
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onReadOnlyChange(true)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isReadOnly
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Ler
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <DotsThree size={22} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleCopyLink}>
              <LinkIcon size={22} className="mr-2" />
              Copiar link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyMarkdown}>
              <DownloadSimple size={22} className="mr-2" />
              Copiar como Markdown
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={fullWidth}
              onCheckedChange={handleFullWidthToggle}
            >
              <ArrowsOutLineHorizontal size={22} className="mr-2" />
              Largura total
            </DropdownMenuCheckboxItem>
            <DropdownMenuItem>
              <ClockCounterClockwise size={22} className="mr-2" />
              Histórico da página
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleMoveToTrash}
              disabled={isMovingToTrash}
            >
              <Trash size={22} className="mr-2" weight="fill" />
              {isMovingToTrash ? 'Movendo...' : 'Mover para a lixeira'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground space-y-0.5">
              <p>Contagem de palavras: {wordCount}</p>
              <p>Criado em: {createdAt}</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  )
}
