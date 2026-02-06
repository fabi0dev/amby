export type ChatMessageRole = 'user' | 'assistant'

export interface ChatMessageActions {
  documentMarkdown?: string
  applied?: boolean
}

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  createdAt: Date
  actions?: ChatMessageActions
}

export interface ChatWidgetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}


