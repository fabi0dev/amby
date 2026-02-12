import { createQueryKeys } from '@lukemorales/query-key-factory';

export const documents = createQueryKeys('documents', {
  all: (workspaceId: string) => ({
    queryKey: [workspaceId],
    queryFn: null,
  }),
  detail: (workspaceId: string, documentId: string) => ({
    queryKey: [workspaceId, documentId],
    queryFn: null,
  }),
  tree: (workspaceId: string, projectId?: string | null) => ({
    queryKey: [workspaceId, 'tree', projectId ?? 'all'],
    queryFn: null,
  }),
  versions: (documentId: string) => ({
    queryKey: [documentId, 'versions'],
    queryFn: null,
  }),
  comments: (documentId: string) => ({
    queryKey: [documentId, 'comments'],
    queryFn: null,
  }),
  search: (workspaceId: string, query: string) => ({
    queryKey: [workspaceId, 'search', query],
    queryFn: null,
  }),
});
