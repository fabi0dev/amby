'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { getMarkdownFromContent } from '@/lib/document-content';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const createDocumentSchema = z.object({
  workspaceId: z.string(),
  title: z.string().min(1),
  parentId: z.string().optional(),
});

const updateDocumentSchema = z.object({
  documentId: z.string(),
  title: z.string().min(1).optional(),
  content: z.any().optional(),
  isPublished: z.boolean().optional(),
});

const duplicateDocumentSchema = z.object({
  documentId: z.string(),
});

const moveDocumentSchema = z.object({
  documentId: z.string(),
  targetWorkspaceId: z.string(),
});

export async function createDocument(data: z.infer<typeof createDocumentSchema>) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
    }

    const validated = createDocumentSchema.parse(data);

    // Verificar permissão
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: validated.workspaceId,
        userId: session.user.id,
      },
    });

    if (!member || !['OWNER', 'ADMIN', 'EDITOR'].includes(member.role)) {
      return { error: 'Sem permissão para criar documentos' };
    }

    let slug = slugify(validated.title);
    const existing = await prisma.document.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: validated.workspaceId,
          slug,
        },
      },
    });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    // Criar documento (identificação por id; slug só para compatibilidade do schema)
    const document = await prisma.document.create({
      data: {
        workspaceId: validated.workspaceId,
        title: validated.title,
        slug,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [],
            },
          ],
        },
      },
    });

    // Criar entrada na árvore
    let path = '1';
    let depth = 0;
    let order = 0;

    if (validated.parentId) {
      const parent = await prisma.documentTree.findUnique({
        where: { documentId: validated.parentId },
      });

      if (parent) {
        depth = parent.depth + 1;
        const siblings = await prisma.documentTree.findMany({
          where: {
            workspaceId: validated.workspaceId,
            parentId: validated.parentId,
          },
        });
        order = siblings.length;
        path = `${parent.path}.${order + 1}`;
      }
    } else {
      const roots = await prisma.documentTree.findMany({
        where: {
          workspaceId: validated.workspaceId,
          parentId: null,
        },
      });
      order = roots.length;
      path = `${order + 1}`;
    }

    await prisma.documentTree.create({
      data: {
        workspaceId: validated.workspaceId,
        documentId: document.id,
        parentId: validated.parentId || null,
        path,
        depth,
        order,
      },
    });

    revalidatePath(`/workspace/${validated.workspaceId}`);

    return { data: document };
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Erro ao criar documento' };
  }
}

export async function updateDocument(data: z.infer<typeof updateDocumentSchema>) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
    }

    const validated = updateDocumentSchema.parse(data);

    // Buscar documento
    const document = await prisma.document.findUnique({
      where: { id: validated.documentId },
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

    // Verificar permissão
    const member = document.workspace.members[0];
    if (!member || !['OWNER', 'ADMIN', 'EDITOR'].includes(member.role)) {
      return { error: 'Sem permissão para editar documentos' };
    }

    // Criar versão antes de atualizar
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId: validated.documentId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestVersion?.version || 0) + 1;

    await prisma.documentVersion.create({
      data: {
        documentId: validated.documentId,
        userId: session.user.id,
        content: document.content as Prisma.InputJsonValue,
        version: newVersion,
        event: 'updated',
      },
    });

    // Atualizar documento
    const updated = await prisma.document.update({
      where: { id: validated.documentId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.content && { content: validated.content }),
        ...(validated.isPublished !== undefined && { isPublished: validated.isPublished }),
      },
    });

    revalidatePath(`/workspace/${document.workspaceId}`);

    return { data: updated };
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Erro ao atualizar documento' };
  }
}

export async function deleteDocument(documentId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
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
      return { error: 'Documento não encontrado' };
    }

    const member = document.workspace.members[0];
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return { error: 'Sem permissão para deletar documentos' };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath(`/workspace/${document.workspaceId}`);

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    return { error: 'Erro ao deletar documento' };
  }
}

export async function duplicateDocument(data: z.infer<typeof duplicateDocumentSchema>) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
    }

    const validated = duplicateDocumentSchema.parse(data);

    const document = await prisma.document.findUnique({
      where: { id: validated.documentId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        tree: true,
      },
    });

    if (!document) {
      return { error: 'Documento não encontrado' };
    }

    const member = document.workspace.members[0];
    if (!member || !['OWNER', 'ADMIN', 'EDITOR'].includes(member.role)) {
      return { error: 'Sem permissão para duplicar documentos' };
    }

    const baseTitle = document.title || 'Página sem título';
    const newTitle = `${baseTitle} (cópia)`;

    let slug = slugify(newTitle);
    const existing = await prisma.document.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: document.workspaceId,
          slug,
        },
      },
    });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const workspaceId = document.workspaceId;
    const parentId = document.tree?.parentId ?? null;

    const result = await prisma.$transaction(async (tx) => {
      const duplicated = await tx.document.create({
        data: {
          workspaceId,
          title: newTitle,
          slug,
          content: document.content as Prisma.InputJsonValue,
        },
      });

      // criar nó na árvore ao lado do original
      const siblings = await tx.documentTree.findMany({
        where: {
          workspaceId,
          parentId,
        },
      });
      const order = siblings.length;
      const depth = document.tree?.depth ?? 0;

      let path = `${order + 1}`;
      if (parentId && document.tree) {
        path = `${document.tree.path}.${order + 1}`;
      }

      await tx.documentTree.create({
        data: {
          workspaceId,
          documentId: duplicated.id,
          parentId,
          path,
          depth,
          order,
        },
      });

      return duplicated;
    });

    revalidatePath(`/workspace/${workspaceId}`);

    return { data: result };
  } catch (error) {
    console.error('Erro ao duplicar documento:', error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Erro ao duplicar documento' };
  }
}

