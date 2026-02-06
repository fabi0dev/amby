'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { slugify } from '@/lib/utils'
import { Role } from '@prisma/client'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

export async function registerUser(data: RegisterInput) {
  try {
    const validated = registerSchema.parse(data)
    const emailNorm = validated.email.trim().toLowerCase()

    const existing = await prisma.user.findUnique({
      where: { email: emailNorm },
    })
    if (existing) {
      return { error: 'Este e-mail já está em uso' }
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10)
    const baseSlug = slugify(validated.name) || 'usuario'
    const slug = `${baseSlug}-${crypto.randomBytes(4).toString('hex')}`

    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        name: validated.name.trim(),
        password: hashedPassword,
      },
    })

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Meu Workspace',
        slug,
        description: 'Workspace inicial',
      },
    })

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: Role.OWNER,
      },
    })

    return { data: { userId: user.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }
}

export async function updateUser(data: z.infer<typeof updateUserSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const validated = updateUserSchema.parse(data)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.name,
      },
    })

    revalidatePath('/settings/user')
    return { data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao atualizar usuário' }
  }
}

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: 'Não autenticado' }
    }

    const validated = changePasswordSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || !user.password) {
      return { error: 'Usuário não encontrado' }
    }

    const isValid = await bcrypt.compare(validated.currentPassword, user.password)
    if (!isValid) {
      return { error: 'Senha atual incorreta' }
    }

    const hashedPassword = await bcrypt.hash(validated.newPassword, 10)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      },
    })

    return { data: { success: true } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Erro ao alterar senha' }
  }
}
