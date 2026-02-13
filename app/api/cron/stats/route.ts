import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

  if (expectedAuth && authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const today = getTodayUTC();

    const [usersCount, documentsCount] = await Promise.all([
      prisma.user.count(),
      prisma.document.count({ where: { deletedAt: null } }),
    ]);

    await prisma.systemStatsLog.upsert({
      where: { date: today },
      create: {
        date: today,
        documentsCount,
        usersCount,
      },
      update: {
        documentsCount,
        usersCount,
      },
    });

    return NextResponse.json({
      ok: true,
      date: today.toISOString().slice(0, 10),
      usersCount,
      documentsCount,
    });
  } catch (error) {
    console.error('[cron/stats]', error);
    return NextResponse.json({ error: 'Erro ao registrar estatísticas' }, { status: 500 });
  }
}
