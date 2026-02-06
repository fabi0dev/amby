import { useQuery } from '@tanstack/react-query'

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`)
      if (!res.ok) throw new Error('Erro ao buscar workspace')
      return res.json()
    },
    enabled: !!workspaceId,
  })
}
