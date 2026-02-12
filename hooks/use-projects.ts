import { useQuery } from '@tanstack/react-query';

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/docspace/projects?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error('Erro ao buscar projetos');
      return res.json();
    },
    enabled: !!workspaceId,
  });
}
