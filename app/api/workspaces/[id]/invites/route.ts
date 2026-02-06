import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManage } from '@/lib/permissions'
import { Role } from '@prisma/client'
import crypto from 'crypto'

const INVITE_EXPIRES_DAYS = 7

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: params.id, userId: session.user.id },
    })
    if (!member || !canManage(member.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const invites = await prisma.workspaceInvite.findMany({
      where: {
        workspaceId: params.id,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(invites)
  } catch (error) {
    console.error('Erro ao listar convites:', error)
    return NextResponse.json({ error: 'Erro ao listar convites' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const workspaceId = params.id
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })
    if (!member || !canManage(member.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const email = (body.email as string)?.trim().toLowerCase()
    const role = (body.role as Role) || 'VIEWER'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }
    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Papel inválido' }, { status: 400 })
    }

    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
      },
    })
    if (existingMember) {
      return NextResponse.json({ error: 'Este usuário já é membro do workspace' }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRES_DAYS)
    const token = crypto.randomBytes(32).toString('hex')

    const invite = await prisma.workspaceInvite.upsert({
      where: {
        workspaceId_email: { workspaceId, email },
      },
      create: {
        workspaceId,
        email,
        role,
        token,
        expiresAt,
        invitedById: session.user.id,
      },
      update: {
        role,
        token,
        expiresAt,
        invitedById: session.user.id,
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })
    return NextResponse.json(invite)
  } catch (error) {
    console.error('Erro ao criar convite:', error)
    return NextResponse.json({ error: 'Erro ao criar convite' }, { status: 500 })
  }
}
