'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowsInSimple,
  ArrowsOutSimple,
  DotsThree,
  Gear,
  Trash,
  ClockCounterClockwise,
  X,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ChatWidgetProps, ChatAction, OpenDocumentAction } from './chat-types';
import { useChatSession } from './use-chat-session';
import type { ChatSessionSummary } from './use-chat-session';
import { useChatApplyToDocument } from './use-chat-apply-to-document';
import { ChatMessagesList } from './chat-messages-list';
import { ChatInputForm } from './chat-input-form';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { createWorkspace } from '@/app/actions/workspace';
import { createDocument } from '@/app/actions/documents';

function formatSessionLabel(s: ChatSessionSummary): string {
  const date = new Date(s.updatedAt);
  const dateStr = date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const base = s.documentTitle || s.title || s.workspaceName || 'Conversa';
  return `${base} · ${dateStr}`;
}

export function ChatWidget({ open, onOpenChange }: ChatWidgetProps) {
  const chatName = 'Assistente IA';

  const router = useRouter();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    setMessages,
    input,
    setInput,
    isSending,
    isLoading,
    error,
    subtitle,
    contextDocumentTitle,
    clearContext,
    listRef,
    handleSend,
    handleKeyDown,
    clearChat,
    loadSessions,
    switchToSession,
  } = useChatSession({ open });

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<ChatSessionSummary[] | null>(null);
  const [showHistoryList, setShowHistoryList] = useState(false);

  useEffect(() => {
    if (!optionsOpen) {
      setHistorySessions(null);
      setShowHistoryList(false);
      return;
    }
    let cancelled = false;
    loadSessions().then((list) => {
      if (!cancelled) setHistorySessions(list);
    });
    return () => {
      cancelled = true;
    };
  }, [optionsOpen, loadSessions]);

  const handleOpenDocument = (payload: OpenDocumentAction) => {
    router.push(`/workspace/${payload.workspaceId}/${payload.documentId}`);
    onOpenChange(false);
  };

  const handleExecuteChatAction = async (action: ChatAction) => {
    if (executingAction) return;
    setExecutingAction(true);
    try {
      if (action.type === 'create_workspace') {
        const result = await createWorkspace({ name: action.name });
        if (result.data) {
          toast({ title: 'Workspace criado' });
          router.push(`/workspace/${result.data.id}`);
          onOpenChange(false);
        } else {
          toast({
            title: 'Erro',
            description: result.error ?? 'Não foi possível criar o workspace',
            variant: 'destructive',
          });
        }
      } else if (action.type === 'create_document') {
        const result = await createDocument({
          workspaceId: action.workspaceId,
          title: action.title,
        });
        if (result.data) {
          toast({ title: 'Documento criado' });
          router.push(`/workspace/${action.workspaceId}/${result.data.id}`);
          onOpenChange(false);
        } else {
          toast({
            title: 'Erro',
            description: result.error ?? 'Não foi possível criar o documento',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setExecutingAction(false);
    }
  };

  useEffect(() => {
    if (open && !isLoading) {
      inputRef.current?.focus();
    }
  }, [open, isLoading]);

  const { applyingMessageId, canApplyToDocument, handleApplyToDocument } = useChatApplyToDocument({
    setMessages,
  });

  if (!open) return null;

  return (
    <TooltipProvider delayDuration={300}>
        <div
          className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-all duration-300 ease-smooth ${
            isExpanded
              ? 'inset-x-4 bottom-8 top-16 md:inset-x-auto md:right-10 md:bottom-10 md:top-auto md:h-[640px] md:w-[760px] md:max-w-[760px]'
              : 'bottom-6 right-6 w-full max-w-md md:max-w-lg min-h-[380px] md:min-h-[440px] max-h-[85vh]'
          } ${open ? 'animate-fade-in-up' : 'animate-fade-in'}`}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/70 text-primary-foreground shadow-md">
                <span className="text-sm font-semibold">IA</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{chatName}</span>

                  {contextDocumentTitle && (
                    <span className="inline-flex items-center gap-0.5 rounded-md border border-muted-foreground/15 bg-muted/60 px-1.5 py-px text-[10px] text-muted-foreground">
                      <span className="max-w-[120px] truncate" title={contextDocumentTitle}>
                        {contextDocumentTitle}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => void clearContext()}
                            className="inline-flex h-3 w-3 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                            aria-label="Remover contexto"
                          >
                            <X size={8} weight="bold" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs px-2.5 py-1.5">
                          Remover contexto do documento
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  )}
                </div>
              </div>
              {error && (
                <span className="mt-1 truncate text-[11px] text-destructive">{subtitle}</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <DropdownMenu open={optionsOpen} onOpenChange={setOptionsOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-muted/70"
                        type="button"
                        aria-label="Opções do chat"
                      >
                        <DotsThree size={18} weight="bold" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Opções</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="min-w-[240px] p-0">
                  {showHistoryList ? (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setShowHistoryList(false);
                        }}
                        className="border-b border-border"
                      >
                        <ClockCounterClockwise size={16} className="mr-2" />
                        ← Voltar
                      </DropdownMenuItem>
                      <div className="max-h-[280px] overflow-y-auto p-1">
                        {historySessions === null ? (
                          <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                            <LoadingSpinner size="sm" />
                            Carregando…
                          </div>
                        ) : historySessions.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            Nenhuma conversa anterior
                          </div>
                        ) : (
                          historySessions.map((s) => (
                            <DropdownMenuItem
                              key={s.id}
                              onSelect={() => {
                                void switchToSession(s.id, s.workspaceId);
                                setOptionsOpen(false);
                              }}
                              className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                            >
                              <span className="truncate w-full text-left text-sm">
                                {formatSessionLabel(s)}
                              </span>
                            </DropdownMenuItem>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          clearChat();
                          setOptionsOpen(false);
                        }}
                      >
                        <Trash size={16} className="mr-2" />
                        Limpar chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setShowHistoryList(true);
                        }}
                      >
                        <ClockCounterClockwise size={16} className="mr-2" />
                        Ver histórico
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setOptionsOpen(false);
                          toast({
                            title: 'Configurações',
                            description: 'Opções de configuração do assistente em breve.',
                          });
                        }}
                      >
                        <Gear size={16} className="mr-2" />
                        Configurar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted/70"
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                  >
                    {isExpanded ? <ArrowsInSimple size={18} /> : <ArrowsOutSimple size={18} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isExpanded ? 'Recolher' : 'Expandir'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted/70"
                    type="button"
                    onClick={() => onOpenChange(false)}
                  >
                    <X size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Fechar chat</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-6 py-10">
              <LoadingSpinner size="md" />
              <p className="text-sm text-muted-foreground">Carregando chat</p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-background/60 via-background/80 to-muted/40">
                <ChatMessagesList
                  growWithContent={!isExpanded}
                  messages={messages}
                  listRef={listRef}
                  isSending={isSending}
                  isLoading={isLoading}
                  canApplyToDocument={canApplyToDocument}
                  applyingMessageId={applyingMessageId}
                  onApplyToDocument={handleApplyToDocument}
                  onOpenDocument={handleOpenDocument}
                  onSearchWorkspace={(query) => void handleSend(`Pesquise no workspace: ${query}`)}
                  onExecuteChatAction={(action) => void handleExecuteChatAction(action)}
                  executingAction={executingAction}
                />
              </div>

              <ChatInputForm
                inputRef={inputRef}
                input={input}
                isLoading={false}
                isSending={isSending}
                onInputChange={setInput}
                onSend={() => {
                  void handleSend();
                  inputRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  handleKeyDown(e);
                  if (e.key === 'Enter' && !e.shiftKey) inputRef.current?.focus();
                }}
              />
            </>
          )}
        </div>
      </TooltipProvider>
  );
}
