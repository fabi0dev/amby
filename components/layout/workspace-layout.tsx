'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Editor } from '@/components/editor/editor';
import { WorkspaceOverview } from '@/components/pages/workspace-overview';
import { DocspaceHomeView } from '@/apps/docspace/components/docspace-home-view';
import { ProjectOverview } from '@/apps/docspace/components/project-overview';
import {
  FloatingPageList,
  SIDEBAR_PANEL_WIDTH,
  FLOATING_BUTTON_OFFSET,
} from '@/components/layout/floating-page-list';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useDocumentStore } from '@/stores/document-store';
import { useWorkspace } from '@/hooks/use-workspace';
import { useDocument } from '@/hooks/use-documents';
import { useIsMobile } from '@/hooks/use-media-query';
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

/** Extrai projectId da URL /workspace/[workspaceId]/project/[projectId] */
function getProjectIdFromPath(pathname: string, workspaceId: string): string | null {
  const prefix = `/workspace/${workspaceId}/project/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  const segment = rest.split('/')[0];
  return segment && segment !== 'overview' ? segment : null;
}

/** Verifica se a rota é a raiz do workspace (home do docspace, sem projeto) */
function isWorkspaceRoot(pathname: string, workspaceId: string): boolean {
  const root = `/workspace/${workspaceId}`;
  return pathname === root || pathname === `${root}/`;
}

export function WorkspaceLayout({
  workspaceId,
  documentId,
  projectId: projectIdProp,
}: {
  workspaceId: string;
  documentId?: string;
  projectId?: string;
}) {
  const pathname = usePathname();
  const projectIdFromPath = getProjectIdFromPath(pathname ?? '', workspaceId);

  const { data: workspace, isLoading: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { data: document, isLoading: isLoadingDocument } = useDocument(
    workspaceId,
    documentId || '',
  );
  const { setCurrentWorkspace, setLastProjectIdForWorkspace } = useWorkspaceStore();
  const { setCurrentDocument } = useDocumentStore();

  const projectId = projectIdProp ?? projectIdFromPath ?? document?.projectId ?? null;
  const showSidebar = !!documentId;

  const isMobile = useIsMobile();
  const isLoading = isLoadingWorkspace || (!!documentId && isLoadingDocument);
  const [pageListOpen, setPageListOpen] = useState(true);

  // No mobile: sidebar fica fechada por padrão e conteúdo usa 100% da largura (overlay)
  useEffect(() => {
    if (isMobile) setPageListOpen(false);
  }, [isMobile]);

  const contentMarginLeft =
    !showSidebar || isMobile ? 0 : pageListOpen ? SIDEBAR_PANEL_WIDTH : FLOATING_BUTTON_OFFSET;

  // Persiste o projeto atual quando estiver em rota de projeto ou em um documento do projeto
  useEffect(() => {
    if (!workspaceId) return;
    const effective = projectIdFromPath ?? document?.projectId ?? null;
    if (effective) setLastProjectIdForWorkspace(workspaceId, effective);
  }, [workspaceId, projectIdFromPath, document?.projectId, setLastProjectIdForWorkspace]);

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  }, [workspace, setCurrentWorkspace]);

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

  const isOverviewPage = pathname?.endsWith('/overview');
  const isProjectPage = !!projectId && !documentId;

  const mainContent = documentId ? (
    <Editor />
  ) : isProjectPage ? (
    <ProjectOverview workspaceId={workspaceId} projectId={projectId!} />
  ) : isOverviewPage ? (
    <WorkspaceOverview workspaceId={workspaceId} onlyWithoutProject />
  ) : (
    <DocspaceHomeView workspaceId={workspaceId} />
  );

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
      {workspace && showSidebar && (
        <FloatingPageList
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          open={pageListOpen}
          onOpenChange={setPageListOpen}
          projectId={projectId}
          isMobile={isMobile}
        />
      )}

      <div
        className="flex-1 overflow-hidden flex flex-col min-w-0 transition-[margin] duration-300 ease-out"
        style={{ marginLeft: contentMarginLeft }}
      >
        {mainContent}
      </div>
    </div>
  );
}
