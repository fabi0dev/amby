import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WorkspaceLayout } from '@/components/layout/workspace-layout'
import { MainLayout } from '@/components/layout/main-layout'

export default async function DocumentPage({
  params,
}: {
  params: { workspaceId: string; documentId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const document = await prisma.document.findFirst({
    where: {
      id: params.documentId,
      workspaceId: params.workspaceId,
      deletedAt: null,
    },
    include: {
      workspace: {
        include: {
          members: {
            where: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  })

  if (!document || document.workspace.members.length === 0) {
    redirect(`/workspace/${params.workspaceId}`)
  }

  return (
    <MainLayout>
      <WorkspaceLayout workspaceId={params.workspaceId} documentId={params.documentId} />
    </MainLayout>
  )
}
