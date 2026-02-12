import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Remove um app do dashboard do usuário. */
export async function DELETE(_request: Request, { params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const appId = params.appId?.trim();
  if (!appId) {
    return NextResponse.json({ error: 'appId obrigatório' }, { status: 400 });
  }

  await prisma.userApp.deleteMany({
    where: {
      userId: session.user.id,
      appId,
    },
  });

  return NextResponse.json({ ok: true });
}
