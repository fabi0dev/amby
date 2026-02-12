'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useUIStore } from '@/stores/ui-store';
import {
  Briefcase,
  CaretRight,
  Gear,
  Palette,
  SignOut,
  SlidersHorizontal,
  Users,
} from '@phosphor-icons/react';
import { getWorkspaceShortName } from './workspace-switcher';
import { useState, useRef, useEffect } from 'react';
import { ThemePicker, type ThemeValue } from './theme-picker';
interface UserMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

export function UserMenu({ open, onOpenChange, trigger }: UserMenuProps) {
  const { data: session } = useSession();
  const { currentWorkspace } = useWorkspaceStore();
  const { theme, setTheme } = useUIStore();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onOpenChange]);

  const handleThemeChange = (value: ThemeValue) => {
    setTheme(value);
    setIsThemeMenuOpen(false);
    onOpenChange(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {trigger}
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-popover shadow-lg py-2 z-50 animate-fade-in-down origin-top-right">
          {currentWorkspace && (
            <>
              <Link
                href={`/settings/workspace/${currentWorkspace.id}`}
                className="flex w-full items-center uppercase gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
                onClick={() => onOpenChange(false)}
              >
                <Briefcase size={14} className="text-muted-foreground shrink-0" />
                <span> {getWorkspaceShortName(currentWorkspace.name, 24)}</span>
              </Link>

              <div className="my-2 border-t border-border" />
            </>
          )}

          <div className="px-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Conta</p>
          </div>
          <Link
            href="/settings/user"
            className="flex w-full items-center gap-3 px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
            onClick={() => onOpenChange(false)}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {session?.user?.name?.[0]?.toUpperCase() ||
                session?.user?.email?.[0]?.toUpperCase() ||
                '?'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                {session?.user?.name || 'Usuário'}
              </span>
              <span className="text-xs text-muted-foreground truncate">{session?.user?.email}</span>
            </div>
          </Link>
          <Link
            href="/settings/preferences"
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
            onClick={() => onOpenChange(false)}
          >
            <SlidersHorizontal size={22} />
            <span>Minhas preferências</span>
          </Link>

          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
              onClick={() => setIsThemeMenuOpen((o) => !o)}
            >
              <span className="flex items-center gap-2">
                <Palette size={22} />
                <span>Tema</span>
              </span>
              <CaretRight size={22} />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-full top-0 mr-2 w-60 rounded-lg border border-border bg-popover shadow-lg py-2 z-50 animate-fade-in-down origin-top-right">
                <ThemePicker value={theme} onChange={handleThemeChange} />
              </div>
            )}
          </div>

          <div className="my-2 border-t border-border" />

          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-smooth rounded-md"
            onClick={() => {
              onOpenChange(false);
              signOut();
            }}
          >
            <SignOut size={22} />
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}
