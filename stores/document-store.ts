import { create } from 'zustand'
import type { Document, DocumentComment, User } from '@prisma/client'

export type DocumentWithRelations = Document & {
  content: any
  comments?: Array<
    DocumentComment & {
      user?: Pick<User, 'id' | 'name' | 'email' | 'image'>
    }
  >
}

interface DocumentState {
  currentDocument: DocumentWithRelations | null
  setCurrentDocument: (document: DocumentWithRelations | null) => void
  isDirty: boolean
  isSaving: boolean
  setIsDirty: (dirty: boolean) => void
  setIsSaving: (saving: boolean) => void
  activeCommentId: string | null
  setActiveCommentId: (id: string | null) => void
  isCommentsOpen: boolean
  setIsCommentsOpen: (open: boolean) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDocument: null,
  setCurrentDocument: (document) =>
    set({ currentDocument: document, isDirty: false, isSaving: false }),
  isDirty: false,
  isSaving: false,
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  activeCommentId: null,
  setActiveCommentId: (id) => set({ activeCommentId: id }),
  isCommentsOpen: false,
  setIsCommentsOpen: (open) => set({ isCommentsOpen: open }),
}))


