import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const workspaceId = searchParams.get('workspaceId');

    if (!q || q.length < 2) {
      return NextResponse.json({ documents: [], workspaces: [] });
    }

    const userWorkspaceIds = await prisma.workspaceMember
      .findMany({
        where: { userId: session.user.id },
        select: { workspaceId: true },
      })
      .then((rows) => rows.map((r) => r.workspaceId));

    if (userWorkspaceIds.length === 0) {
      return NextResponse.json({ documents: [], workspaces: [] });
    }

    const workspaceFilter = workspaceId
      ? userWorkspaceIds.includes(workspaceId)
        ? [workspaceId]
        : userWorkspaceIds
      : userWorkspaceIds;

    const documents = await prisma.document.findMany({
      where: {
        workspaceId: { in: workspaceFilter },
        deletedAt: null,
        title: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        workspaceId: true,
        updatedAt: true,
        workspace: { select: { name: true } },
      },
      take: 15,
      orderBy: { updatedAt: 'desc' },
    });

    const workspaces = await prisma.workspace.findMany({
      where: {
        id: { in: userWorkspaceIds },
        name: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
      },
      take: 5,
    });

    return NextResponse.json({ documents, workspaces });
  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 });
  }
}
