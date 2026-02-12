'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProject } from '@/app/actions/projects';
import { useToast } from '@/components/ui/use-toast';
import type { ProjectFull } from '@/app/actions/projects';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectFull;
  onUpdated?: () => void;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onUpdated,
}: EditProjectDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && project) {
      setName(project.name);
      setDescription(project.description ?? '');
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!project) return;
      const result = await updateProject({
        projectId: project.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (result.data) {
        toast({ title: 'Projeto atualizado' });
        onUpdated?.();
        onOpenChange(false);
      } else {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível atualizar',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 focus:outline-none">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border bg-background/95 px-8 py-7 shadow-xl animate-scale-in space-y-6"
          >
            <Dialog.Title className="text-xl font-semibold text-foreground">
              Editar projeto
            </Dialog.Title>

            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Nome</Label>
              <Input
                id="edit-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do projeto"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-project-desc">Descrição (opcional)</Label>
              <Input
                id="edit-project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!name.trim() || isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
