import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useDocumentStore } from '@/stores/document-store'
import type { ChatMessage } from './chat-types'

interface UseChatSessionProps {
  open: boolean
}

interface UseChatSessionReturn {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  isSending: boolean
  isLoading: boolean
  error: string | null
  subtitle: string
  listRef: React.RefObject<HTMLDivElement | null>
  handleSend: () => Promise<void>
  handleKeyDown: React.KeyboardEventHandler<HTMLInputElement>
}

export function useChatSession({ open }: UseChatSessionProps): UseChatSessionReturn {
  const { currentWorkspace } = useWorkspaceStore()
  const { currentDocument } = useDocumentStore()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá!',
      createdAt: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const subtitle = useMemo(() => {
    if (error) {
      return error
    }
    if (!currentWorkspace) {
      return 'Você pode conversar aqui mesmo sem workspace. Para contexto da IA, selecione um workspace.'
    }
    return 'Converse com a IA sobre este workspace.'
  }, [currentWorkspace, error])

  useEffect(() => {
    if (!open) return
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  useEffect(() => {
    if (!open) return
    if (!currentWorkspace) return

    const ensureSessionAndMessages = async () => {
      try {
        setIsLoading(true)
        setError(null)

        let id = sessionId

        if (!id) {
          const res = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: currentWorkspace.id,
              documentId: currentDocument?.id ?? null,
              title: currentDocument?.title ?? null,
            }),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(
              (data as any)?.error ||
                'Não foi possível criar a sessão de chat. Verifique se você tem acesso ao workspace.',
            )
          }

          const data = await res.json()
          id = (data as any).id as string
          setSessionId(id)
        }

        const messagesRes = await fetch(`/api/chat/sessions/${id}/messages`, {
          method: 'GET',
        })

        if (!messagesRes.ok) {
          const data = await messagesRes.json().catch(() => ({}))
          throw new Error(
            (data as any)?.error || 'Não foi possível carregar o histórico de mensagens.',
          )
        }

        const data = await messagesRes.json()
        const mapped: ChatMessage[] = (data as any[]).map((m) => ({
          id: m.id,
          role: m.role === 'USER' ? 'user' : 'assistant',
          content: m.content,
          createdAt: new Date(m.createdAt),
        }))

        if (mapped.length === 0) {
          mapped.push({
            id: 'welcome',
            role: 'assistant',
            content: 'Olá!',
            createdAt: new Date(),
          })
        }

        setMessages(mapped)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Ocorreu um erro ao inicializar o chat.'
        setError(message)
        setMessages((prev) =>
          prev.length === 0
            ? [
                {
                  id: 'error',
                  role: 'assistant',
                  content: message,
                  createdAt: new Date(),
                },
              ]
            : prev,
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (!sessionId) {
      void ensureSessionAndMessages()
    }
  }, [
    open,
    currentWorkspace,
    currentDocument?.id,
    currentDocument?.title,
    sessionId,
  ])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isSending || isLoading) return

    setError(null)

    if (!currentWorkspace) {
      const timestamp = new Date()
      const userMessage: ChatMessage = {
        id: `user-${timestamp.getTime()}`,
        role: 'user',
        content: text,
        createdAt: timestamp,
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          'Por enquanto estou respondendo sem o contexto de um workspace. Selecione um workspace para que eu consiga usar a documentação como referência nas próximas respostas.',
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')
      return
    }

    let id = sessionId

    try {
      setIsSending(true)

      if (!id) {
        const res = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
            documentId: currentDocument?.id ?? null,
            title: currentDocument?.title ?? null,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(
            (data as any)?.error ||
              'Não foi possível criar a sessão de chat. Verifique se você tem acesso ao workspace.',
          )
        }

        const data = await res.json()
        id = (data as any).id as string
        setSessionId(id)
      }

      const timestamp = new Date()
      const userMessage: ChatMessage = {
        id: `user-${timestamp.getTime()}`,
        role: 'user',
        content: text,
        createdAt: timestamp,
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')

      await fetch(`/api/chat/sessions/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })

      const historyForModel = [...messages, userMessage].map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

      const completionRes = await fetch(`/api/chat/sessions/${id}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForModel }),
      })

      const completionData = (await completionRes
        .json()
        .catch(() => ({} as any))) as {
        message?: string
        documentMarkdown?: string
        error?: string
      }

      if (!completionRes.ok) {
        const apiError =
          completionData?.message ||
          completionData?.error ||
          'Não foi possível obter a resposta da IA.'
        setError(apiError)
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-error-${Date.now()}`,
            role: 'assistant',
            content: apiError,
            createdAt: new Date(),
          },
        ])
        return
      }

      const assistantText: string =
        completionData?.message || 'Desculpe, não consegui gerar uma resposta.'

      let documentMarkdown: string | undefined = completionData.documentMarkdown

      if (!documentMarkdown) {
        const match = assistantText.match(
          /```DOCUMENT_MARKDOWN\s*([\s\S]*?)```/i,
        )
        if (match?.[1]) {
          documentMarkdown = match[1].trim()
        }
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        createdAt: new Date(),
        actions: documentMarkdown ? { documentMarkdown } : undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao enviar sua mensagem.'
      setError(message)
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: message,
          createdAt: new Date(),
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return {
    messages,
    setMessages,
    input,
    setInput,
    isSending,
    isLoading,
    error,
    subtitle,
    listRef,
    handleSend,
    handleKeyDown,
  }
}

