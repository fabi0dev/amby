'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Editor } from '@/components/editor/editor'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useDocumentStore } from '@/stores/document-store'
import { useWorkspace } from '@/hooks/use-workspace'
import { useDocument } from '@/hooks/use-documents'
import { Toaster } from '@/components/ui/toaster'

function LoadingPlaceholder({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[200px] animate-fade-in">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm animate-pulse">{message}</span>
      </div>
    </div>
  )
}

export function WorkspaceLayout({
  workspaceId,
  documentId,
}: {
  workspaceId: string
  documentId?: string
}) {
  const { data: workspace, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId)
  const { data: document, isLoading: isLoadingDocument } = useDocument(
    workspaceId,
    documentId || ''
  )
  const { setCurrentWorkspace } = useWorkspaceStore()
  const { setCurrentDocument } = useDocumentStore()

  const isLoading = isLoadingWorkspace || (!!documentId && isLoadingDocument)

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace)
    }
  }, [workspace, setCurrentWorkspace])

  useEffect(() => {
    if (document) {
      setCurrentDocument(document)
    } else if (!documentId) {
      setCurrentDocument(null)
    }
  }, [document, documentId, setCurrentDocument])

  if (isLoading) {
    return (
      <div className="flex h-full w-full overflow-hidden">
        <div className="w-64 flex-shrink-0 border-r bg-card/95" />
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <LoadingPlaceholder
            message={documentId ? 'Carregando documento...' : 'Carregando espaço...'}
          />
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden animate-fade-in">
      <Sidebar />
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        <Editor />
      </div>
      <Toaster />
    </div>
  )
}
