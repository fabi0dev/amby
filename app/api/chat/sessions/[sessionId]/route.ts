import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function ensureSessionAccess(sessionId: string, userId: string) {
  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      workspace: { select: { id: true } },
    },
  });

  if (!chatSession) {
    return { error: 'Sessão não encontrada' as const, status: 404 as const };
  }

  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: chatSession.workspaceId,
      userId,
    },
  });

  if (!member) {
    return { error: 'Acesso negado ao workspace' as const, status: 403 as const };
  }

  return { chatSession };
}

/** Atualiza a sessão (ex.: remover documento de contexto). */
export async function PATCH(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const access = await ensureSessionAccess(params.sessionId, session.user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await request.json().catch(() => ({}));
    const { documentId } = body as { documentId?: string | null };

    const updated = await prisma.chatSession.update({
      where: { id: params.sessionId },
      data: { documentId: documentId ?? null },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar sessão de chat:', error);
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 });
  }
}
