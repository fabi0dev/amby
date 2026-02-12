'use client';

import type React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import type { ChatMessage, ChatAction, OpenDocumentAction } from './chat-types';

const MARKDOWN_PLUGINS = [remarkGfm];

/** Garante que o markdown seja sempre uma string para o ReactMarkdown. */
function getMarkdownContent(content: unknown): string {
  if (content == null) return '';
  const raw = typeof content === 'string' ? content : String(content);
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

interface ChatMessagesListProps {
  messages: ChatMessage[];
  listRef: React.Ref<HTMLDivElement>;
  isSending: boolean;
  isLoading: boolean;
  canApplyToDocument: boolean;
  applyingMessageId: string | null;
  onApplyToDocument: (message: ChatMessage) => void;
  onOpenDocument?: (payload: OpenDocumentAction) => void;
  /** Quando true, a área pode crescer com o conteúdo (chat recolhido); a lista continua com scroll. */
  growWithContent?: boolean;
  /** Chamado quando o usuário clica em "Pesquisar no workspace" (query = pergunta original). */
  onSearchWorkspace?: (query: string) => void;
  /** Chamado quando o usuário confirma uma ação do chat (criar workspace, documento, etc.). */
  onExecuteChatAction?: (action: ChatAction) => void;
  /** Indica que uma ação está sendo executada (desabilita botões). */
  executingAction?: boolean;
}

export function ChatMessagesList({
  messages,
  listRef,
  isSending,
  isLoading,
  canApplyToDocument,
  applyingMessageId,
  onApplyToDocument,
  onOpenDocument,
  growWithContent = false,
  onSearchWorkspace,
  onExecuteChatAction,
  executingAction = false,
}: ChatMessagesListProps) {
  return (
    <div
      ref={listRef}
      className={`chat-messages-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 space-y-2 bg-gradient-to-b from-background/80 to-muted/40 ${
        growWithContent ? 'min-h-[12rem]' : ''
      }`}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className="flex flex-col items-stretch gap-2 max-w-[80%]">
            <div
              className={`rounded-2xl px-3 py-2 text-sm shadow-sm min-w-0 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm prose prose-invert prose-xs md:prose-sm break-words [&>p:last-child]:mb-0 [&>p:first-child]:mt-0 [&_code]:min-w-0'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown
                  key={message.id}
                  remarkPlugins={MARKDOWN_PLUGINS}
                  components={{
                    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
                      <h1 {...props} className="text-base font-bold mt-3 mb-1 first:mt-0" />
                    ),
                    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
                      <h2 {...props} className="text-sm font-bold mt-3 mb-1 first:mt-0" />
                    ),
                    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
                      <h3 {...props} className="text-sm font-semibold mt-2 mb-0.5 first:mt-0" />
                    ),
                    h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
                      <h4 {...props} className="text-sm font-semibold mt-2 mb-0.5 first:mt-0" />
                    ),
                    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
                      <p {...props} className="my-1.5 [&:first-child]:mt-0 [&:last-child]:mb-0" />
                    ),
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
                        className={`overflow-x-auto max-w-full text-[11px] md:text-[13px] rounded bg-muted/80 p-2 my-1.5 ${
                          props.className ?? ''
                        }`}
                      />
                    ),
                    code: (props: React.HTMLAttributes<HTMLElement>) => {
                      const isInline = !props.className?.includes('language-');
                      return (
                        <code
                          {...props}
                          className={
                            isInline
                              ? 'px-1 py-0.5 rounded bg-muted/80 text-[12px] font-mono whitespace-nowrap overflow-x-auto max-w-full inline-block align-baseline'
                              : `whitespace-pre-wrap break-words ${props.className ?? ''}`
                          }
                        />
                      );
                    },
                    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
                      <ul {...props} className="list-disc list-inside space-y-0.5 my-1.5 pl-1" />
                    ),
                    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
                      <ol {...props} className="list-decimal list-inside space-y-0.5 my-1.5 pl-1" />
                    ),
                    li: (props: React.HTMLAttributes<HTMLLIElement>) => (
                      <li {...props} className="ml-1" />
                    ),
                  }}
                >
                  {getMarkdownContent(message.content)}
                </ReactMarkdown>
              ) : (
                <span>{message.content}</span>
              )}
            </div>

            {message.role === 'assistant' && (
              <div className="flex justify-end gap-2 items-center flex-wrap">
                {message.actions?.openDocument && onOpenDocument && (
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    title={
                      message.actions.openDocument.documentTitle
                        ? `Abrir: ${message.actions.openDocument.documentTitle}`
                        : 'Abrir documento no editor'
                    }
                    onClick={() => onOpenDocument(message.actions!.openDocument!)}
                    className="h-7 px-2 text-[11px]"
                  >
                    Abrir documento
                  </Button>
                )}
                {message.actions?.chatAction && onExecuteChatAction && (
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={executingAction}
                    onClick={() => onExecuteChatAction(message.actions!.chatAction!)}
                    className="h-7 px-2 text-[11px]"
                  >
                    {executingAction
                      ? 'Criando...'
                      : message.actions.chatAction.type === 'create_workspace'
                        ? `Criar workspace "${message.actions.chatAction.name}"`
                        : `Criar documento "${message.actions.chatAction.title}"`}
                  </Button>
                )}
                {message.actions?.suggestWorkspaceSearch &&
                  message.actions?.workspaceSearchQuery &&
                  onSearchWorkspace && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[11px] text-muted-foreground">
                        Quer pesquisar no workspace inteiro?
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onSearchWorkspace(message.actions!.workspaceSearchQuery!)}
                        className="h-7 px-2 text-[11px] w-fit"
                      >
                        Pesquisar no workspace
                      </Button>
                    </div>
                  )}
                {message.actions?.documentMarkdown && canApplyToDocument && (
                  <>
                    {message.actions.applied ? (
                      <span className="text-[11px] text-emerald-500 font-medium">Aplicado!</span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={applyingMessageId === message.id}
                        onClick={() => void onApplyToDocument(message)}
                        className="h-7 px-2 text-[11px]"
                      >
                        {applyingMessageId === message.id ? 'Aplicando...' : 'Aplicar no documento'}
                      </Button>
                    )}
                  </>
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
  );
}
