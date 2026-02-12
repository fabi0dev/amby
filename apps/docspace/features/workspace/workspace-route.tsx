import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { DocspaceLayout } from '@/apps/docspace/layout';

interface WorkspaceRouteParams {
  params: { workspaceId: string };
}

export async function DocspaceWorkspaceRoute({ params }: WorkspaceRouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.workspaceId,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!workspace) {
    redirect('/dashboard');
  }

  return (
    <DocspaceLayout>
      <WorkspaceLayout workspaceId={params.workspaceId} />
    </DocspaceLayout>
  );
}

