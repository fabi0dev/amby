'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowsInSimple, ArrowsOutSimple, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { ChatWidgetProps } from './chat-types'
import { useChatSession } from './use-chat-session'
import { useChatApplyToDocument } from './use-chat-apply-to-document'
import { ChatMessagesList } from './chat-messages-list'
import { ChatInputForm } from './chat-input-form'

export function ChatWidget({ open, onOpenChange }: ChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const {
    messages,
    setMessages,
    input,
    setInput,
    isSending,
    isLoading,
    subtitle,
    listRef,
    handleSend,
    handleKeyDown,
  } = useChatSession({ open })

  const { applyingMessageId, canApplyToDocument, handleApplyToDocument } =
    useChatApplyToDocument({ setMessages })

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />

      <div
        className={`fixed z-50 w-full rounded-2xl border bg-card shadow-xl animate-fade-in-up flex flex-col overflow-hidden ${
          isExpanded
            ? 'inset-x-4 bottom-8 top-16 md:inset-x-auto md:right-10 md:bottom-10 md:top-auto md:h-[600px] md:w-[720px]'
            : 'bottom-6 right-6 max-w-md md:max-w-lg h-[360px] md:h-[420px]'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/80 backdrop-blur">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">Chat com IA</span>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {subtitle}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              {isExpanded ? (
                <ArrowsInSimple size={18} />
              ) : (
                <ArrowsOutSimple size={18} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        <ChatMessagesList
          messages={messages}
          listRef={listRef}
          isSending={isSending}
          isLoading={isLoading}
          canApplyToDocument={canApplyToDocument}
          applyingMessageId={applyingMessageId}
          onApplyToDocument={handleApplyToDocument}
        />

        <ChatInputForm
          inputRef={inputRef}
          input={input}
          isLoading={isLoading}
          isSending={isSending}
          onInputChange={setInput}
          onSend={() => void handleSend()}
          onKeyDown={handleKeyDown}
        />
      </div>
    </>
  )
}

