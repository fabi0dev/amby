import { redirect } from 'next/navigation';
import { getRequiredSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManage } from '@/lib/permissions';
import { MainLayout } from '@/components/layout/main-layout';
import { WorkspaceMembersPage } from '@/components/pages/workspace-members-page';

export default async function WorkspaceMembersRoute({
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
    redirect('/home');
  }

  const currentMember = workspace.members.find((m) => m.userId === session.user.id);
  const canManageMembers = currentMember ? canManage(currentMember.role) : false;

  return (
    <MainLayout>
      <WorkspaceMembersPage
        workspace={workspace}
        currentUserId={session.user.id}
        canManageMembers={canManageMembers}
      />
    </MainLayout>
  );
}
