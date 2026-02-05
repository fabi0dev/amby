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

export function useDocumentTree(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.documents.tree(workspaceId).queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/documents/tree?workspaceId=${workspaceId}`)
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
