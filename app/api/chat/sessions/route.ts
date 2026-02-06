import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') ?? undefined
    const documentId = searchParams.get('documentId') ?? undefined

    // Garante que o usuário tem acesso ao workspace
    if (workspaceId) {
      const member = await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: session.user.id },
      })

      if (!member) {
        return NextResponse.json(
          { error: 'Acesso negado ao workspace' },
          { status: 403 }
        )
      }
    }

    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: session.user.id,
        ...(workspaceId ? { workspaceId } : {}),
        ...(documentId ? { documentId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        document: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      take: 50,
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Erro ao listar sessões de chat:', error)
    return NextResponse.json(
      { error: 'Erro ao listar sessões de chat' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      workspaceId,
      documentId,
      title,
    } = body as {
      workspaceId: string
      documentId?: string | null
      title?: string | null
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId é obrigatório' },
        { status: 400 }
      )
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Acesso negado ao workspace' },
        { status: 403 }
      )
    }

    if (documentId) {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          workspaceId,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (!document) {
        return NextResponse.json(
          { error: 'Documento não encontrado' },
          { status: 404 }
        )
      }
    }

    const chatSession = await prisma.chatSession.create({
      data: {
        workspaceId,
        documentId: documentId ?? null,
        userId: session.user.id,
        title: title?.trim() || null,
      },
    })

    return NextResponse.json(chatSession, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar sessão de chat:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de chat' },
      { status: 500 }
    )
  }
}

