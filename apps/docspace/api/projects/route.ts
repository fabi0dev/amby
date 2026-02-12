import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProjectsByWorkspace } from '@/app/actions/projects';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId é obrigatório' }, { status: 400 });
    }

    const projects = await getProjectsByWorkspace(workspaceId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    return NextResponse.json({ error: 'Erro ao listar projetos' }, { status: 500 });
  }
}
