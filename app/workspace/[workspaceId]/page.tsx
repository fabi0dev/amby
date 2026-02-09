import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WorkspaceLayout } from '@/components/layout/workspace-layout';
import { MainLayout } from '@/components/layout/main-layout';

export default async function WorkspacePage({ params }: { params: { workspaceId: string } }) {
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
    redirect('/home');
  }

  return (
    <MainLayout>
      <WorkspaceLayout workspaceId={params.workspaceId} />
    </MainLayout>
  );
}
