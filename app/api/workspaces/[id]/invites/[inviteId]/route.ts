import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManage } from '@/lib/permissions'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; inviteId: string } }
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

    await prisma.workspaceInvite.deleteMany({
      where: {
        id: params.inviteId,
        workspaceId: params.id,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao cancelar convite:', error)
    return NextResponse.json({ error: 'Erro ao cancelar convite' }, { status: 500 })
  }
}
