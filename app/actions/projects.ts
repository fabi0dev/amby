'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { ProjectRole } from '@prisma/client';

const createProjectSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const setProjectMemberSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  role: z.enum(['EDITOR', 'VIEWER']),
});

async function canManageProject(workspaceId: string, userId: string): Promise<boolean> {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });
  return !!member && ['OWNER', 'ADMIN'].includes(member.role);
}

async function canEditProject(
  projectId: string,
  userId: string,
): Promise<{ ok: boolean; isWorkspaceAdmin?: boolean }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
      members: {
        where: { userId },
      },
    },
  });
  if (!project) return { ok: false };
  const wsMember = project.workspace.members[0];
  if (wsMember && ['OWNER', 'ADMIN', 'EDITOR'].includes(wsMember.role)) {
    return { ok: true, isWorkspaceAdmin: ['OWNER', 'ADMIN'].includes(wsMember.role) };
  }
  const pm = project.members[0];
  if (pm && pm.role === 'EDITOR') return { ok: true };
  return { ok: false };
}

export async function createProject(data: z.infer<typeof createProjectSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'Não autorizado' };

    const validated = createProjectSchema.parse(data);
    if (!(await canManageProject(validated.workspaceId, session.user.id))) {
      return { error: 'Sem permissão para criar projetos' };
    }

    let slug = slugify(validated.name);
    const existing = await prisma.project.findUnique({
      where: {
        workspaceId_slug: {
          workspaceId: validated.workspaceId,
          slug,
        },
      },
    });
    if (existing) slug = `${slug}-${Date.now()}`;

    const project = await prisma.project.create({
      data: {
        workspaceId: validated.workspaceId,
        name: validated.name,
        slug,
        description: validated.description ?? null,
      },
    });

    revalidatePath(`/workspace/${validated.workspaceId}`);
    revalidatePath(`/workspace/${validated.workspaceId}/project/${project.id}`);
    return { data: project };
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Erro ao criar projeto' };
  }
}

export async function updateProject(data: z.infer<typeof updateProjectSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'Não autorizado' };

    const validated = updateProjectSchema.parse(data);
    const project = await prisma.project.findUnique({
      where: { id: validated.projectId },
    });
    if (!project) return { error: 'Projeto não encontrado' };

    if (!(await canManageProject(project.workspaceId, session.user.id))) {
      return { error: 'Sem permissão para editar este projeto' };
    }

    let slug: string | undefined;
    if (validated.name && validated.name !== project.name) {
      slug = slugify(validated.name);
      const existing = await prisma.project.findFirst({
        where: {
          workspaceId: project.workspaceId,
          slug,
          id: { not: project.id },
        },
      });
      if (existing) slug = `${slug}-${Date.now()}`;
    }

    const updated = await prisma.project.update({
      where: { id: validated.projectId },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description ?? null }),
        ...(slug && { slug }),
      },
    });

    revalidatePath(`/workspace/${project.workspaceId}`);
    revalidatePath(`/workspace/${project.workspaceId}/project/${updated.id}`);
    return { data: updated };
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Erro ao atualizar projeto' };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'Não autorizado' };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return { error: 'Projeto não encontrado' };

    if (!(await canManageProject(project.workspaceId, session.user.id))) {
      return { error: 'Sem permissão para excluir este projeto' };
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath(`/workspace/${project.workspaceId}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir projeto:', error);
    return { error: 'Erro ao excluir projeto' };
  }
}

export async function getProjectsByWorkspace(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const hasAccess = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id },
  });
  if (!hasAccess) return [];

  return prisma.project.findMany({
    where: { workspaceId },
    include: {
      _count: {
        select: {
          documents: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getProject(projectId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: { userId: session.user.id },
        },
      },
    },
    include: {
      workspace: { select: { id: true, name: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: {
        select: {
          documents: { where: { deletedAt: null } },
        },
      },
    },
  });
  return project;
}

export async function getProjectMembers(projectId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: { userId: session.user.id },
        },
      },
    },
  });
  if (!project) return [];

  return prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function setProjectMember(data: z.infer<typeof setProjectMemberSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'Não autorizado' };

    const validated = setProjectMemberSchema.parse(data);
    const project = await prisma.project.findUnique({
      where: { id: validated.projectId },
    });
    if (!project) return { error: 'Projeto não encontrado' };

    if (!(await canManageProject(project.workspaceId, session.user.id))) {
      return { error: 'Sem permissão para gerenciar membros do projeto' };
    }

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: project.workspaceId,
        userId: validated.userId,
      },
    });
    if (!workspaceMember) {
      return { error: 'Usuário não é membro do workspace' };
    }

    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: validated.projectId,
          userId: validated.userId,
        },
      },
      create: {
        projectId: validated.projectId,
        userId: validated.userId,
        role: validated.role as ProjectRole,
      },
      update: {
        role: validated.role as ProjectRole,
      },
    });

    revalidatePath(`/workspace/${project.workspaceId}/project/${validated.projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao definir membro do projeto:', error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Erro ao definir membro do projeto' };
  }
}

export async function removeProjectMember(projectId: string, userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: 'Não autorizado' };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return { error: 'Projeto não encontrado' };

    if (!(await canManageProject(project.workspaceId, session.user.id))) {
      return { error: 'Sem permissão para gerenciar membros do projeto' };
    }

    await prisma.projectMember.deleteMany({
      where: { projectId, userId },
    });

    revalidatePath(`/workspace/${project.workspaceId}/project/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover membro do projeto:', error);
    return { error: 'Erro ao remover membro do projeto' };
  }
}

export type ProjectWithCount = Awaited<ReturnType<typeof getProjectsByWorkspace>>[number];
export type ProjectFull = Awaited<ReturnType<typeof getProject>>;
export type ProjectMemberWithUser = Awaited<ReturnType<typeof getProjectMembers>>[number];
