'use client'

import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

export type DefaultPageEditMode = 'edit' | 'read'

interface UIState {
  theme: Theme
  setTheme: (theme: Theme) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  treeOpen: boolean
  setTreeOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  fullWidth: boolean
  setFullWidth: (value: boolean) => void
  defaultPageEditMode: DefaultPageEditMode
  setDefaultPageEditMode: (mode: DefaultPageEditMode) => void
}

const THEME_STORAGE_KEY = 'amby-theme'
const FULL_WIDTH_STORAGE_KEY = 'amby-full-width'
const DEFAULT_PAGE_EDIT_MODE_KEY = 'amby-default-page-edit-mode'

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }

  return 'system'
}

const getInitialFullWidth = (): boolean => {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(FULL_WIDTH_STORAGE_KEY)
  return stored === 'true'
}

const getInitialDefaultPageEditMode = (): DefaultPageEditMode => {
  if (typeof window === 'undefined') return 'edit'
  const stored = window.localStorage.getItem(DEFAULT_PAGE_EDIT_MODE_KEY) as DefaultPageEditMode | null
  return stored === 'read' || stored === 'edit' ? stored : 'edit'
}

const applyThemeClass = (theme: Theme) => {
  if (typeof window === 'undefined') return

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', isDark)
}

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    set({ theme })

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    }

    applyThemeClass(theme)
  },
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  treeOpen: true,
  setTreeOpen: (open) => set({ treeOpen: open }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  fullWidth: getInitialFullWidth(),
  setFullWidth: (value) => {
    set({ fullWidth: value })
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FULL_WIDTH_STORAGE_KEY, String(value))
    }
  },
  defaultPageEditMode: getInitialDefaultPageEditMode(),
  setDefaultPageEditMode: (mode) => {
    set({ defaultPageEditMode: mode })
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEFAULT_PAGE_EDIT_MODE_KEY, mode)
    }
  },
}))
