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
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId é obrigatório' }, { status: 400 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Acesso negado ao workspace' }, { status: 403 });
    }

    const tree = await prisma.documentTree.findMany({
      where: {
        workspaceId,
        document: {
          deletedAt: null,
          ...(projectId ? { projectId } : {}),
        },
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            slug: true,
            updatedAt: true,
            projectId: true,
          },
        },
      },
      orderBy: [{ path: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json(tree);
  } catch (error) {
    console.error('Erro ao buscar árvore de documentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar árvore de documentos' }, { status: 500 });
  }
}
