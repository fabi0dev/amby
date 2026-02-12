import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAppById, APP_REGISTRY } from '@/apps/registry';

/** Lista apps ativados do usuário. Se não tiver nenhum, garante Docspace e retorna. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let userApps = await prisma.userApp.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: 'asc' },
  });

  if (userApps.length === 0) {
    await prisma.userApp.create({
      data: {
        userId: session.user.id,
        appId: 'docspace',
        sortOrder: 0,
      },
    });
    userApps = await prisma.userApp.findMany({
      where: { userId: session.user.id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  const apps = userApps
    .map((ua) => getAppById(ua.appId))
    .filter((a): a is NonNullable<typeof a> => a != null);

  return NextResponse.json({ apps });
}

/** Ativa um app no dashboard do usuário. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const appId = typeof body.appId === 'string' ? body.appId.trim() : null;
  if (!appId) {
    return NextResponse.json({ error: 'appId obrigatório' }, { status: 400 });
  }

  if (!getAppById(appId)) {
    return NextResponse.json({ error: 'App não encontrado' }, { status: 404 });
  }

  const existing = await prisma.userApp.findUnique({
    where: {
      userId_appId: { userId: session.user.id, appId },
    },
  });
  if (existing) {
    return NextResponse.json({ ok: true, message: 'App já ativado' });
  }

  const maxOrder = await prisma.userApp
    .aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true },
    })
    .then((r) => r._max.sortOrder ?? -1);

  await prisma.userApp.create({
    data: {
      userId: session.user.id,
      appId,
      sortOrder: maxOrder + 1,
    },
  });

  return NextResponse.json({ ok: true });
}
