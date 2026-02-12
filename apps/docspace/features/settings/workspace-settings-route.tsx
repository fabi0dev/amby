import { redirect } from 'next/navigation';
import { getRequiredSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManage } from '@/lib/permissions';
import { DocspaceLayout } from '@/apps/docspace/layout';
import { WorkspaceSettingsPage } from '@/components/pages/workspace-settings-page';

interface WorkspaceSettingsRouteParams {
  params: { workspaceId: string };
}

export async function DocspaceWorkspaceSettingsRoute({ params }: WorkspaceSettingsRouteParams) {
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
      workspaceApps: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!workspace) {
    redirect('/dashboard');
  }

  const currentMember = workspace.members.find((m) => m.userId === session.user.id);
  const canManageWorkspace = currentMember ? canManage(currentMember.role) : false;

  return (
    <DocspaceLayout>
      <WorkspaceSettingsPage
        workspace={workspace}
        canManageWorkspace={canManageWorkspace}
      />
    </DocspaceLayout>
  );
}

