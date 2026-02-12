import { docspaceConfig } from '@/apps/docspace/config';

/**
 * Definição de um app para o dashboard e marketplace.
 * id deve ser único e igual ao usado no UserApp.
 */
export type AppDefinition = {
  id: string;
  name: string;
  slug: string;
  basePath: string;
  /** Nome do ícone Phosphor (ex: FileText, Folder) */
  icon: string;
  description: string;
};

const APPS: AppDefinition[] = [
  {
    ...docspaceConfig,
    icon: 'FileText',
    description: 'Documentação colaborativa: documentos, workspaces e busca.',
  },
  // Novos apps: adicionar aqui e criar pasta apps/<slug>/
];

export const APP_REGISTRY = APPS;

export function getAppById(id: string): AppDefinition | undefined {
  return APPS.find((a) => a.id === id);
}

export function getAvailableAppIds(): string[] {
  return APPS.map((a) => a.id);
}

/** URL do app dentro de um workspace (ex: Docspace = /workspace/[id]). */
export function getAppPathInWorkspace(appId: string, workspaceId: string): string | null {
  switch (appId) {
    case 'docspace':
      return `/workspace/${workspaceId}`;
    default:
      return null;
  }
}
