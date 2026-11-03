import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useAccessStore, useUserStore } from '@ydsz/stores';

import { useAccess } from './use-access';

describe('useAccess', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('uses OR semantics for role permission checks', () => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    accessStore.accessCodes = ['system:user:read'];
    userStore.userRoles = ['auditor'];

    const { hasAccessByCodes, hasAccessByRoles } = useAccess();

    expect(hasAccessByCodes(['system:user:read', 'system:user:write'])).toBe(true);
    expect(hasAccessByCodes(['system:user:write'])).toBe(false);
    expect(hasAccessByRoles(['auditor', 'admin'])).toBe(true);
    expect(hasAccessByRoles(['admin'])).toBe(false);
  });

  it('uses AND semantics for full permission checks', () => {
    const accessStore = useAccessStore();
    accessStore.accessCodes = ['system:user:read', 'system:user:write'];

    const { hasAccessByCodesAll } = useAccess();

    expect(hasAccessByCodesAll(['system:user:read', 'system:user:write'])).toBe(true);
    expect(hasAccessByCodesAll(['system:user:read', 'system:role:write'])).toBe(false);
  });

  it('returns undefined data scope as unrestricted', () => {
    const accessStore = useAccessStore();
    accessStore.dataScopes = {};

    const { getDataScope, hasDataScope } = useAccess();

    expect(getDataScope('project:budget')).toBeUndefined();
    expect(hasDataScope('project:budget')).toBe(true);
  });

  it('treats an empty data scope as fully restricted', () => {
    const accessStore = useAccessStore();
    accessStore.dataScopes = { 'project:budget': [] };

    const { getDataScope, hasDataScope } = useAccess();

    expect(getDataScope('project:budget')).toEqual([]);
    expect(hasDataScope('project:budget')).toBe(false);
  });

  it('applies field permissions for read, mask, and hidden modes', () => {
    const accessStore = useAccessStore();
    accessStore.fieldPermissions = {
      'project.budget.amount': 'mask',
      'project.secret': 'hidden',
      'project.name': 'read',
    };

    const { applyFieldMask, getFieldPermission } = useAccess();

    expect(getFieldPermission('project.name')).toBe('read');
    expect(applyFieldMask('project.name', '云顶项目')).toBe('云顶项目');
    expect(applyFieldMask('project.budget.amount', '12345678')).toBe('12****78');
    expect(applyFieldMask('project.secret', '机密数据')).toBe('');
  });
});
