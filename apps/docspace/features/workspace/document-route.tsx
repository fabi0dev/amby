import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Permission } from '@prisma/client';
import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { DocspaceLayout } from '@/apps/docspace/layout';

interface DocumentRouteParams {
  params: { workspaceId: string; documentId: string };
}

export async function DocspaceDocumentRoute({ params }: DocumentRouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const document = await prisma.document.findFirst({
    where: {
      id: params.documentId,
      workspaceId: params.workspaceId,
      deletedAt: null,
    },
    include: {
      workspace: {
        include: {
          members: {
            where: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  });

  if (!document) {
    redirect(`/workspace/${params.workspaceId}`);
  }

  const isWorkspaceMember = document.workspace.members.length > 0;

  // Se não for membro do workspace, permitir acesso apenas se existir compartilhamento
  // (READ ou WRITE) para este documento.
  if (!isWorkspaceMember) {
    const share = await prisma.documentShare.findFirst({
      where: {
        documentId: document.id,
        permission: {
          in: [Permission.READ, Permission.WRITE],
        },
      },
    });

    if (!share) {
      redirect(`/workspace/${params.workspaceId}`);
    }
  }

  return (
    <DocspaceLayout>
      <WorkspaceLayout workspaceId={params.workspaceId} documentId={params.documentId} />
    </DocspaceLayout>
  );
}

