import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { DocspaceLayout } from '@/apps/docspace/layout';

interface PageProps {
  params: { workspaceId: string; projectId: string };
}

export default async function DocspaceProjectPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.workspaceId,
      members: {
        some: { userId: session.user.id },
      },
    },
  });

  if (!workspace) {
    redirect('/dashboard');
  }

  const project = await prisma.project.findFirst({
    where: {
      id: params.projectId,
      workspaceId: params.workspaceId,
    },
  });

  if (!project) {
    redirect(`/workspace/${params.workspaceId}`);
  }

  return (
    <DocspaceLayout>
      <WorkspaceLayout workspaceId={params.workspaceId} projectId={params.projectId} />
    </DocspaceLayout>
  );
}
