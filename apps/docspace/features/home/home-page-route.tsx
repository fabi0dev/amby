import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { HomePage } from '@/components/pages/home-page';
import { SystemOffline } from '@/components/system-status/system-offline';

export async function DocspaceHomePageRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    const [workspaces, recentDocuments] = await Promise.all([
      prisma.workspace.findMany({
        where: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
        include: {
          documents: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              updatedAt: 'desc',
            },
            take: 5,
            include: {
              tree: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      prisma.document.findMany({
        where: {
          workspace: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
          deletedAt: null,
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 6,
      }),
    ]);

    const userName =
      session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'Usuário';

    return <HomePage userName={userName} workspaces={workspaces} recentDocuments={recentDocuments} />;
  } catch {
    return <SystemOffline />;
  }
}

