'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Permission } from '@prisma/client';

type ShareMode = 'read' | 'edit';

interface CreateShareLinkInput {
  documentId: string;
  mode: ShareMode;
}

export async function createShareLink(input: CreateShareLinkInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
    }

    const document = await prisma.document.findUnique({
      where: { id: input.documentId },
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
      return { error: 'Documento não encontrado' };
    }

    const member = document.workspace.members[0];
    if (!member) {
      return { error: 'Sem permissão para compartilhar este documento' };
    }

    const permission: Permission =
      input.mode === 'read' ? Permission.READ : Permission.WRITE;

    // Para links de edição, exigir permissão equivalente a editar o documento
    if (
      permission === Permission.WRITE &&
      !['OWNER', 'ADMIN', 'EDITOR'].includes(member.role)
    ) {
      return { error: 'Sem permissão para gerar link com edição cooperativa' };
    }

    // Reutilizar link existente com mesma permissão, se houver
    const existing = await prisma.documentShare.findFirst({
      where: {
        documentId: document.id,
        permission,
      },
    });

    if (existing) {
      return { data: { token: existing.token, permission } };
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

    return { data: { token: created.token, permission: created.permission } };
  } catch (error) {
    console.error('Erro ao criar link de compartilhamento:', error);
    return { error: 'Erro ao criar link de compartilhamento' };
  }
}

