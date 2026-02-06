import { createQueryKeys } from '@lukemorales/query-key-factory'

export const workspaces = createQueryKeys('workspaces', {
  all: () => ({
    queryKey: ['all'] as const,
    queryFn: null,
  }),
  detail: (id: string) => ({
    queryKey: [id],
    queryFn: null,
  }),
  members: (workspaceId: string) => ({
    queryKey: [workspaceId, 'members'],
    queryFn: null,
  }),
  invites: (workspaceId: string) => ({
    queryKey: [workspaceId, 'invites'],
    queryFn: null,
  }),
})
