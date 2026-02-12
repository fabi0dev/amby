'use client';

import { useState } from 'react';
import { useDocumentTree } from '@/hooks/use-documents';
import { useDocumentStore } from '@/stores/document-store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  exportDocumentAsMarkdown,
} from '@/app/actions/documents';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsThree, Plus, MagnifyingGlass } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MovePageDialog } from '@/components/workspace/move-page-dialog';

interface TreeNode {
  id: string;
  documentId: string;
  parentId: string | null;
  path: string;
  depth: number;
  order: number;
  document: {
    id: string;
    title: string;
    slug: string;
    updatedAt: string;
    projectId: string | null;
  };
}

function TreeItem({
  node,
  workspaceId,
  projectId,
}: {
  node: TreeNode;
  workspaceId: string;
  projectId?: string | null;
}) {
  const { setCurrentDocument, currentDocument } = useDocumentStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isActive = currentDocument?.id === node.document.id;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const handleClick = async () => {
    router.push(`/workspace/${workspaceId}/${node.document.id}`);
  };

  const handleDeleteDocument = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteDocument(node.documentId);
      if (result?.success) {
        if (currentDocument?.id === node.document.id) {
          setCurrentDocument(null);
          router.push(`/workspace/${workspaceId}`);
        }
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.tree(workspaceId, projectId).queryKey,
        });
        toast({ title: 'Documento excluído' });
      } else {
        toast({
          title: 'Erro',
          description: result?.error ?? 'Não foi possível excluir o documento',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDuplicating) return;
    setIsDuplicating(true);
    try {
      const result = await duplicateDocument({ documentId: node.documentId });
      if (result.error || !result.data) {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível duplicar o documento',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Documento duplicado' });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.tree(workspaceId, projectId).queryKey,
      });
      router.push(`/workspace/${workspaceId}/${result.data.id}`);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleExportMarkdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportDocumentAsMarkdown(node.documentId);
      if (result.error || !result.data) {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível exportar o documento',
          variant: 'destructive',
        });
        return;
      }

      const { markdown, title } = result.data;
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'pagina'}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Documento exportado como Markdown' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`relative flex items-center gap-2 rounded-md px-2 py-1.5 transition-smooth group cursor-pointer ${
          isActive ? 'bg-sidebar-active text-sidebar-active-foreground' : 'hover:bg-sidebar-active/60 hover:text-foreground'
        }`}
        style={{ paddingLeft: `${node.depth * 14 + 6}px` }}
      >
        <button
          onClick={handleClick}
          title={node.document.title}
          className={`flex-1 min-w-0 text-left text-[13px] font-medium transition-smooth truncate block ${
            isActive ? 'text-sidebar-active-foreground font-semibold' : 'text-foreground/90 group-hover:text-foreground'
          }`}
        >
          {node.document.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-smooth hover:bg-sidebar-active/80 hover:text-sidebar-active-foreground"
              aria-label="Mais opções do documento"
              onClick={(e) => e.stopPropagation()}
            >
              <DotsThree size={18} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem className="text-[13px]" onClick={handleExportMarkdown}>
              Exportar documento
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-[13px]"
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              {isDuplicating ? 'Duplicando...' : 'Duplicar'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-[13px]"
              onClick={(e) => {
                e.stopPropagation();
                setIsMoveDialogOpen(true);
              }}
            >
              Mover
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-[13px] text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: 'Copiar para o espaço',
                  description:
                    'Funcionalidade de copiar documento para outro espaço ainda não está disponível.',
                });
              }}
            >
              Copiar para o espaço
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive text-[13px]"
              onClick={handleDeleteDocument}
            >
              Excluir documento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Excluir documento"
        description="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
      <MovePageDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        documentId={node.documentId}
        documentTitle={node.document.title}
        workspaceId={workspaceId}
        currentProjectId={node.document.projectId}
        onMoved={(targetProjectId) => {
          queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey[0] === 'documents' &&
              query.queryKey[1] === workspaceId &&
              query.queryKey[2] === 'tree',
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.documents.detail(workspaceId, node.documentId).queryKey,
          });
          toast({ title: 'Documento movido' });
        }}
      />
    </div>
  );
}

export function DocumentTree({
  workspaceId,
  workspaceName,
  projectId,
}: {
  workspaceId: string;
  workspaceName?: string | null;
  projectId?: string | null;
}) {
  const router = useRouter();
  const { data: tree, isLoading } = useDocumentTree(workspaceId, projectId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const normalizedFilter = searchTerm.trim().toLowerCase();
  const hasDocuments = !!tree && tree.length > 0;
  const filteredTree =
    hasDocuments && normalizedFilter.length > 0
      ? tree!.filter((node: TreeNode) =>
          node.document.title.toLowerCase().includes(normalizedFilter),
        )
      : tree;

  const handleCreateDocument = async () => {
    setIsCreating(true);
    try {
      const result = await createDocument({
        workspaceId,
        title: 'Novo Documento',
        ...(projectId && { projectId }),
      });
      if (result.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.tree(workspaceId, projectId).queryKey,
        });
        toast({ title: 'Documento criado' });
        router.push(`/workspace/${workspaceId}/${result.data.id}?focus=title`);
      } else {
        toast({
          title: 'Erro',
          description: result.error ?? 'Não foi possível criar o documento',
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col flex-1 min-h-0 space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between px-1 pt-1 flex-shrink-0">
          {workspaceName ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate max-w-[140px]">
                  Documentos
                </h2>
              </TooltipTrigger>
              <TooltipContent>{workspaceName}</TooltipContent>
            </Tooltip>
          ) : (
            <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate max-w-[140px]">
              Documentos
            </h2>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-smooth"
                aria-label="Opções"
              >
                <DotsThree size={18} weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[210px]">
              <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Ações
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-xs"
                onClick={handleCreateDocument}
                disabled={isCreating}
              >
                {isCreating ? <LoadingSpinner size="sm" /> : <Plus size={14} />}
                <span className="flex-1">Novo documento</span>
                <span className="text-[10px] text-muted-foreground tracking-wide">N</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 text-xs"
                onClick={() => {
                  setIsFilterVisible((prev) => {
                    const next = !prev;
                    if (!next) setSearchTerm('');
                    return next;
                  });
                }}
              >
                <MagnifyingGlass size={14} className="text-muted-foreground" />
                <span className="flex-1">
                  {isFilterVisible ? 'Ocultar filtro' : 'Mostrar filtro'}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasDocuments && isFilterVisible && (
          <div className="px-1 flex-shrink-0">
            <div className="flex items-center gap-1 rounded-lg bg-muted/40 px-2 py-1 focus-within:ring-2 focus-within:ring-ring/30">
              <MagnifyingGlass size={14} className="text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Filtrar..."
                className="h-6 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Filtrar por título"
              />
            </div>
          </div>
        )}

        <div className="document-tree-list flex-1 min-h-0 overflow-x-hidden py-1 pr-1 transition-smooth">
          {isLoading ? (
            <div className="p-2 text-sm text-muted-foreground animate-pulse">Carregando...</div>
          ) : hasDocuments ? (
            filteredTree && filteredTree.length > 0 ? (
              <div className="space-y-0.5 pl-1">
                {filteredTree.map((node: TreeNode, index: number) => (
                  <div
                    key={node.id}
                    className="animate-stagger-in"
                    style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
                  >
                    <TreeItem node={node} workspaceId={workspaceId} projectId={projectId} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 text-xs text-muted-foreground animate-fade-in">
                Nenhum documento encontrado para &quot;{searchTerm}&quot;.
              </div>
            )
          ) : (
            <div className="p-2 text-sm text-muted-foreground animate-fade-in">
              Nenhum documento ainda. Crie um novo!
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
