'use client';

import { Editor } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  TextB,
  TextItalic,
  TextStrikethrough,
  Code,
  Link as LinkIcon,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,
  CaretDown,
  ChatCircle,
  Check,
  ListBullets,
  ListNumbers,
  Quotes,
  CheckSquare,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { Input } from '@/components/ui/input';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDocumentStore } from '@/stores/document-store';
import { queryKeys } from '@/lib/query-keys';
import { useToast } from '@/components/ui/use-toast';

/** Dropdown sem Portal: posiciona com CSS (absolute abaixo do trigger) para funcionar dentro do BubbleMenu */
function ToolbarDropdown({
  trigger,
  content,
  contentClassName,
}: {
  trigger: React.ReactNode;
  content: (close: () => void) => React.ReactNode;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
        return;
      }
      if (wrapperRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handle);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute left-0 top-full z-[100] mt-1.5 rounded-lg border border-border/30 bg-white dark:bg-zinc-900 p-1.5 text-foreground shadow-lg backdrop-blur-sm animate-scale-in origin-top-left',
            contentClassName,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {content(close)}
        </div>
      )}
    </div>
  );
}

interface ToolbarProps {
  editor: Editor;
}

type BlockType =
  | 'paragraph'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock'
  | 'taskList';

interface TextBlockOption {
  type: BlockType;
  level?: 1 | 2 | 3;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const textBlockOptions: TextBlockOption[] = [
  { type: 'paragraph', label: 'Texto', Icon: () => null },
  { type: 'heading', level: 1, label: 'Título 1', Icon: () => null },
  { type: 'heading', level: 2, label: 'Título 2', Icon: () => null },
  { type: 'heading', level: 3, label: 'Título 3', Icon: () => null },
  { type: 'taskList', label: 'Lista de Tarefas', Icon: CheckSquare },
  { type: 'bulletList', label: 'Lista de Pontos', Icon: ListBullets },
  { type: 'orderedList', label: 'Lista Numerada', Icon: ListNumbers },
  { type: 'blockquote', label: 'Bloco de Citação', Icon: Quotes },
  { type: 'codeBlock', label: 'Código', Icon: Code },
];

function isBlockActive(editor: Editor, option: TextBlockOption): boolean {
  switch (option.type) {
    case 'paragraph':
      return (
        !editor.isActive('heading') &&
        !editor.isActive('bulletList') &&
        !editor.isActive('orderedList') &&
        !editor.isActive('blockquote') &&
        !editor.isActive('codeBlock') &&
        !editor.isActive('taskList')
      );
    case 'heading':
      return option.level != null && editor.isActive('heading', { level: option.level });
    case 'bulletList':
      return editor.isActive('bulletList');
    case 'orderedList':
      return editor.isActive('orderedList');
    case 'blockquote':
      return editor.isActive('blockquote');
    case 'codeBlock':
      return editor.isActive('codeBlock');
    case 'taskList':
      return editor.isActive('taskList');
    default:
      return false;
  }
}

function getCurrentBlockLabel(editor: Editor): string {
  const active = textBlockOptions.find((opt) => isBlockActive(editor, opt));
  return active?.label ?? 'Texto';
}

function runBlockCommand(editor: Editor, option: TextBlockOption): void {
  const chain = editor.chain().focus();
  switch (option.type) {
    case 'paragraph':
      chain.setParagraph().run();
      break;
    case 'heading':
      if (option.level) chain.toggleHeading({ level: option.level }).run();
      break;
    case 'bulletList':
      chain.toggleBulletList().run();
      break;
    case 'orderedList':
      chain.toggleOrderedList().run();
      break;
    case 'blockquote':
      chain.toggleBlockquote().run();
      break;
    case 'codeBlock':
      chain.toggleCodeBlock().run();
      break;
    case 'taskList':
      chain.toggleTaskList().run();
      break;
    default:
      break;
  }
}

const alignments: {
  value: 'left' | 'center' | 'right' | 'justify';
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'left', label: 'Esquerda', Icon: TextAlignLeft },
  { value: 'center', label: 'Centro', Icon: TextAlignCenter },
  { value: 'right', label: 'Direita', Icon: TextAlignRight },
  { value: 'justify', label: 'Justificado', Icon: TextAlignJustify },
];

function getCurrentAlignment(editor: Editor): 'left' | 'center' | 'right' | 'justify' {
  const attrs =
    editor.getAttributes('paragraph').textAlign || editor.getAttributes('heading').textAlign;
  return (attrs as 'left' | 'center' | 'right' | 'justify') || 'left';
}

