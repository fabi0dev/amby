'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk'
import { FileText, Folder } from '@phosphor-icons/react'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useDebounce } from '@/hooks/use-debounce'

export type SearchModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SearchDocument = {
  id: string
  title: string
  slug: string
  workspaceId: string
  updatedAt: string
  workspace: { name: string }
}

type SearchWorkspace = {
  id: string
  name: string
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const [query, setQuery] = useState('')
  const [documents, setDocuments] = useState<SearchDocument[]>([])
  const [workspaces, setWorkspaces] = useState<SearchWorkspace[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 250)

  const runSearch = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setDocuments([])
      setWorkspaces([])
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        ...(currentWorkspace?.id && { workspaceId: currentWorkspace.id }),
      })
      const res = await fetch(`/api/search?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setDocuments(data.documents ?? [])
      setWorkspaces(data.workspaces ?? [])
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, currentWorkspace?.id])

  useEffect(() => {
    if (!open) return
    runSearch()
  }, [open, debouncedQuery, runSearch])

  const closeAndNavigate = (fn: () => void) => {
    onOpenChange(false)
    setQuery('')
    fn()
  }

  const goToDocument = (workspaceId: string, documentId: string) => {
    closeAndNavigate(() => router.push(`/workspace/${workspaceId}/${documentId}`))
  }

  const goToWorkspace = (workspaceId: string) => {
    closeAndNavigate(() => router.push(`/workspace/${workspaceId}`))
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      label="Busca global"
      shouldFilter={false}
      contentClassName="rounded-lg border bg-background shadow-lg p-0 overflow-hidden max-w-2xl"
      overlayClassName="bg-black/40 backdrop-blur-sm"
    >
      <CommandInput
        placeholder="Buscar páginas e workspaces..."
        value={query}
        onValueChange={setQuery}
        className="border-b px-4 py-3 text-sm focus:ring-0 focus-visible:ring-0"
      />
      <CommandList className="max-h-[min(60vh,400px)] p-2">
        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
          {loading ? 'Buscando...' : debouncedQuery.length < 2 ? 'Digite ao menos 2 caracteres' : 'Nenhum resultado'}
        </CommandEmpty>
        {!loading && (documents.length > 0 || workspaces.length > 0) && (
          <>
            {workspaces.length > 0 && (
              <CommandGroup heading="Workspaces">
                {workspaces.map((w) => (
                  <CommandItem
                    key={w.id}
                    value={`workspace-${w.id}`}
                    onSelect={() => goToWorkspace(w.id)}
                    className="gap-2 rounded-md px-2 py-2"
                  >
                    <Folder size={20} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{w.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {documents.length > 0 && (
              <CommandGroup heading="Páginas">
                {documents.map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`doc-${d.id}`}
                    onSelect={() => goToDocument(d.workspaceId, d.id)}
                    className="gap-2 rounded-md px-2 py-2"
                  >
                    <FileText size={20} className="text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{d.title}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {d.workspace.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
