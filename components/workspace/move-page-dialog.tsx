import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useState } from 'react';
import { moveDocumentToProject } from '@/app/actions/documents';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjects } from '@/hooks/use-projects';
import type { ProjectWithCount } from '@/app/actions/projects';

interface MovePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  workspaceId: string;
  currentProjectId: string | null;
  onMoved?: (targetProjectId: string | null) => void;
}

export function MovePageDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  workspaceId,
  currentProjectId,
  onMoved,
}: MovePageDialogProps) {
  const { toast } = useToast();
  const { data: projects, isLoading } = useProjects(workspaceId);
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableProjects = useMemo(
    () => (projects || []).filter((p: ProjectWithCount) => p.id !== currentProjectId),
    [projects, currentProjectId],
  );

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return availableProjects;
    return availableProjects.filter((p: ProjectWithCount) =>
      p.name.toLowerCase().includes(term),
    );
  }, [availableProjects, search]);

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectId == null || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await moveDocumentToProject({
        documentId,
        targetProjectId: selectedProjectId,
      });

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Documento movido',
        description: 'O documento foi movido para o projeto selecionado.',
      });

      onMoved?.(result.data?.targetProjectId ?? selectedProjectId);
      onOpenChange(false);
      setSearch('');
      setSelectedProjectId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasOtherProjects = availableProjects.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 focus:outline-none">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border bg-background/95 p-6 shadow-xl animate-scale-in space-y-5"
          >
            <div className="space-y-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Mover documento
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Mover documento para outro projeto do mesmo workspace.
              </Dialog.Description>
              <p className="text-xs text-muted-foreground mt-1">
                Documento atual: <span className="font-medium text-foreground">{documentTitle}</span>
              </p>
            </div>

            <div className="space-y-3">
              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">
                  Pesquisar projetos
                </span>
                <Input
                  placeholder="Pesquisar projetos"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={isLoading || !hasOtherProjects || isSubmitting}
                  className="mt-1"
                />
              </label>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-border/60 bg-muted/20">
                {isLoading ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground">
                    Carregando projetos...
                  </div>
                ) : !hasOtherProjects ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground">
                    Não há outros projetos disponíveis para mover este documento.
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground">
                    Nenhum projeto encontrado para &quot;{search}&quot;.
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {filteredProjects.map((p: ProjectWithCount) => {
                      const isSelected = selectedProjectId === p.id;
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedProjectId(p.id)}
                            className={`flex w-full items-center justify-between px-3 py-2.5 text-sm text-left transition-smooth ${
                              isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
                            }`}
                          >
                            <span className="truncate">{p.name}</span>
                            <span
                              className={`ml-2 h-4 w-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-primary bg-primary'
                                  : 'border-border bg-background'
                              }`}
                            >
                              {isSelected && (
                                <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedProjectId === null || !hasOtherProjects}
              >
                {isSubmitting ? 'Movendo...' : 'Mover'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
