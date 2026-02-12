'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
}

export function CreateProjectDialog({ open, onOpenChange, onSubmit }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 focus:outline-none">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border bg-background/95 px-8 py-7 shadow-xl animate-scale-in space-y-6"
          >
            <div className="space-y-2">
              <Dialog.Title className="text-xl font-semibold text-foreground">
                Novo projeto
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Agrupe documentos em um projeto e defina quem pode editar.
              </Dialog.Description>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-name">Nome</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Documentação API"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-desc">Descrição (opcional)</Label>
              <Input
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do projeto"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!name.trim() || isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar projeto'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
