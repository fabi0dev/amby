export type ChatMessageRole = 'user' | 'assistant';

export interface OpenDocumentAction {
  workspaceId: string;
  documentId: string;
  documentTitle?: string;
}

export type ChatAction =
  | { type: 'create_workspace'; name: string }
  | { type: 'create_document'; workspaceId: string; title: string };

export interface ChatMessageActions {
  documentMarkdown?: string;
  applied?: boolean;
  openDocument?: OpenDocumentAction;
  suggestWorkspaceSearch?: boolean;
  workspaceSearchQuery?: string;
  /** Ação executável pelo usuário (criar workspace, documento, etc.). */
  chatAction?: ChatAction;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;
  actions?: ChatMessageActions;
}

export interface ChatWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
