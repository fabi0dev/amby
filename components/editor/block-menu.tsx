'use client';

import type { Editor } from '@tiptap/react';
import { CaretRight, Info, Code, Quotes } from '@phosphor-icons/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface BlockOption {
  icon: React.ReactNode;
  label: string;
  description: string;
  action: (editor: Editor) => void;
}

interface BlockMenuProps {
  editor: Editor;
  onClose: () => void;
  position?: {
    top: number;
    left: number;
  };
}

/** Remove o caractere "/" que abriu o menu (antes do cursor) e executa a ação do bloco. */
function runBlockAndRemoveSlash(editor: Editor, block: BlockOption, onClose: () => void) {
  const { from } = editor.state.selection;
  if (from > 0) {
    editor
      .chain()
      .focus()
      .deleteRange({ from: from - 1, to: from })
      .run();
  }
  block.action(editor);
  onClose();
}

export function BlockMenu({ editor, onClose, position }: BlockMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapperRef.current?.focus();
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [onClose]);

  const blocks = useMemo<BlockOption[]>(
    () => [
      {
        icon: <CaretRight size={22} />,
        label: 'Bloco recolhível',
        description: 'Inserir bloco colapsável',
        action: (editor) => {
          // TODO: Implementar bloco recolhível
          onClose();
        },
      },
      {
        icon: <Info size={22} />,
        label: 'Destaque',
        description: 'Inserir aviso de destaque',
        action: (editor) => {
          editor.chain().focus().toggleBlockquote().run();
          onClose();
        },
      },
      {
        icon: <Code size={22} />,
        label: 'Código inline',
        description: 'Inserir código inline',
        action: (editor) => {
          editor.chain().focus().toggleCode().run();
          onClose();
        },
      },
      {
        icon: <Code size={22} />,
        label: 'Bloco de código',
        description: 'Inserir bloco de código',
        action: (editor) => {
          editor.chain().focus().toggleCodeBlock().run();
          onClose();
        },
      },
      {
        icon: <Quotes size={22} />,
        label: 'Citação',
        description: 'Inserir citação',
        action: (editor) => {
          editor.chain().focus().toggleBlockquote().run();
          onClose();
        },
      },
    ],
    [onClose],
  );

  const runSelected = useCallback(() => {
    const block = blocks[selectedIndex];
    if (block) runBlockAndRemoveSlash(editor, block, onClose);
  }, [editor, onClose, blocks, selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % blocks.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + blocks.length) % blocks.length);
          break;
        case 'Enter':
          e.preventDefault();
          runSelected();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [blocks.length, onClose, runSelected],
  );

  return (
    <div
      ref={wrapperRef}
      tabIndex={-1}
      role="listbox"
      aria-activedescendant={`block-option-${selectedIndex}`}
      className="absolute z-50 w-64 rounded-lg border bg-popover p-2 shadow-lg outline-none"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="max-h-96 overflow-y-auto">
        {blocks.map((block, index) => (
          <button
            key={index}
            id={`block-option-${index}`}
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() => runBlockAndRemoveSlash(editor, block, onClose)}
            className={cn(
              'group flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground',
              index === selectedIndex && 'bg-accent text-accent-foreground',
            )}
          >
            <div
              className={cn(
                'flex-shrink-0',
                index !== selectedIndex && 'text-primary group-hover:text-accent-foreground',
              )}
            >
              {block.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{block.label}</div>
              <div
                className={cn(
                  'text-xs',
                  index !== selectedIndex &&
                    'text-muted-foreground group-hover:text-accent-foreground',
                )}
              >
                {block.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
