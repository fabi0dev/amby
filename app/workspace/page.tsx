import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function WorkspaceListPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (workspace) {
    redirect(`/workspace/${workspace.id}`);
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Nenhum workspace encontrado</h1>
        <p className="mt-2 text-muted-foreground">Você não tem acesso a nenhum workspace ainda.</p>
      </div>
    </div>
  );
}
