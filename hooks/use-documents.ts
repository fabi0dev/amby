import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export function useDocuments(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.documents.all(workspaceId).queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/documents?workspaceId=${workspaceId}`)
      if (!res.ok) throw new Error('Erro ao buscar documentos')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useDocumentTree(workspaceId: string, projectId?: string | null) {
  return useQuery({
    queryKey: queryKeys.documents.tree(workspaceId, projectId).queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ workspaceId })
      if (projectId) params.set('projectId', projectId)
      const res = await fetch(`/api/documents/tree?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar árvore de documentos')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}

export function useDocument(workspaceId: string, documentId: string) {
  return useQuery({
    queryKey: queryKeys.documents.detail(workspaceId, documentId).queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/documents/${workspaceId}/${documentId}`)
      if (!res.ok) throw new Error('Erro ao buscar documento')
      return res.json()
    },
    enabled: !!workspaceId && !!documentId,
  })
}

export type DocumentVersionWithUser = Awaited<
  ReturnType<typeof fetchDocumentVersions>
>

async function fetchDocumentVersions(
  workspaceId: string,
  documentId: string
): Promise<
  Array<{
    id: string
    documentId: string
    userId: string
    content: unknown
    version: number
    createdAt: string
    event?: string | null
    metadata?: unknown
    user: { id: string; name: string | null; image: string | null }
  }>
> {
  const res = await fetch(
    `/api/documents/${workspaceId}/${documentId}/versions`
  )
  if (!res.ok) throw new Error('Erro ao buscar histórico')
  return res.json()
}

export function useDocumentVersions(workspaceId: string, documentId: string) {
  return useQuery({
    queryKey: [...queryKeys.documents.versions(documentId).queryKey, workspaceId],
    queryFn: () => fetchDocumentVersions(workspaceId, documentId),
    enabled: !!workspaceId && !!documentId,
  })
}
