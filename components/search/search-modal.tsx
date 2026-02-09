'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk';
import { FileText, Folder } from '@phosphor-icons/react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDebounce } from '@/hooks/use-debounce';

export type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Container para o portal (evita layout quebrado; modal fica sempre no topo). */
  container?: HTMLElement | null;
};

type SearchDocument = {
  id: string;
  title: string;
  slug: string;
  workspaceId: string;
  updatedAt: string;
  workspace: { name: string };
};

type SearchWorkspace = {
  id: string;
  name: string;
};

export function SearchModal({ open, onOpenChange, container }: SearchModalProps) {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<SearchDocument[]>([]);
  const [workspaces, setWorkspaces] = useState<SearchWorkspace[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 250);

  const runSearch = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setDocuments([]);
      setWorkspaces([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        ...(currentWorkspace?.id && { workspaceId: currentWorkspace.id }),
      });
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setDocuments(data.documents ?? []);
      setWorkspaces(data.workspaces ?? []);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, currentWorkspace?.id]);

  useEffect(() => {
    if (!open) return;
    runSearch();
  }, [open, debouncedQuery, runSearch]);

  const closeAndNavigate = (fn: () => void) => {
    onOpenChange(false);
    setQuery('');
    fn();
  };

  const goToDocument = (workspaceId: string, documentId: string) => {
    closeAndNavigate(() => router.push(`/workspace/${workspaceId}/${documentId}`));
  };

  const goToWorkspace = (workspaceId: string) => {
    closeAndNavigate(() => router.push(`/workspace/${workspaceId}`));
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      label="Busca global"
      shouldFilter={false}
      container={container ?? undefined}
      contentClassName="fixed left-1/2 top-1/2 z-10 w-[calc(100vw-2rem)] max-w-2xl min-w-[280px] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden pt-0"
      overlayClassName="fixed inset-0 z-10 bg-black/60 pointer-events-auto"
    >
      <CommandInput
        placeholder="Buscar páginas e workspaces..."
        value={query}
        onValueChange={setQuery}
        autoFocus
        disabled={false}
        className="w-full flex-shrink-0 border-b border-border px-4 py-3.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none rounded-t-xl"
      />
      <CommandList className="flex-1 min-h-0 max-h-[min(60vh,400px)] overflow-y-auto overflow-x-hidden px-3 py-2">
        <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
          {loading
            ? 'Buscando...'
            : debouncedQuery.length < 2
              ? 'Digite ao menos 2 caracteres'
              : 'Nenhum resultado'}
        </CommandEmpty>
        {!loading && (documents.length > 0 || workspaces.length > 0) && (
          <>
            {workspaces.length > 0 && (
              <CommandGroup heading="Workspaces" className="first:pt-0">
                {workspaces.map((w) => (
                  <CommandItem
                    key={w.id}
                    value={`workspace-${w.id}`}
                    onSelect={() => goToWorkspace(w.id)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 aria-selected:bg-accent/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/80 text-muted-foreground">
                      <Folder size={18} weight="duotone" />
                    </span>
                    <span className="truncate text-sm font-medium">{w.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {documents.length > 0 && (
              <CommandGroup heading="Páginas" className="pt-1">
                {documents.map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`doc-${d.id}`}
                    onSelect={() => goToDocument(d.workspaceId, d.id)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 aria-selected:bg-accent/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/80 text-muted-foreground">
                      <FileText size={18} weight="duotone" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">{d.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {d.workspace.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
