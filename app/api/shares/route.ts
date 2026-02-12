import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Permission } from '@prisma/client';

type ShareMode = 'read' | 'edit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = (await req.json()) as { documentId?: string; mode?: ShareMode };
    const documentId = body.documentId;
    const mode = body.mode ?? 'read';

    if (!documentId) {
      return NextResponse.json({ error: 'Documento não informado' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    const member = document.workspace.members[0];
    if (!member) {
      return NextResponse.json(
        { error: 'Sem permissão para compartilhar este documento' },
        { status: 403 },
      );
    }

    const permission: Permission = mode === 'read' ? Permission.READ : Permission.WRITE;

    if (permission === Permission.WRITE && !['OWNER', 'ADMIN', 'EDITOR'].includes(member.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para gerar link com edição cooperativa' },
        { status: 403 },
      );
    }

    const existing = await prisma.documentShare.findFirst({
      where: {
        documentId: document.id,
        permission,
      },
    });

    if (existing) {
      return NextResponse.json({ token: existing.token, permission: existing.permission });
    }

    const token = crypto.randomUUID();

    const created = await prisma.documentShare.create({
      data: {
        documentId: document.id,
        userId: session.user.id,
        token,
        permission,
      },
    });

    return NextResponse.json({ token: created.token, permission: created.permission });
  } catch (error) {
    console.error('Erro ao criar link de compartilhamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar link de compartilhamento' },
      { status: 500 },
    );
  }
}

