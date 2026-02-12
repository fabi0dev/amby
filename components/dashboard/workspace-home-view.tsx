'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppIcon } from './app-icon';
import { Briefcase, ArrowLeft, Gear } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/stores/workspace-store';

export type WorkspaceApp = {
  id: string;
  name: string;
  icon: string;
  path: string;
};

interface WorkspaceHomeViewProps {
  workspaceId: string;
  workspaceName: string;
  apps: WorkspaceApp[];
}

export function WorkspaceHomeView({ workspaceId, workspaceName, apps }: WorkspaceHomeViewProps) {
  const router = useRouter();
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  useEffect(() => {
    setCurrentWorkspace({
      id: workspaceId,
      name: workspaceName,
    } as import('@prisma/client').Workspace);
  }, [workspaceId, workspaceName, setCurrentWorkspace]);

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0 flex justify-center">
        <div className="w-full max-w-4xl">
          <header className="px-6 pt-8 md:px-8 flex flex-col gap-2 animate-fade-in-up">
            <div className="flex items-start justify-between gap-4 mt-2">
              <div>
                <h1 className="text-2xl font-semibold text-foreground flex flex-row gap-2 items-center  ">
                  <Briefcase /> {workspaceName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Apps disponíveis neste workspace.
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-2" asChild>
                <Link href={`/settings/workspace/${workspaceId}`}>
                  <Gear size={18} />
                  Configurar workspace
                </Link>
              </Button>
            </div>
          </header>

          <section className="px-6 pt-8 md:px-8 animate-fade-in-up">
            <h2 className="text-sm font-semibold text-foreground mb-4">Apps</h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {apps.map((app) => (
                <Link
                  key={app.id}
                  href={app.path}
                  className="group flex flex-col items-center rounded-xl border border-border bg-card/80 p-6 hover:bg-primary/5 hover:border-primary/40 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-105 transition-smooth mb-3">
                    <AppIcon name={app.icon} size={32} />
                  </div>
                  <span className="font-medium text-sm text-center group-hover:text-primary transition-smooth truncate w-full">
                    {app.name}
                  </span>
                </Link>
              ))}
            </div>

            {apps.length === 0 && (
              <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                <p>Nenhum app ativado neste workspace.</p>
                <p className="mt-1 text-xs">
                  Um administrador pode ativar apps em Configurações do workspace.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
