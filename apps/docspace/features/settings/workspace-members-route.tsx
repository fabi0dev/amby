import { redirect } from 'next/navigation';
import { getRequiredSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManage } from '@/lib/permissions';
import { DocspaceLayout } from '@/apps/docspace/layout';
import { WorkspaceMembersPage } from '@/components/pages/workspace-members-page';

interface WorkspaceMembersRouteParams {
  params: { workspaceId: string };
}

export async function DocspaceWorkspaceMembersRoute({ params }: WorkspaceMembersRouteParams) {
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
      invites: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        include: {
          invitedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!workspace) {
    redirect('/dashboard');
  }

  const currentMember = workspace.members.find((m) => m.userId === session.user.id);
  const canManageMembers = currentMember ? canManage(currentMember.role) : false;

  return (
    <DocspaceLayout>
      <WorkspaceMembersPage
        workspace={workspace}
        currentUserId={session.user.id}
        canManageMembers={canManageMembers}
      />
    </DocspaceLayout>
  );
}