export function Toolbar({ editor }: ToolbarProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRange, setCommentRange] = useState<{ from: number; to: number } | null>(null);

  const { currentWorkspace } = useWorkspaceStore();
  const { currentDocument, setActiveCommentId, setIsCommentsOpen } = useDocumentStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!editor) return null;

  const hasSetTextAlign = typeof (editor.commands as any).setTextAlign === 'function';
  const hasToggleUnderline = typeof (editor.commands as any).toggleUnderline === 'function';
  const hasSetLink = typeof (editor.commands as any).setLink === 'function';

  const handleOpenLinkDialog = () => {
    if (!hasSetLink) return;
    const currentHref = (editor.getAttributes('link').href as string | undefined) ?? '';
    setLinkUrl(currentHref);
    setIsLinkDialogOpen(true);
  };

  const handleOpenCommentDialog = () => {
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (!hasSelection) {
      toast({
        title: 'Selecione um trecho',
        description: 'Selecione um trecho do texto para adicionar um comentário.',
      });
      return;
    }

    if (!currentWorkspace || !currentDocument) {
      toast({
        title: 'Documento não carregado',
        description: 'Abra um documento para adicionar comentários.',
        variant: 'destructive',
      });
      return;
    }

    setCommentRange({ from, to });
    setIsCommentDialogOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast({
        title: 'Comentário vazio',
        description: 'Digite o conteúdo do comentário antes de salvar.',
      });
      return;
    }

    if (!currentWorkspace || !currentDocument) {
      toast({
        title: 'Documento não carregado',
        description: 'Abra um documento para adicionar comentários.',
        variant: 'destructive',
      });
      return;
    }

    const range = commentRange ?? editor.state.selection;

    try {
      const res = await fetch(
        `/api/documents/${currentWorkspace.id}/${currentDocument.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: commentText.trim(),
            position: { from: range.from, to: range.to },
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error || 'Não foi possível criar o comentário.';
        toast({
          title: 'Erro ao criar comentário',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      // Aplicar destaque no texto comentado
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .setTextSelection({ from: range.from, to: range.to })
        .setMark('commentHighlight')
        .run();

      // Atualizar estado de comentário ativo e abrir painel
      const created = await res.json().catch(() => null);
      if (created && created.id) {
        setActiveCommentId(created.id);
        setIsCommentsOpen(true);
      }

      setCommentText('');
      setCommentRange(null);
      setIsCommentDialogOpen(false);

      // Recarregar documento para trazer lista atualizada de comentários
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.detail(currentWorkspace.id, currentDocument.id).queryKey,
      });

      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi salvo com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao criar o comentário.',
        variant: 'destructive',
      });
    }
  };

  const handleApplyLink = () => {
    if (!hasSetLink) {
      setIsLinkDialogOpen(false);
      return;
    }

    const trimmed = linkUrl.trim();
    if (!trimmed) {
      // Remove link se o campo ficar vazio
      if (typeof (editor.commands as any).unsetLink === 'function') {
        (editor.commands as any).unsetLink();
      }
      setIsLinkDialogOpen(false);
      return;
    }

    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    (editor.commands as any).setLink({ href: normalized });
    setIsLinkDialogOpen(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex flex-nowrap items-center gap-1 rounded-lg border border-border/30 px-2 py-1.5',
          'bg-white dark:bg-zinc-900 text-foreground w-[450px]',
          'shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-800',
        )}
      >
        {/* Grupo: tipo de bloco */}
        <ToolbarDropdown
          contentClassName="min-w-[200px]"
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 gap-1 rounded-md px-2 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary"
                >
                  {getCurrentBlockLabel(editor)}
                  <CaretDown size={14} className="opacity-60" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Tipo de bloco</TooltipContent>
            </Tooltip>
          }
          content={(close) =>
            textBlockOptions.map((option) => {
              const active = isBlockActive(editor, option);
              const Icon = option.Icon;
              return (
                <button
                  key={`${option.type}-${option.level ?? ''}`}
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  onClick={() => {
                    runBlockCommand(editor, option);
                    close();
                  }}
                >
                  {option.type === 'heading' && option.level ? (
                    <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                      H{option.level}
                    </span>
                  ) : option.type === 'codeBlock' ? (
                    <Code size={16} className="shrink-0 text-muted-foreground" />
                  ) : Icon ? (
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : null}
                  <span className="flex-1 text-left">{option.label}</span>
                  {active && <Check size={16} className="shrink-0 text-primary" weight="bold" />}
                </button>
              );
            })
          }
        />

        <div className="mx-0.5 h-3.5 w-px shrink-0 bg-border/50" aria-hidden />

        {/* Grupo: alinhamento / listas */}
        <ToolbarDropdown
          contentClassName="min-w-[140px]"
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 gap-0.5 rounded-md px-1.5 text-foreground hover:bg-primary/10 hover:text-primary"
                >
                  {(() => {
                    const current = getCurrentAlignment(editor);
                    const config = alignments.find((a) => a.value === current);
                    const Icon = config?.Icon ?? TextAlignLeft;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <CaretDown size={14} className="opacity-60" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Alinhamento</TooltipContent>
            </Tooltip>
          }
          content={(close) =>
            alignments.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                onClick={() => {
                  if (hasSetTextAlign) (editor.commands as any).setTextAlign(value);
                  close();
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))
          }
        />
        <div className="mx-0.5 h-3.5 w-px shrink-0 bg-border/50" aria-hidden />

        {/* Grupo: B I U S */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 shrink-0 rounded-md text-foreground hover:bg-primary/10 hover:text-primary',
                editor.isActive('bold') && 'bg-primary/15 font-semibold text-primary',
              )}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <TextB size={16} className="font-bold" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Negrito</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 shrink-0 rounded-md text-foreground hover:bg-primary/10 hover:text-primary',
                editor.isActive('italic') && 'bg-primary/15 text-primary',
              )}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <TextItalic size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Itálico</TooltipContent>
        </Tooltip>
        {hasToggleUnderline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 shrink-0 rounded-md text-foreground hover:bg-primary/10 hover:text-primary',
                  editor.isActive('underline') && 'bg-primary/15 text-primary',
                )}
                onClick={() => (editor.commands as any).toggleUnderline()}
              >
                <span className="text-xs font-medium underline">U</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Sublinhado</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 shrink-0 rounded-md text-foreground hover:bg-primary/10 hover:text-primary',
                editor.isActive('strike') && 'bg-primary/15 text-primary',
              )}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <TextStrikethrough size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Tachado</TooltipContent>
        </Tooltip>

        <div className="mx-0.5 h-3.5 w-px shrink-0 bg-border/50" aria-hidden />

        {/* Grupo: código, link, cor, comentário */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 shrink-0 rounded-md text-foreground hover:bg-primary/10 hover:text-primary',
                editor.isActive('code') && 'bg-primary/15 text-primary',
              )}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Código</TooltipContent>
        </Tooltip>
        {hasSetLink && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 shrink-0 rounded-md text-foreground hover:bg-primary/10 hover:text-primary',
                  editor.isActive('link') && 'bg-primary/15 text-primary',
                )}
                onClick={handleOpenLinkDialog}
              >
                <LinkIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Inserir link</TooltipContent>
          </Tooltip>
        )}

        <ToolbarDropdown
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 gap-0.5 rounded-md px-1.5 text-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <span className="text-xs font-semibold">A</span>
                  <CaretDown size={14} className="opacity-60" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Cor do texto</TooltipContent>
            </Tooltip>
          }
          content={(close) => (
            <div className="px-2 py-1.5 text-xs text-muted-foreground" onClick={close}>
              Cor do texto (em breve)
            </div>
          )}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-md text-foreground hover:bg-primary/10 hover:text-primary"
              onClick={handleOpenCommentDialog}
            >
              <ChatCircle size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Adicionar comentário</TooltipContent>
        </Tooltip>
      </div>
      <Dialog.Root open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 focus:outline-none">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApplyLink();
              }}
              className="rounded-lg border bg-background p-5 shadow-lg animate-scale-in space-y-4"
            >
              <div className="space-y-1">
                <Dialog.Title className="text-base font-semibold text-foreground">
                  Inserir link
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Cole ou digite a URL para vincular ao texto selecionado.
                </Dialog.Description>
              </div>
              <Input
                autoFocus
                placeholder="https://exemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Aplicar</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={isCommentDialogOpen}
        onOpenChange={(open) => {
          setIsCommentDialogOpen(open);
          if (!open) {
            setCommentText('');
            setCommentRange(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 focus:outline-none">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitComment();
              }}
              className="rounded-lg border bg-background p-5 shadow-lg animate-scale-in space-y-4"
            >
              <div className="space-y-1">
                <Dialog.Title className="text-base font-semibold text-foreground">
                  Novo comentário
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Escreva um comentário para o trecho selecionado.
                </Dialog.Description>
              </div>
              <textarea
                className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Digite seu comentário..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCommentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar comentário</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </TooltipProvider>
  );
}
