'use client'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import { posToDOMRect } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useDocumentStore } from '@/stores/document-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { updateDocument } from '@/app/actions/documents'
import { useDebounce } from '@/hooks/use-debounce'
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'
import { BlockMenu } from './block-menu'
import { Toolbar } from './toolbar'
import { SaveStatus } from './save-status'
import { DocumentHeaderMenu } from './document-header-menu'

export function Editor() {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useWorkspaceStore()
  const { currentDocument, setCurrentDocument, setIsDirty, setIsSaving } = useDocumentStore()
  const workspaceId = currentWorkspace?.id ?? ''
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [fullWidth, setFullWidth] = useState(false)
  const [editorContent, setEditorContent] = useState<any>(currentDocument?.content || null)
  const [lastSavedContent, setLastSavedContent] = useState<string | null>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  /** Ignora o próximo onUpdate vindo de setContent programático ou da montagem inicial do editor */
  const ignoreNextUpdateRef = useRef(true)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Digite "/" para comandos.',
        showOnlyCurrent: true,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskItem.configure({ nested: true }),
      TaskList,
    ],
    immediatelyRender: false,
    editable: !isReadOnly,
    content: currentDocument?.content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    },
    onUpdate: ({ editor }) => {
      if (ignoreNextUpdateRef.current) {
        ignoreNextUpdateRef.current = false
        const content = editor.getJSON()
        setEditorContent(content)
        const { from } = editor.state.selection
        const textBefore = editor.state.doc.textBetween(
          Math.max(0, from - 1),
          from,
          ' '
        )
        setShowBlockMenu(textBefore === '/')
        return
      }
      setIsDirty(true)
      setIsSaving(true)
      const content = editor.getJSON()
      setEditorContent(content)
      const { from } = editor.state.selection
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 1),
        from,
        ' '
      )
      setShowBlockMenu(textBefore === '/')
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === '/') {
          setShowBlockMenu(true)
        }
        if (event.key === 'Escape') {
          setShowBlockMenu(false)
        }
      },
    },
  })

  const debouncedContent = useDebounce(editorContent, 1000)

  // Fechar BubbleMenu ao clicar fora do menu (incluindo ao clicar em outro lugar do editor)
  useEffect(() => {
    if (!editor) return
    const onMouseDown = (e: MouseEvent) => {
      const el = e.target as Element
      const insideBubbleMenu = el?.closest?.('.tippy-box, [data-tippy-root]')
      if (!insideBubbleMenu) {
        const { from } = editor.state.selection
        editor.chain().focus(undefined, { scrollIntoView: false }).setTextSelection(from).run()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [editor])

  useEffect(() => {
    if (editor) editor.setEditable(!isReadOnly)
  }, [editor, isReadOnly])

  useEffect(() => {
    if (editor && currentDocument) {
      const currentContent = JSON.stringify(editor.getJSON())
      const newContent = JSON.stringify(currentDocument.content)

      if (currentContent !== newContent && currentDocument.id) {
        ignoreNextUpdateRef.current = true
        editor.commands.setContent(currentDocument.content)
        setEditorContent(currentDocument.content)
        setLastSavedContent(JSON.stringify(currentDocument.content))
        setIsDirty(false)
        setIsSaving(false)
      }
    }
  }, [editor, currentDocument?.id, currentDocument?.content])

  // Inicializar quando o documento muda (ex.: troca de página)
  useEffect(() => {
    if (currentDocument?.content && currentDocument.id) {
      const contentStr = JSON.stringify(currentDocument.content)
      if (!lastSavedContent || lastSavedContent !== contentStr) {
        ignoreNextUpdateRef.current = true
        setEditorContent(currentDocument.content)
        setLastSavedContent(contentStr)
        setIsDirty(false)
        setIsSaving(false)
      }
    }
  }, [currentDocument?.id, currentDocument?.content])

  useEffect(() => {
    // Não salvar se não tiver conteúdo, documento ou editor
    if (!debouncedContent || !currentDocument?.id || !editor) return

    // Não salvar se não tiver lastSavedContent (primeira vez - apenas inicializar)
    if (!lastSavedContent) {
      setLastSavedContent(JSON.stringify(debouncedContent))
      setIsDirty(false)
      setIsSaving(false)
      return
    }

    // Verificar se o conteúdo realmente mudou comparando com o último conteúdo salvo
    const newContent = JSON.stringify(debouncedContent)

    // Só salvar se o conteúdo mudou
    if (lastSavedContent !== newContent) {
      const saveContent = async () => {
        try {
          // Garantir payload serializável para a Server Action (evita exceção no cliente)
          const serializableContent = JSON.parse(JSON.stringify(debouncedContent))
          const result = await updateDocument({
            documentId: currentDocument.id,
            content: serializableContent,
          })

          if (result.error) {
            console.error('Erro ao salvar:', result.error)
            setIsSaving(false)
          } else if (result.data) {
            setIsDirty(false)
            setIsSaving(false)
            setLastSavedContent(newContent)
            const updated = { ...currentDocument, content: serializableContent }
            setCurrentDocument(updated)
            // Atualizar cache do React Query para refletir ao alternar páginas
            queryClient.setQueryData(
              queryKeys.documents.detail(workspaceId, currentDocument.id).queryKey,
              (old: unknown) => (old ? { ...(old as object), ...updated } : updated)
            )
            queryClient.invalidateQueries({
              queryKey: queryKeys.documents.tree(workspaceId).queryKey,
            })
          }
        } catch (error) {
          console.error('Erro ao salvar documento:', error)
          setIsSaving(false)
        }
      }

      saveContent()
    } else {
      // Se o conteúdo não mudou, garantir que os estados estão corretos
      setIsDirty(false)
      setIsSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent])

  // Focar título ao abrir página nova (?focus=title)
  useEffect(() => {
    if (!currentDocument || searchParams.get('focus') !== 'title') return
    const input = titleInputRef.current
    if (input) {
      input.focus()
      input.select()
      const url = new URL(window.location.href)
      url.searchParams.delete('focus')
      window.history.replaceState({}, '', url.pathname + url.search)
    }
  }, [currentDocument?.id, searchParams])

  if (!editor || !currentDocument) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Selecione um documento para editar
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-background overflow-hidden animate-fade-in">
      {/* Controles no canto superior direito da área do editor (abaixo do header da app) */}
      <div className="absolute top-4 right-4 z-0 flex items-center gap-2">
        <DocumentHeaderMenu
          isReadOnly={isReadOnly}
          onReadOnlyChange={setIsReadOnly}
          fullWidth={fullWidth}
          onFullWidthChange={setFullWidth}
          onInsertSuggestion={(text) => {
            if (!editor) return
            editor
              .chain()
              .focus(undefined, { scrollIntoView: true })
              .insertContent({
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text,
                  },
                ],
              })
              .run()
          }}
        />
        <SaveStatus />
      </div>

      {/* Scroll do documento (título + conteúdo rolam juntos) */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-background animate-fade-in">
        <div
          className={cn(
            'h-full transition-[max-width] duration-200',
            // No modo largura total, dar mais respiro à esquerda (não ficar colado na sidebar)
            fullWidth ? 'w-full pl-10 pr-6' : 'w-full max-w-2xl mx-auto px-6 sm:px-8'
          )}
        >
          {/* Título (rola junto) */}
          <div className="pt-6 pb-2 pr-48">
            <input
              ref={titleInputRef}
              type="text"
              value={currentDocument.title}
              onChange={(e) => {
                setCurrentDocument({
                  ...currentDocument,
                  title: e.target.value,
                })
              }}
              onBlur={async () => {
                if (!currentDocument?.title) return
                try {
                  setIsDirty(true)
                  setIsSaving(true)
                  const result = await updateDocument({
                    documentId: currentDocument.id,
                    title: currentDocument.title,
                  })
                  if (result.data && !result.error) {
                    setIsDirty(false)
                    const updated = { ...currentDocument, title: result.data.title }
                    setCurrentDocument(updated)
                    queryClient.setQueryData(
                      queryKeys.documents.detail(workspaceId, currentDocument.id).queryKey,
                      (old: unknown) => (old ? { ...(old as object), ...updated } : updated)
                    )
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.documents.tree(workspaceId).queryKey,
                    })
                  }
                } catch (err) {
                  console.error('Erro ao salvar título:', err)
                } finally {
                  setIsSaving(false)
                }
              }}
              className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-muted-foreground focus:text-primary transition-smooth"
              placeholder="Sem título"
            />
          </div>

          {/* Conteúdo (com respiro no final) */}
          <div ref={editorWrapperRef} className="relative min-h-full pt-2 pb-24">
            <BubbleMenu
              editor={editor}
              updateDelay={50}
              tippyOptions={{
                duration: 100,
                placement: 'top',
                appendTo: () => document.body,
                getReferenceClientRect: () => {
                  if (!editor || editor.isDestroyed) {
                    return document.body.getBoundingClientRect()
                  }
                  const { view, state } = editor
                  const { from, to } = state.selection
                  try {
                    const rect = posToDOMRect(view, from, to)
                    if (rect.width > 0 || rect.height > 0) return rect
                  } catch {
                    // posToDOMRect pode falhar em algumas posições
                  }
                  return view.dom.getBoundingClientRect()
                },
                popperOptions: {
                  strategy: 'fixed',
                  modifiers: [
                    { name: 'offset', options: { offset: [0, 8] } },
                    { name: 'flip', options: { padding: 8 } },
                    { name: 'preventOverflow', options: { padding: 8 } },
                  ],
                },
              }}
            >
              <Toolbar editor={editor} />
            </BubbleMenu>
            {showBlockMenu && editor && (
              <BlockMenu editor={editor} onClose={() => setShowBlockMenu(false)} />
            )}
            <EditorContent
              editor={editor}
              className="prose prose-slate dark:prose-invert max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-full [&_.ProseMirror]:prose-p:my-2 [&_.ProseMirror]:prose-headings:my-3"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
