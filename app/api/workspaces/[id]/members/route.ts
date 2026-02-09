import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManage } from '@/lib/permissions';
import { Role } from '@prisma/client';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const workspaceId = params.id;
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });
    if (!member || !canManage(member.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body as { userId: string; role: Role };
    if (!userId || !role || !['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const target = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!target) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }
    if (target.role === 'OWNER') {
      return NextResponse.json({ error: 'Não é possível alterar o proprietário' }, { status: 400 });
    }
    if (member.role === 'ADMIN' && target.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode alterar administradores' },
        { status: 403 },
      );
    }

    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const workspaceId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    });
    if (!member || !canManage(member.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const target = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!target) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }
    if (target.role === 'OWNER') {
      return NextResponse.json({ error: 'Não é possível remover o proprietário' }, { status: 400 });
    }
    if (member.role === 'ADMIN' && target.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas o proprietário pode remover administradores' },
        { status: 403 },
      );
    }

    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
  }
}
