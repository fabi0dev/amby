import { redirect } from 'next/navigation';
import { getRequiredSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { WorkspaceSettingsPage } from '@/components/pages/workspace-settings-page';

export default async function WorkspaceSettingsRoute({
  params,
}: {
  params: { workspaceId: string };
}) {
  const session = await getRequiredSession();

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.workspaceId,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    redirect('/home');
  }

  return (
    <MainLayout>
      <WorkspaceSettingsPage workspace={workspace} />
    </MainLayout>
  );
}
