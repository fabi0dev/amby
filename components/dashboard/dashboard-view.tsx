'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, SquaresFour, Briefcase } from '@phosphor-icons/react';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface DashboardViewProps {
  userName: string;
  workspaces: Array<{ id: string; name: string }>;
}

export function DashboardView({ userName, workspaces }: DashboardViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="flex h-full w-full flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0 flex justify-center">
        <div className="w-full max-w-4xl">
          <header className="px-6 pt-8 md:px-8 flex flex-col gap-2 animate-fade-in-up">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <SquaresFour size={14} />
              Dashboard
            </p>
            <h1 className="text-2xl font-semibold text-foreground">Olá, {userName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha um workspace para entrar. Cada workspace tem seus próprios apps e membros e
              não se misturam.
            </p>
          </header>

          <section className="px-6 pt-8 md:px-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Briefcase size={18} />
                Seus workspaces
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="gap-2"
              >
                <Plus size={18} />
                Novo workspace
              </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/w/${workspace.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card/80 p-5 hover:bg-primary/5 hover:border-primary/40 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-smooth">
                    <Briefcase size={28} weight="duotone" />
                  </div>
                  <span className="font-medium text-sm group-hover:text-primary transition-smooth truncate flex-1 min-w-0">
                    {workspace.name}
                  </span>
                </Link>
              ))}
            </div>

            {workspaces.length === 0 && (
              <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                <p className="mb-3">Você ainda não está em nenhum workspace.</p>
                <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Criar primeiro workspace
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(workspace) => {
          toast({
            title: 'Workspace criado',
            description: 'Redirecionando para o workspace.',
          });
          router.push(`/w/${workspace.id}`);
        }}
      />
    </div>
  );
}
