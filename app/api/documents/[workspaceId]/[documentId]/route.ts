import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: params.workspaceId,
        userId: session.user.id,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Acesso negado ao workspace' },
        { status: 403 }
      )
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.documentId,
        workspaceId: params.workspaceId,
        deletedAt: null,
      },
      include: {
        tree: true,
        comments: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Erro ao buscar documento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar documento' },
      { status: 500 }
    )
  }
}
