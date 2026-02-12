'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, MagnifyingGlass, Bell, Question, User } from '@phosphor-icons/react';
import { APP_NAME } from '@/lib/config';
import { UserMenu } from './user-menu';
import { WorkspaceSwitcher } from './workspace-switcher';
import { useUIStore } from '@/stores/ui-store';

interface TopBarProps {
  onSearchClick?: () => void;
  userMenuOpen: boolean;
  onUserMenuOpenChange: (open: boolean) => void;
}

/** Abre o modal de busca (store); onSearchClick é fallback para compatibilidade. */
function useOpenSearch(onSearchClick?: () => void) {
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  return () => (onSearchClick ? onSearchClick() : setSearchOpen(true));
}

const iconButtonClass =
  'h-9 w-9 hover:bg-primary/10 hover:text-primary hover:scale-105 transition-smooth';

export function TopBar({ onSearchClick, userMenuOpen, onUserMenuOpenChange }: TopBarProps) {
  const openSearch = useOpenSearch(onSearchClick);

  return (
    <div className="relative z-50 flex items-center justify-between border-b border-border bg-card px-6 py-3 animate-fade-in-down">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group cursor-pointer transition-smooth"
        >
          <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-105 transition-smooth">
            <FileText size={22} className="text-primary" weight="bold" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </Link>
      </div>

      <div className="flex-1 max-w-xl mx-8">
        <button
          type="button"
          onClick={openSearch}
          className="w-full flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 transition-smooth cursor-pointer"
        >
          <MagnifyingGlass size={22} className="shrink-0" />
          <span>Buscar...</span>
          <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-0.5 rounded bg-background/60 px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className={iconButtonClass}>
          <Question size={22} />
        </Button>
        <Button variant="ghost" size="icon" className={`${iconButtonClass} relative`}>
          <Bell size={22} />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
        </Button>
        <UserMenu
          open={userMenuOpen}
          onOpenChange={onUserMenuOpenChange}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className={iconButtonClass}
              onClick={() => onUserMenuOpenChange(!userMenuOpen)}
            >
              <User size={22} />
            </Button>
          }
        />
        <div className="h-5 w-px bg-border" aria-hidden />
        <WorkspaceSwitcher />
      </div>
    </div>
  );
}
