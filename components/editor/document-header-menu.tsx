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
import { countWords, getMarkdownFromContent } from '@/lib/document-content'
import { deleteDocument } from '@/app/actions/documents'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHistoryModal } from './page-history-modal'
import { AISuggestionsModal } from './ai-suggestions-modal'

export function DocumentHeaderMenu({
  isReadOnly,
  onReadOnlyChange,
  fullWidth,
  onFullWidthChange,
  onInsertSuggestion,
}: {
  isReadOnly: boolean
  onReadOnlyChange: (v: boolean) => void
  fullWidth: boolean
  onFullWidthChange: (v: boolean) => void
  onInsertSuggestion?: (text: string) => void
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

  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)

  const handleAISuggestions = () => {
    if (onInsertSuggestion) {
      setIsSuggestionsOpen(true)
    } else {
      toast({
        title: 'Sugestões de IA',
        description: 'Abra um documento no editor para usar as sugestões de IA.',
      })
    }
  }

  const handleFullWidthToggle = (checked: boolean) => {
    onFullWidthChange(checked)
  }

  const [isMovingToTrash, setIsMovingToTrash] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

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
            <DropdownMenuItem onClick={handleAISuggestions}>
              <ChatCircle size={22} className="mr-2" />
              Sugestões de IA
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={fullWidth}
              onCheckedChange={handleFullWidthToggle}
            >
              <ArrowsOutLineHorizontal size={22} className="mr-2" />
              Largura total
            </DropdownMenuCheckboxItem>
            <DropdownMenuItem onClick={() => setIsHistoryOpen(true)}>
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
      {currentWorkspace && currentDocument && (
        <PageHistoryModal
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          workspaceId={currentWorkspace.id}
          documentId={currentDocument.id}
        />
      )}
      {currentDocument && onInsertSuggestion && (
        <AISuggestionsModal
          open={isSuggestionsOpen}
          onOpenChange={setIsSuggestionsOpen}
          workspaceDescription={currentWorkspace?.description}
          documentTitle={currentDocument.title}
          documentContent={currentDocument.content}
          onInsertSuggestion={onInsertSuggestion}
        />
      )}
    </TooltipProvider>
  )
}
