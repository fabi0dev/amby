'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useUIStore } from '@/stores/ui-store'
import { Toaster } from '@/components/ui/toaster'
import { SearchModal } from '@/components/search/search-modal'
import { ChatWidget } from '@/components/chat/chat-widget'
import {
  Bell,
  CaretRight,
  Check,
  ChatCircleDots,
  Desktop,
  FileText,
  Gear,
  MagnifyingGlass,
  Moon,
  Palette,
  Question,
  SignOut,
  Sun,
  User,
  Users,
  X,
} from '@phosphor-icons/react'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { currentWorkspace } = useWorkspaceStore()
  const { theme, setTheme } = useUIStore()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isCurrentTheme = (value: 'light' | 'dark' | 'system') => theme === value

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
        setIsThemeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm px-6 py-3 z-10 animate-fade-in-down">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer transition-smooth" onClick={() => router.push('/home')}>
            <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-105 transition-smooth">
              <FileText size={22} className="text-primary" weight="bold" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Amby
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl mx-8">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 rounded-md border border-input bg-muted/60 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-smooth shadow-sm"
          >
            <MagnifyingGlass size={22} />
            <span>Buscar... </span>
            <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-primary/10 hover:text-primary hover:scale-105 transition-smooth"
          >
            <Question size={22} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-primary/10 hover:text-primary hover:scale-105 transition-smooth relative"
          >
            <Bell size={22} />
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full animate-pulse"></span>
          </Button>
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-primary/10 hover:text-primary hover:scale-105 transition-smooth"
              onClick={() => setIsUserMenuOpen((open) => !open)}
            >
              <User size={22} />
            </Button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-popover shadow-lg py-2 z-50 animate-fade-in-down origin-top-right">
                <div className="px-4 pb-2 pt-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Espaço de Trabalho
                  </p>
                </div>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    if (currentWorkspace) {
                      router.push(`/settings/workspace/${currentWorkspace.id}`)
                    }
                  }}
                >
                  <Gear size={22} />
                  <span>Configurar workspace</span>
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    if (currentWorkspace) {
                      router.push(`/settings/workspace/${currentWorkspace.id}/members`)
                    }
                  }}
                >
                  <Users size={22} />
                  <span>Gerenciar membros</span>
                </button>

                <div className="my-2 border-t" />

                <div className="px-4 pb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Conta
                  </p>
                </div>
                <div className="px-4 pb-2 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {session?.user?.name?.[0]?.toUpperCase() ||
                      session?.user?.email?.[0]?.toUpperCase() ||
                      '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {session?.user?.name || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {session?.user?.email}
                    </span>
                  </div>
                </div>

                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    router.push('/settings/user')
                  }}
                >
                  <User size={22} />
                  <span>Meu perfil</span>
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    router.push('/settings/preferences')
                  }}
                >
                  <Palette size={22} />
                  <span>Minhas preferências</span>
                </button>

                <div className="relative">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-smooth rounded-md"
                    onClick={() => setIsThemeMenuOpen((open) => !open)}
                  >
                    <span className="flex items-center gap-2">
                      <Palette size={22} />
                      <span>Tema</span>
                    </span>
                    <CaretRight size={22} />
                  </button>

                  {isThemeMenuOpen && (
                    <div className="absolute right-full top-0 mr-2 w-60 rounded-lg border bg-popover shadow-lg py-2 z-50 animate-fade-in-down origin-top-right">
                      <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase">
                        Tema
                      </p>
                      <div className="flex flex-col gap-1 px-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTheme('light')
                            setIsThemeMenuOpen(false)
                            setIsUserMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${isCurrentTheme('light')
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/40'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <Sun size={22} />
                            <span>Claro</span>
                          </span>
                          <Check
                            size={22}
                            className={`${isCurrentTheme('light') ? 'opacity-100' : 'opacity-0'
                              }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTheme('dark')
                            setIsThemeMenuOpen(false)
                            setIsUserMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${isCurrentTheme('dark')
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/40'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <Moon size={22} />
                            <span>Escuro</span>
                          </span>
                          <Check
                            size={22}
                            className={`${isCurrentTheme('dark') ? 'opacity-100' : 'opacity-0'
                              }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTheme('system')
                            setIsThemeMenuOpen(false)
                            setIsUserMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${isCurrentTheme('system')
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/40'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <Desktop size={22} />
                            <span>Sistema</span>
                          </span>
                          <Check
                            size={22}
                            className={`${isCurrentTheme('system') ? 'opacity-100' : 'opacity-0'
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-2 border-t" />

                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-smooth rounded-md"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    signOut()
                  }}
                >
                  <SignOut size={22} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - scroll na página toda */}
      <div className="flex flex-1 min-h-0 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        {children}
      </div>

      {/* Busca global (Ctrl+K) */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Chat IA */}
      <div className="fixed bottom-6 right-6 z-30">
        <Button
          size="icon"
          variant="default"
          className="h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-smooth"
          onClick={() => setChatOpen(true)}
          title="Chat com IA"
        >
          <ChatCircleDots size={24} weight="duotone" />
        </Button>
      </div>

      <ChatWidget open={chatOpen} onOpenChange={setChatOpen} />

      <Toaster />
    </div>
  )
}

