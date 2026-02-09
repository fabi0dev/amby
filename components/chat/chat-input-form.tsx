import type React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatInputFormProps {
  input: string;
  isLoading: boolean;
  isSending: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement>;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}

const textareaBaseClass =
  'flex min-h-10 max-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-[box-shadow,border-color] duration-200 ease-out placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-muted/30 dark:focus-visible:ring-primary/30 resize-y';

export function ChatInputForm({
  input,
  isLoading,
  isSending,
  onInputChange,
  onSend,
  onKeyDown,
  inputRef,
}: ChatInputFormProps) {
  return (
    <form
      className="border-t border-border bg-card px-3 py-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          className={cn(textareaBaseClass, 'py-2.5')}
          disabled={isLoading}
          rows={1}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button type="submit" size="sm" disabled={!input.trim() || isSending || isLoading}>
                Enviar
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Enviar mensagem (Enter)</TooltipContent>
        </Tooltip>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground/80">
        Mensagens salvas na conversa. Enter envia; Shift+Enter nova linha.
      </p>
    </form>
  );
}
