import { describe, it, expect } from 'vitest';
import { hasPermission, canRead, canWrite, canDelete, canManage } from './permissions';
import { Role } from '@prisma/client';

describe('permissions', () => {
  it('OWNER tem todas as permissões', () => {
    expect(hasPermission('OWNER', 'READ')).toBe(true);
    expect(hasPermission('OWNER', 'WRITE')).toBe(true);
    expect(hasPermission('OWNER', 'DELETE')).toBe(true);
    expect(hasPermission('OWNER', 'MANAGE')).toBe(true);
    expect(canManage('OWNER')).toBe(true);
  });

  it('ADMIN tem todas as permissões', () => {
    expect(canRead('ADMIN')).toBe(true);
    expect(canWrite('ADMIN')).toBe(true);
    expect(canDelete('ADMIN')).toBe(true);
    expect(canManage('ADMIN')).toBe(true);
  });

  it('EDITOR pode ler e escrever, não gerenciar', () => {
    expect(canRead('EDITOR')).toBe(true);
    expect(canWrite('EDITOR')).toBe(true);
    expect(canDelete('EDITOR')).toBe(false);
    expect(canManage('EDITOR')).toBe(false);
  });

  it('VIEWER só pode ler', () => {
    expect(canRead('VIEWER')).toBe(true);
    expect(canWrite('VIEWER')).toBe(false);
    expect(canDelete('VIEWER')).toBe(false);
    expect(canManage('VIEWER')).toBe(false);
  });
});
