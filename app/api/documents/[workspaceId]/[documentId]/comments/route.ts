import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string; documentId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: params.workspaceId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Acesso negado ao workspace' }, { status: 403 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.documentId,
        workspaceId: params.workspaceId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);

    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    const position = body && typeof body.position === 'object' ? body.position : undefined;

    if (!content) {
      return NextResponse.json(
        { error: 'O conteúdo do comentário é obrigatório.' },
        { status: 400 },
      );
    }

    const comment = await prisma.documentComment.create({
      data: {
        documentId: document.id,
        userId: session.user.id,
        content,
        position: position ?? null,
      },
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
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 });
  }
}