export async function exportDocumentAsMarkdown(documentId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
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
      return { error: 'Documento não encontrado' };
    }

    const member = document.workspace.members[0];
    if (!member) {
      return { error: 'Sem permissão para exportar este documento' };
    }

    const markdown = getMarkdownFromContent(document.content);
    return { data: { markdown, title: document.title || 'pagina' } };
  } catch (error) {
    console.error('Erro ao exportar documento:', error);
    return { error: 'Erro ao exportar documento' };
  }
}

export async function moveDocumentToWorkspace(data: z.infer<typeof moveDocumentSchema>) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { error: 'Não autorizado' };
    }

    const validated = moveDocumentSchema.parse(data);

    const document = await prisma.document.findUnique({
      where: { id: validated.documentId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        tree: true,
      },
    });

    if (!document) {
      return { error: 'Documento não encontrado' };
    }

    if (!document.tree) {
      return { error: 'Documento não está na árvore de páginas' };
    }

    if (document.workspaceId === validated.targetWorkspaceId) {
      return { error: 'A página já pertence a este espaço' };
    }

    const sourceMember = document.workspace.members[0];
    if (!sourceMember || !['OWNER', 'ADMIN', 'EDITOR'].includes(sourceMember.role)) {
      return { error: 'Sem permissão para mover documentos neste espaço' };
    }

    const targetMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: validated.targetWorkspaceId,
        userId: session.user.id,
      },
    });

    if (!targetMember || !['OWNER', 'ADMIN', 'EDITOR'].includes(targetMember.role)) {
      return { error: 'Sem permissão para mover documentos para o espaço selecionado' };
    }

    const sourceWorkspaceId = document.workspaceId;
    const sourceWorkspaceName = document.workspace.name;
    const targetWorkspaceId = validated.targetWorkspaceId;

    const targetWorkspace = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      select: { id: true, name: true },
    });

    if (!targetWorkspace) {
      return { error: 'Workspace de destino não encontrado' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const rootNode = await tx.documentTree.findUnique({
        where: { documentId: document.id },
      });

      if (!rootNode) {
        throw new Error('Nó da árvore não encontrado para o documento');
      }

      const rootsInTarget = await tx.documentTree.findMany({
        where: {
          workspaceId: targetWorkspaceId,
          parentId: null,
        },
      });

      const newOrder = rootsInTarget.length;
      const newRootPath = `${newOrder + 1}`;

      const subtreeNodes = await tx.documentTree.findMany({
        where: {
          workspaceId: sourceWorkspaceId,
          path: {
            startsWith: rootNode.path,
          },
        },
      });

      await Promise.all(
        subtreeNodes.map((node) => {
          const suffix = node.path.slice(rootNode.path.length);
          const newPath = `${newRootPath}${suffix}`;

          const isRoot = node.id === rootNode.id;

          return tx.documentTree.update({
            where: { id: node.id },
            data: {
              workspaceId: targetWorkspaceId,
              path: newPath,
              ...(isRoot
                ? {
                    parentId: null,
                    depth: 0,
                    order: newOrder,
                  }
                : {}),
            },
          });
        }),
      );

      await tx.document.update({
        where: { id: document.id },
        data: {
          workspaceId: targetWorkspaceId,
        },
      });

      const latestVersion = await tx.documentVersion.findFirst({
        where: { documentId: document.id },
        orderBy: { version: 'desc' },
      });

      const newVersion = (latestVersion?.version || 0) + 1;

      await tx.documentVersion.create({
        data: {
          documentId: document.id,
          userId: session.user.id,
          content: document.content as Prisma.InputJsonValue,
          version: newVersion,
          event: 'moved',
          metadata: {
            fromWorkspaceId: sourceWorkspaceId,
            fromWorkspaceName: sourceWorkspaceName,
            toWorkspaceId: targetWorkspace.id,
            toWorkspaceName: targetWorkspace.name,
          },
        },
      });

      await tx.chatSession.updateMany({
        where: {
          documentId: document.id,
          workspaceId: sourceWorkspaceId,
        },
        data: {
          workspaceId: targetWorkspaceId,
        },
      });

      return { targetWorkspaceId };
    });

    revalidatePath(`/workspace/${sourceWorkspaceId}`);
    revalidatePath(`/workspace/${targetWorkspaceId}`);
    revalidatePath(`/home`);

    return { data: result };
  } catch (error) {
    console.error('Erro ao mover documento de workspace:', error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Erro ao mover documento para outro espaço' };
  }
}
