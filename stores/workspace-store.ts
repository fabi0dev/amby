import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace } from '@prisma/client';

/** Último projeto selecionado por workspace (persiste ao sair do docspace) */
export type LastProjectByWorkspace = Record<string, string | null>;

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  lastProjectIdByWorkspace: LastProjectByWorkspace;
  setLastProjectIdForWorkspace: (workspaceId: string, projectId: string | null) => void;
}

const STORAGE_KEY = 'docmost-current-workspace';

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
      lastProjectIdByWorkspace: {},
      setLastProjectIdForWorkspace: (workspaceId, projectId) =>
        set((s) => ({
          lastProjectIdByWorkspace: {
            ...s.lastProjectIdByWorkspace,
            [workspaceId]: projectId,
          },
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const str = typeof window !== 'undefined' ? sessionStorage.getItem(name) : null;
          if (!str) return null;
          try {
            const { state } = JSON.parse(str);
            return {
              state: {
                currentWorkspace: state?.currentWorkspace ?? null,
                lastProjectIdByWorkspace: state?.lastProjectIdByWorkspace ?? {},
              },
            };
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== 'undefined') sessionStorage.removeItem(name);
        },
      },
      partialize: (s) => ({
        currentWorkspace: s.currentWorkspace,
        lastProjectIdByWorkspace: s.lastProjectIdByWorkspace,
      }),
    },
  ),
);
