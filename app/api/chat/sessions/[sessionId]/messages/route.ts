import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ChatMessageRole } from '@prisma/client'

async function ensureSessionAccess(sessionId: string, userId: string) {
  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      workspace: {
        select: { id: true },
      },
    },
  })

  if (!chatSession) {
    return { error: 'Sessão não encontrada' as const, status: 404 as const }
  }

  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: chatSession.workspaceId,
      userId,
    },
  })

  if (!member) {
    return { error: 'Acesso negado ao workspace' as const, status: 403 as const }
  }

  return { chatSession }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const access = await ensureSessionAccess(params.sessionId, session.user.id)
    if ('error' in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: params.sessionId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Erro ao listar mensagens do chat:', error)
    return NextResponse.json(
      { error: 'Erro ao listar mensagens do chat' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const access = await ensureSessionAccess(params.sessionId, session.user.id)
    if ('error' in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    const body = await request.json()
    const {
      content,
      role,
      metadata,
    } = body as {
      content: string
      role?: ChatMessageRole | 'USER' | 'ASSISTANT' | 'SYSTEM'
      metadata?: unknown
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'content é obrigatório' },
        { status: 400 }
      )
    }

    const normalizedRole =
      (role as ChatMessageRole | undefined) ?? ChatMessageRole.USER

    // Por segurança, quando for o usuário final chamando esse endpoint,
    // forçamos role USER e atrelamos o userId.
    const messageRole =
      normalizedRole === ChatMessageRole.ASSISTANT ||
      normalizedRole === ChatMessageRole.SYSTEM
        ? ChatMessageRole.USER
        : ChatMessageRole.USER

    const message = await prisma.chatMessage.create({
      data: {
        sessionId: params.sessionId,
        userId: session.user.id,
        role: messageRole,
        content: content.trim(),
        metadata: metadata as any,
      },
    })

    // Atualiza o updatedAt da sessão para facilitar ordenação recente
    await prisma.chatSession.update({
      where: { id: params.sessionId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar mensagem de chat:', error)
    return NextResponse.json(
      { error: 'Erro ao criar mensagem de chat' },
      { status: 500 }
    )
  }
}

