import { Role, Permission } from '@prisma/client';

const rolePermissions: Record<Role, Permission[]> = {
  OWNER: ['READ', 'WRITE', 'DELETE', 'MANAGE'],
  ADMIN: ['READ', 'WRITE', 'DELETE', 'MANAGE'],
  EDITOR: ['READ', 'WRITE'],
  VIEWER: ['READ'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canRead(role: Role): boolean {
  return hasPermission(role, 'READ');
}

export function canWrite(role: Role): boolean {
  return hasPermission(role, 'WRITE');
}

export function canDelete(role: Role): boolean {
  return hasPermission(role, 'DELETE');
}

export function canManage(role: Role): boolean {
  return hasPermission(role, 'MANAGE');
}
