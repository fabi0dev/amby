'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { canManage } from '@/lib/permissions'
import { Role } from '@prisma/client'
import crypto from 'crypto'

const updateWorkspaceSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
})

const inviteSchema = z.object({
  workspaceId: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
})

const updateMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
})

const removeMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string(),
})

const cancelInviteSchema = z.object({
  workspaceId: z.string(),
  inviteId: z.string(),
})

export async function updateWorkspace(data: z.infer<typeof updateWorkspaceSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const validated = updateWorkspaceSchema.parse(data)

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: validated.workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (!member || !canManage(member.role)) {
      return { error: 'Sem permissão para atualizar o workspace' }
    }

    const workspace = await prisma.workspace.update({
      where: { id: validated.workspaceId },
      data: {
        name: validated.name,
        description: validated.description,
      },
    })

    revalidatePath(`/settings/workspace/${validated.workspaceId}`)
    revalidatePath(`/workspace/${validated.workspaceId}`)
    return { data: workspace }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar workspace' }
  }
}

export async function inviteToWorkspace(data: z.infer<typeof inviteSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const { workspaceId, email, role } = inviteSchema.parse(data)
    const emailNorm = email.trim().toLowerCase()

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })
    if (!member || !canManage(member.role)) {
      return { error: 'Sem permissão para convidar' }
    }

    const existing = await prisma.workspaceMember.findFirst({
      where: { workspaceId, user: { email: emailNorm } },
    })
    if (existing) {
      return { error: 'Este usuário já é membro do workspace' }
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    const token = crypto.randomBytes(32).toString('hex')

    await prisma.workspaceInvite.upsert({
      where: { workspaceId_email: { workspaceId, email: emailNorm } },
      create: {
        workspaceId,
        email: emailNorm,
        role: role as Role,
        token,
        expiresAt,
        invitedById: session.user.id,
      },
      update: {
        role: role as Role,
        token,
        expiresAt,
        invitedById: session.user.id,
      },
    })

    revalidatePath(`/settings/workspace/${workspaceId}/members`)
    return { data: { ok: true } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao enviar convite' }
  }
}

export async function updateMemberRole(data: z.infer<typeof updateMemberSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const { workspaceId, userId, role } = updateMemberSchema.parse(data)

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })
    if (!member || !canManage(member.role)) {
      return { error: 'Sem permissão' }
    }

    const target = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    })
    if (!target) {
      return { error: 'Membro não encontrado' }
    }
    if (target.role === 'OWNER') {
      return { error: 'Não é possível alterar o proprietário' }
    }
    if (member.role === 'ADMIN' && target.role === 'ADMIN') {
      return { error: 'Apenas o proprietário pode alterar administradores' }
    }

    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role: role as Role },
    })

    revalidatePath(`/settings/workspace/${workspaceId}/members`)
    return { data: { ok: true } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar papel' }
  }
}

export async function removeMember(data: z.infer<typeof removeMemberSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const { workspaceId, userId } = removeMemberSchema.parse(data)

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })
    if (!member || !canManage(member.role)) {
      return { error: 'Sem permissão' }
    }

    const target = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    })
    if (!target) {
      return { error: 'Membro não encontrado' }
    }
    if (target.role === 'OWNER') {
      return { error: 'Não é possível remover o proprietário' }
    }
    if (member.role === 'ADMIN' && target.role === 'ADMIN') {
      return { error: 'Apenas o proprietário pode remover administradores' }
    }

    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    })

    revalidatePath(`/settings/workspace/${workspaceId}/members`)
    return { data: { ok: true } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao remover membro' }
  }
}

export async function cancelInvite(data: z.infer<typeof cancelInviteSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const { workspaceId, inviteId } = cancelInviteSchema.parse(data)

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })
    if (!member || !canManage(member.role)) {
      return { error: 'Sem permissão' }
    }

    await prisma.workspaceInvite.deleteMany({
      where: { id: inviteId, workspaceId },
    })

    revalidatePath(`/settings/workspace/${workspaceId}/members`)
    return { data: { ok: true } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao cancelar convite' }
  }
}
