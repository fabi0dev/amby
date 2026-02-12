'use client';

import { useEffect, useState } from 'react';
import { MainLayoutContent } from './main-layout-content';
import { Toaster } from '@/components/ui/toaster';
import { SearchModal } from '@/components/search/search-modal';
import { useUIStore } from '@/stores/ui-store';

interface MainLayoutProps {
  children: React.ReactNode;
}

/** Cria um div fixo em document.body para o portal do modal de busca (z-[9999]). */
function useSearchPortalContainer() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.className = 'fixed inset-0 z-[9999] pointer-events-none';
    document.body.appendChild(el);
    setContainer(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);
  return container;
}

export function MainLayout({ children }: MainLayoutProps) {
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const searchPortalContainer = useSearchPortalContainer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const { searchOpen: open, setSearchOpen: setOpen } = useUIStore.getState();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="flex h-screen flex-col bg-background overflow-hidden">
        <MainLayoutContent onSearchOpen={setSearchOpen}>{children}</MainLayoutContent>
        <Toaster />
      </div>

      <SearchModal
        container={searchPortalContainer}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </>
  );
}
