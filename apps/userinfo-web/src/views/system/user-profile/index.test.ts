/**
 * 个人中心（用户资料）页伴生测试
 *
 * @path apps/userinfo-web/src/views/system/user-profile/index.test.ts
 * @author ydsz-team
 * @since 26.11.06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mount } from '@vue/test-utils';
import { h, type Slot } from 'vue';

// ── Mock 依赖 ──────────────────────────────────────────────

interface MockSetupContext {
  slots: Record<string, Slot | undefined>;
}

vi.mock('#/api/userProfile', () => ({
  getCurrentUserProfile: vi.fn().mockResolvedValue({}),
  updateCurrentUserProfile: vi.fn().mockResolvedValue({}),
  changePassword: vi.fn().mockResolvedValue({}),
  uploadAvatar: vi.fn().mockResolvedValue(''),
  getMfaStatus: vi.fn().mockResolvedValue(false),
  setupMfa: vi.fn().mockResolvedValue({}),
  activateMfa: vi.fn().mockResolvedValue({}),
  disableMfa: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('@ydsz/common-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Page: {
      name: 'Page',
      setup:
        (_props: unknown, { slots }: MockSetupContext) =>
        () =>
          h('div', { class: 'mock-page' }, slots.default?.()),
    },
  };
});

vi.mock('@ydsz-core/ydsz-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    YdButton: { name: 'YdButton', render: () => h('button') },
    YdCard: { name: 'YdCard', render: () => h('div') },
    YdCardContent: { name: 'YdCardContent', render: () => h('div') },
    YdCardHeader: { name: 'YdCardHeader', render: () => h('div') },
    YdCardTitle: { name: 'YdCardTitle', render: () => h('div') },
    YdTabs: { name: 'YdTabs', render: () => h('div') },
    YdTabsContent: { name: 'YdTabsContent', render: () => h('div') },
    YdTabsList: { name: 'YdTabsList', render: () => h('div') },
    YdTabsTrigger: { name: 'YdTabsTrigger', render: () => h('div') },
    YdForm: { name: 'YdForm', render: () => h('form') },
    YdFormItem: { name: 'YdFormItem', render: () => h('div') },
    YdInput: { name: 'YdInput', render: () => h('input') },
    YdSwitch: { name: 'YdSwitch', render: () => h('div') },
    YdImage: { name: 'YdImage', render: () => h('img') },
    YdUpload: { name: 'YdUpload', render: () => h('div') },
  };
});

vi.mock('@ydsz/icons', () => ({
  Loader2: { name: 'Loader2', render: () => h('svg') },
}));

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@ydsz-core/popup-ui', () => ({
  YdConfirm: vi.fn().mockResolvedValue({}),
}));

// ── 被测组件 ──────────────────────────────────────────────

import UserProfileManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('UserProfileManagement', () => {
  function createWrapper() {
    return mount(UserProfileManagement, {
      global: {
        stubs: {
          Teleport: { template: '<div><slot /></div>' },
        },
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应成功渲染组件', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('defineOptions 应设置正确的组件名', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.$options.name).toBe('UserProfileManagement');
  });

  it('应在 Page 容器内渲染', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-page').exists()).toBe(true);
  });

  it('应渲染 Tab 触发器', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-page div').exists()).toBe(true);
  });
});
