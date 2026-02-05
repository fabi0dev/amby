'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const createDocumentSchema = z.object({
  workspaceId: z.string(),
  title: z.string().min(1),
  parentId: z.string().optional(),
})

const updateDocumentSchema = z.object({
  documentId: z.string(),
  title: z.string().min(1).optional(),
  content: z.any().optional(),
  isPublished: z.boolean().optional(),
})

export async function createDocument(data: z.infer<typeof createDocumentSchema>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { error: 'Não autorizado' }
    }

    const validated = createDocumentSchema.parse(data)

    // Verificar permissão
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: validated.workspaceId,
        userId: session.user.id,
      },
    })

    if (!member || !['OWNER', 'ADMIN', 'EDITOR'].includes(member.role)) {
      return { error: 'Sem permissão para criar documentos' }
    }

    let slug = slugify(validated.title)
    const existing = await prisma.document.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: validated.workspaceId,
          slug,
        },
      },
    })
    if (existing) {
      slug = `${slug}-${Date.now()}`
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
    })

    // Criar entrada na árvore
    let path = '1'
    let depth = 0
    let order = 0

    if (validated.parentId) {
      const parent = await prisma.documentTree.findUnique({
        where: { documentId: validated.parentId },
      })

      if (parent) {
        depth = parent.depth + 1
        const siblings = await prisma.documentTree.findMany({
          where: {
            workspaceId: validated.workspaceId,
            parentId: validated.parentId,
          },
        })
        order = siblings.length
        path = `${parent.path}.${order + 1}`
      }
    } else {
      const roots = await prisma.documentTree.findMany({
        where: {
          workspaceId: validated.workspaceId,
          parentId: null,
        },
      })
      order = roots.length
      path = `${order + 1}`
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
    })

    revalidatePath(`/workspace/${validated.workspaceId}`)

    return { data: document }
  } catch (error) {
    console.error('Erro ao criar documento:', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao criar documento' }
  }
}

export async function updateDocument(data: z.infer<typeof updateDocumentSchema>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { error: 'Não autorizado' }
    }

    const validated = updateDocumentSchema.parse(data)

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
    })

    if (!document) {
      return { error: 'Documento não encontrado' }
    }

    // Verificar permissão
    const member = document.workspace.members[0]
    if (!member || !['OWNER', 'ADMIN', 'EDITOR'].includes(member.role)) {
      return { error: 'Sem permissão para editar documentos' }
    }

    // Criar versão antes de atualizar
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId: validated.documentId },
      orderBy: { version: 'desc' },
    })

    const newVersion = (latestVersion?.version || 0) + 1

    await prisma.documentVersion.create({
      data: {
        documentId: validated.documentId,
        userId: session.user.id,
        content: document.content as Prisma.InputJsonValue,
        version: newVersion,
      },
    })

    // Atualizar documento
    const updated = await prisma.document.update({
      where: { id: validated.documentId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.content && { content: validated.content }),
        ...(validated.isPublished !== undefined && { isPublished: validated.isPublished }),
      },
    })

    revalidatePath(`/workspace/${document.workspaceId}`)

    return { data: updated }
  } catch (error) {
    console.error('Erro ao atualizar documento:', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar documento' }
  }
}

export async function deleteDocument(documentId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { error: 'Não autorizado' }
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
    })

    if (!document) {
      return { error: 'Documento não encontrado' }
    }

    const member = document.workspace.members[0]
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return { error: 'Sem permissão para deletar documentos' }
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
      },
    })

    revalidatePath(`/workspace/${document.workspaceId}`)

    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar documento:', error)
    return { error: 'Erro ao deletar documento' }
  }
}
