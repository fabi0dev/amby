import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { APP_REGISTRY } from '@/apps/registry';

/** Lista todos os apps disponíveis no marketplace. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  return NextResponse.json({ apps: APP_REGISTRY });
}
