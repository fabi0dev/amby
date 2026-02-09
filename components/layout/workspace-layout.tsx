'use client';

import { useEffect, useState } from 'react';
import { Editor } from '@/components/editor/editor';
import { WorkspaceOverview } from '@/components/pages/workspace-overview';
import {
  FloatingPageList,
  SIDEBAR_PANEL_WIDTH,
  FLOATING_BUTTON_OFFSET,
} from '@/components/layout/floating-page-list';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDocumentStore } from '@/stores/document-store';
import { useWorkspace } from '@/hooks/use-workspace';
import { useDocument } from '@/hooks/use-documents';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function LoadingPlaceholder({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[200px] animate-fade-in">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <LoadingSpinner size="md" />
        <span className="text-sm animate-pulse">{message}</span>
      </div>
    </div>
  );
}

export function WorkspaceLayout({
  workspaceId,
  documentId,
}: {
  workspaceId: string;
  documentId?: string;
}) {
  const { data: workspace, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { data: document, isLoading: isLoadingDocument } = useDocument(
    workspaceId,
    documentId || '',
  );
  const { setCurrentWorkspace } = useWorkspaceStore();
  const { setCurrentDocument } = useDocumentStore();

  const isLoading = isLoadingWorkspace || (!!documentId && isLoadingDocument);
  const [pageListOpen, setPageListOpen] = useState(true);

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  }, [workspace, setCurrentWorkspace]);

  // Sincronizar store com o documento da URL: ao trocar de página, usar sempre os dados do cache/API
  useEffect(() => {
    if (!documentId) {
      setCurrentDocument(null);
      return;
    }
    if (document) {
      setCurrentDocument(document);
    } else {
      setCurrentDocument(null);
    }
  }, [documentId, document, setCurrentDocument]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <LoadingPlaceholder
            message={documentId ? 'Carregando documento...' : 'Carregando espaço...'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden animate-fade-in">
      {workspace && (
        <FloatingPageList
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          open={pageListOpen}
          onOpenChange={setPageListOpen}
        />
      )}
      <div
        className="flex-1 overflow-hidden flex flex-col min-w-0 transition-[margin] duration-300 ease-out"
        style={{
          marginLeft: pageListOpen ? SIDEBAR_PANEL_WIDTH : FLOATING_BUTTON_OFFSET,
        }}
      >
        {documentId ? <Editor /> : <WorkspaceOverview workspaceId={workspaceId} />}
      </div>
    </div>
  );
}
