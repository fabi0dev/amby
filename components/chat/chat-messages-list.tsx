import type React from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import type { ChatMessage } from './chat-types'

interface ChatMessagesListProps {
  messages: ChatMessage[]
  listRef: React.RefObject<HTMLDivElement | null>
  isSending: boolean
  isLoading: boolean
  canApplyToDocument: boolean
  applyingMessageId: string | null
  onApplyToDocument: (message: ChatMessage) => void
}

export function ChatMessagesList({
  messages,
  listRef,
  isSending,
  isLoading,
  canApplyToDocument,
  applyingMessageId,
  onApplyToDocument,
}: ChatMessagesListProps) {
  return (
    <div
      ref={listRef}
      className="flex-1 px-4 py-4 space-y-2 overflow-y-auto bg-gradient-to-b from-background/80 to-muted/40"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div className="flex flex-col items-stretch gap-2 max-w-[80%]">
            <div
              className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm prose prose-invert prose-xs md:prose-sm break-words [&>p:last-child]:mb-0 [&>p:first-child]:mt-0'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                      <a
                        {...props}
                        target={props.target ?? '_blank'}
                        rel={props.rel ?? 'noreferrer'}
                        className="underline underline-offset-2 decoration-primary/60 hover:decoration-primary"
                      />
                    ),
                    strong: (props: React.HTMLAttributes<HTMLElement>) => (
                      <strong {...props} className="font-semibold" />
                    ),
                    pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
                      <pre
                        {...props}
                        className={`overflow-x-auto max-w-full text-[11px] md:text-[13px] ${
                          props.className ?? ''
                        }`}
                      />
                    ),
                    code: (props: React.HTMLAttributes<HTMLElement>) => (
                      <code
                        {...props}
                        className={`whitespace-pre-wrap break-words ${
                          props.className ?? ''
                        }`}
                      />
                    ),
                    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
                      <ul
                        {...props}
                        className="list-disc list-inside space-y-0.5"
                      />
                    ),
                    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
                      <ol
                        {...props}
                        className="list-decimal list-inside space-y-0.5"
                      />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <span>{message.content}</span>
              )}
            </div>

            {message.role === 'assistant' &&
              message.actions?.documentMarkdown &&
              canApplyToDocument && (
                <div className="flex justify-end gap-2 items-center">
                  {message.actions.applied ? (
                    <span className="text-[11px] text-emerald-500 font-medium">
                      Aplicado!
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={applyingMessageId === message.id}
                      onClick={() => void onApplyToDocument(message)}
                      className="h-7 px-2 text-[11px]"
                    >
                      {applyingMessageId === message.id
                        ? 'Aplicando...'
                        : 'Aplicar no documento'}
                    </Button>
                  )}
                </div>
              )}
          </div>
        </div>
      ))}

      {(isSending || isLoading) && (
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80 animate-bounce [animation-delay:240ms]" />
          </div>
        </div>
      )}
    </div>
  )
}

