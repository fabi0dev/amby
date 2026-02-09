import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useState } from 'react';
import { moveDocumentToWorkspace } from '@/app/actions/documents';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkspaces } from '@/hooks/use-workspaces';

interface MovePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  currentWorkspaceId: string;
  onMoved?: (targetWorkspaceId: string) => void;
}

export function MovePageDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  currentWorkspaceId,
  onMoved,
}: MovePageDialogProps) {
  const { toast } = useToast();
  const { data: workspaces, isLoading } = useWorkspaces();
  const [search, setSearch] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableWorkspaces = useMemo(
    () => (workspaces || []).filter((ws) => ws.id !== currentWorkspaceId),
    [workspaces, currentWorkspaceId],
  );

  const filteredWorkspaces = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return availableWorkspaces;
    return availableWorkspaces.filter((ws) => ws.name.toLowerCase().includes(term));
  }, [availableWorkspaces, search]);

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await moveDocumentToWorkspace({
        documentId,
        targetWorkspaceId: selectedWorkspaceId,
      });

      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      const targetWorkspaceId = result.data?.targetWorkspaceId ?? selectedWorkspaceId;

      toast({
        title: 'Página movida',
        description: 'A página foi movida para o espaço selecionado.',
      });

      onMoved?.(targetWorkspaceId);
      onOpenChange(false);
      setSearch('');
      setSelectedWorkspaceId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasOtherWorkspaces = availableWorkspaces.length > 0;

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
                Mover página
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Mover página para um espaço diferente.
              </Dialog.Description>
              <p className="text-xs text-muted-foreground mt-1">
                Página atual: <span className="font-medium text-foreground">{documentTitle}</span>
              </p>
            </div>

            <div className="space-y-3">
              <label className="space-y-1 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Pesquisar espaços</span>
                <Input
                  placeholder="Pesquisar espaços"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={isLoading || !hasOtherWorkspaces || isSubmitting}
                  className="mt-1"
                />
              </label>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-border/60 bg-muted/20">
                {isLoading ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground">
                    Carregando espaços...
                  </div>
                ) : !hasOtherWorkspaces ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground">
                    Você ainda não possui outros espaços disponíveis para mover esta página.
                  </div>
                ) : filteredWorkspaces.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground">
                    Nenhum espaço encontrado para &quot;{search}&quot;.
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {filteredWorkspaces.map((ws) => {
                      const isSelected = selectedWorkspaceId === ws.id;
                      return (
                        <li key={ws.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedWorkspaceId(ws.id)}
                            className={`flex w-full items-center justify-between px-3 py-2.5 text-sm text-left transition-smooth ${
                              isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
                            }`}
                          >
                            <span className="truncate">{ws.name}</span>
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
                disabled={isSubmitting || !selectedWorkspaceId || !hasOtherWorkspaces}
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
