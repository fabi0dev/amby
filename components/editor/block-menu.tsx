'use client'

import type { Editor } from '@tiptap/react'
import {
  Table,
  CaretRight,
  Info,
  Code,
  Quotes,
} from '@phosphor-icons/react'
import React from 'react'

interface BlockOption {
  icon: React.ReactNode
  label: string
  description: string
  action: (editor: Editor) => void
}

interface BlockMenuProps {
  editor: Editor
  onClose: () => void
}

export function BlockMenu({ editor, onClose }: BlockMenuProps) {

  const blocks: BlockOption[] = [
    {
      icon: <Table size={22} />,
      label: 'Tabela',
      description: 'Inserir uma tabela',
      action: (editor) => {
        // TODO: Implementar inserção de tabela
        onClose()
      },
    },
    {
      icon: <CaretRight size={22} />,
      label: 'Bloco recolhível',
      description: 'Inserir bloco colapsável',
      action: (editor) => {
        // TODO: Implementar bloco recolhível
        onClose()
      },
    },
    {
      icon: <Info size={22} />,
      label: 'Destaque',
      description: 'Inserir aviso de destaque',
      action: (editor) => {
        editor.chain().focus().toggleBlockquote().run()
        onClose()
      },
    },
    {
      icon: <Code size={22} />,
      label: 'Código inline',
      description: 'Inserir código inline',
      action: (editor) => {
        editor.chain().focus().toggleCode().run()
        onClose()
      },
    },
    {
      icon: <Code size={22} />,
      label: 'Bloco de código',
      description: 'Inserir bloco de código',
      action: (editor) => {
        editor.chain().focus().toggleCodeBlock().run()
        onClose()
      },
    },
    {
      icon: <Quotes size={22} />,
      label: 'Citação',
      description: 'Inserir citação',
      action: (editor) => {
        editor.chain().focus().toggleBlockquote().run()
        onClose()
      },
    },
  ]

  return (
    <div className="absolute top-0 left-0 z-50 w-64 rounded-lg border bg-popover p-2 shadow-lg">
      <div className="max-h-96 overflow-y-auto">
        {blocks.map((block, index) => (
          <button
            key={index}
            onClick={() => block.action(editor)}
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-left hover:bg-accent"
          >
            <div className="flex-shrink-0 text-primary">{block.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-medium">{block.label}</div>
              <div className="text-xs text-muted-foreground">
                {block.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
