'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChatCircle, SpinnerGap } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getMarkdownFromContent } from '@/lib/document-content';
import { cn } from '@/lib/utils';

export type AISuggestionsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceDescription: string | null | undefined;
  documentTitle: string | null | undefined;
  documentContent: unknown;
  onInsertSuggestion: (text: string) => void;
};

export function AISuggestionsModal({
  open,
  onOpenChange,
  workspaceDescription,
  documentTitle,
  documentContent,
  onInsertSuggestion,
}: AISuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setSuggestions([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setIsLoading(true);
    setSuggestions([]);

    const docMarkdown = documentContent ? getMarkdownFromContent(documentContent) : '';

    fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceDescription: workspaceDescription?.trim() || '',
        documentTitle: documentTitle?.trim() || '',
        documentContent: docMarkdown.trim().slice(0, 4000),
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Erro ao carregar sugestões');
        }
        if (cancelled) return;
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Erro ao carregar sugestões';
        setError(message);
        setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, workspaceDescription, documentTitle, documentContent]);

  const handleSelect = (text: string) => {
    onInsertSuggestion(text);
    onOpenChange(false);
    toast({ title: 'Sugestão inserida', description: 'A frase foi adicionada ao documento.' });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background shadow-xl focus:outline-none animate-scale-in"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <Dialog.Title className="flex items-center gap-2 text-base font-semibold">
              <ChatCircle size={20} weight="fill" className="text-primary" />
              Sugestões de IA
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-5 pb-5 pt-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Frases geradas com base no workspace e no documento atual. Clique em uma opção para
              inseri-la diretamente na posição atual do cursor.
            </p>

            {isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
                <SpinnerGap size={32} weight="bold" className="animate-spin" />
                <p className="text-sm">Gerando sugestões com base no workspace e no documento...</p>
              </div>
            )}

            {!isLoading && error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {!isLoading && !error && suggestions.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma sugestão disponível. Verifique se a GROQ_API_KEY está configurada no
                servidor.
              </p>
            )}

            {!isLoading && !error && suggestions.length > 0 && (
              <ul className="space-y-2.5">
                {suggestions.map((text, i) => (
                  <li key={i}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'h-auto w-full justify-start whitespace-normal rounded-xl border border-border/40 bg-transparent py-3 px-3 text-left text-sm font-normal transition-colors',
                        'focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:border-primary',
                      )}
                      onClick={() => handleSelect(text)}
                    >
                      {text}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
