'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { X, Link as LinkIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDocumentStore } from '@/stores/document-store';
import { cn } from '@/lib/utils';

type ShareMode = 'read' | 'edit';

export function ShareLinkModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentWorkspace } = useWorkspaceStore();
  const { currentDocument } = useDocumentStore();
  const { toast } = useToast();
  const [mode, setMode] = useState<ShareMode>('edit');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLink = async (nextMode: ShareMode, { copy }: { copy: boolean }) => {
    if (!currentDocument || !currentWorkspace || typeof window === 'undefined') return;
    try {
      setIsGenerating(true);

      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: currentDocument.id,
          mode: nextMode,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error || !result.token) {
        toast({
          title: 'Não foi possível gerar o link',
          description: result.error,
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }

      const url = `${window.location.origin}/share/${result.token}`;
      setShareUrl(url);

      if (copy) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({
          title: 'Link copiado',
        });
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast({
        title: 'Não foi possível copiar o link',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModeChange = async (nextMode: ShareMode) => {
    setMode(nextMode);
    void generateLink(nextMode, { copy: false });
  };

  const handleCopy = async () => {
    // Se ainda não houver link para o modo atual, gera e copia.
    if (!shareUrl) {
      await generateLink(mode, { copy: true });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copiado',
        description: 'O link foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  const canGenerate = !!currentWorkspace && !!currentDocument;

  // Gera o link automaticamente ao abrir o modal
  useEffect(() => {
    if (!open || !canGenerate || shareUrl || isGenerating) return;
    void generateLink(mode, { copy: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canGenerate]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-background shadow-xl focus:outline-none animate-scale-in"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Dialog.Title className="text-base font-semibold">Link de acesso</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4 px-4 py-4">
            {!canGenerate ? (
              <p className="text-sm text-muted-foreground">Abra um documento para gerar um link.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Tipo de acesso
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleModeChange('read')}
                      className={cn(
                        'flex h-full flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                        mode === 'read'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/60',
                      )}
                    >
                      <span className="font-medium">Somente leitura</span>
                      <span className="text-xs text-muted-foreground">Apenas visualização.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleModeChange('edit')}
                      className={cn(
                        'flex h-full flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                        mode === 'edit'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/60',
                      )}
                    >
                      <span className="font-medium">Edição cooperativa</span>
                      <span className="text-xs text-muted-foreground">Edição compartilhada.</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Link
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        readOnly
                        value={shareUrl}
                        className="w-full rounded-md border bg-muted/40 px-3 py-2 pr-9 text-xs font-mono text-muted-foreground shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      />
                      <LinkIcon
                        size={18}
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/70"
                      />
                    </div>
                    <Button type="button" size="sm" onClick={handleCopy} disabled={isGenerating}>
                      {copied ? <>Copiado</> : isGenerating ? <>Gerando</> : <>Copiar</>}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
