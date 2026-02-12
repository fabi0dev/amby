import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAppById, getAppPathInWorkspace } from '@/apps/registry';
import { WorkspaceHomeView } from '@/components/dashboard/workspace-home-view';

interface PageProps {
  params: { workspaceId: string };
}

export default async function WorkspaceHomePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.workspaceId,
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      workspaceApps: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!workspace) redirect('/dashboard');

  const apps = workspace.workspaceApps
    .map((wa) => {
      const app = getAppById(wa.appId);
      const path = app ? getAppPathInWorkspace(app.id, workspace.id) : null;
      if (!app || !path) return null;
      return { id: app.id, name: app.name, icon: app.icon, path };
    })
    .filter((a): a is NonNullable<typeof a> => a != null);

  return (
    <WorkspaceHomeView workspaceId={workspace.id} workspaceName={workspace.name} apps={apps} />
  );
}
