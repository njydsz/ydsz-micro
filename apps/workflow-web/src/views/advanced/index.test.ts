/**
 * 高级审批页伴生测试
 *
 * @path apps/workflow-web/src/views/advanced/index.test.ts
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

vi.mock('#/api/flowAdvanced', () => ({
  approvedUsers: vi.fn().mockResolvedValue([]),
  autoForward: vi.fn().mockResolvedValue(0),
  getMergeGroup: vi.fn().mockResolvedValue({}),
  merge: vi.fn().mockResolvedValue({}),
  mergePass: vi.fn().mockResolvedValue({}),
  mergeReject: vi.fn().mockResolvedValue({}),
  mergeable: vi.fn().mockResolvedValue([]),
  monthlyReport: vi.fn().mockResolvedValue({}),
  sendMonthly: vi.fn().mockResolvedValue({}),
  sendWeekly: vi.fn().mockResolvedValue({}),
  urgeCooldown: vi.fn().mockResolvedValue({}),
  weeklyReport: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/core/shared/utils', () => ({
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
    YdEmptyState: { name: 'YdEmptyState', render: () => h('div') },
    YdForm: { name: 'YdForm', render: () => h('form') },
    YdFormItem: { name: 'YdFormItem', render: () => h('div') },
    YdInput: { name: 'YdInput', render: () => h('input') },
    YdSpace: { name: 'YdSpace', render: () => h('div') },
    YdCountToAnimator: { name: 'YdCountToAnimator', render: () => h('div') },
    YdTable: { name: 'YdTable', render: () => h('div') },
    YdTabsContent: { name: 'YdTabsContent', render: () => h('div') },
    YdTabs: { name: 'YdTabs', render: () => h('div') },
    YdBadge: { name: 'YdBadge', render: () => h('span') },
    YdTableColumn: { name: 'YdTableColumn', render: () => h('div') },
    YdDescriptions: { name: 'YdDescriptions', render: () => h('div') },
    YdDescriptionsItem: { name: 'YdDescriptionsItem', render: () => h('div') },
  };
});

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@ydsz-core/popup-ui', () => ({
  YdConfirm: vi.fn().mockResolvedValue({}),
}));

// ── 被测组件 ──────────────────────────────────────────────

import AdvancedApprovalManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('AdvancedApprovalManagement', () => {
  function createWrapper() {
    return mount(AdvancedApprovalManagement, {
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
    expect(wrapper.vm.$options.name).toBe('AdvancedApprovalManagement');
  });

  it('应在 Page 容器内渲染', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-page').exists()).toBe(true);
  });

  it('应渲染 Tab 内容区域', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-page div').exists()).toBe(true);
  });
});
