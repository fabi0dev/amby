'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { AppIcon } from './app-icon';
import { Check, Plus, X } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/use-toast';

export type AppDefinition = {
  id: string;
  name: string;
  slug: string;
  basePath: string;
  icon: string;
  description: string;
};

interface AppMarketplaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activatedAppIds: string[];
  onActivatedChange: () => void; // refetch dashboard apps after add/remove
}

export function AppMarketplaceModal({
  open,
  onOpenChange,
  activatedAppIds,
  onActivatedChange,
}: AppMarketplaceModalProps) {
  const [available, setAvailable] = useState<AppDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/dashboard/apps/available')
      .then((r) => r.json())
      .then((data) => {
        setAvailable(data.apps ?? []);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const isActivated = (appId: string) => activatedAppIds.includes(appId);

  const toggleApp = async (appId: string) => {
    if (togglingId) return;
    setTogglingId(appId);
    try {
      if (isActivated(appId)) {
        const res = await fetch(`/api/dashboard/apps/${appId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Falha ao remover');
        toast({ title: 'App removido do seu dashboard' });
      } else {
        const res = await fetch('/api/dashboard/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId }),
        });
        if (!res.ok) throw new Error('Falha ao adicionar');
        toast({ title: 'App adicionado ao seu dashboard' });
      }
      onActivatedChange();
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[9999] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Adicionar apps ao dashboard
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Ative os apps que deseja ver no seu dashboard. Clique para adicionar ou remover.
          </p>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
          ) : (
            <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
              {available.map((app) => {
                const active = isActivated(app.id);
                const busy = togglingId === app.id;
                return (
                  <li
                    key={app.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <AppIcon name={app.icon} size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.description}</p>
                    </div>
                    <Button
                      variant={active ? 'secondary' : 'default'}
                      size="sm"
                      disabled={busy}
                      onClick={() => toggleApp(app.id)}
                      className="shrink-0"
                    >
                      {busy ? (
                        <span className="text-xs">...</span>
                      ) : active ? (
                        <>
                          <Check size={16} className="mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-1" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
