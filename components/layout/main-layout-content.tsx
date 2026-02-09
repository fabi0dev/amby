'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TopBar } from './top-bar';
import { useDocumentStore } from '@/stores/document-store';

interface MainLayoutContentProps {
  children: React.ReactNode;
  onSearchOpen: (open: boolean) => void;
}

/** Rota é uma página de documento no workspace? /workspace/[id]/[documentId] */
function isWorkspaceDocumentPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const match = pathname.match(/^\/workspace\/([^/]+)\/([^/]+)$/);
  return Boolean(match && match[1] && match[2]);
}

export function MainLayoutContent({ children, onSearchOpen }: MainLayoutContentProps) {
  const pathname = usePathname();
  const { setCurrentDocument } = useDocumentStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Ao sair da página de um documento, limpa o documento focado para o chat e editor
  useEffect(() => {
    if (!isWorkspaceDocumentPath(pathname)) {
      setCurrentDocument(null);
    }
  }, [pathname, setCurrentDocument]);

  return (
    <>
      <TopBar
        onSearchClick={() => onSearchOpen(true)}
        userMenuOpen={userMenuOpen}
        onUserMenuOpenChange={setUserMenuOpen}
      />

      <div className="flex flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        {children}
      </div>
    </>
  );
}
