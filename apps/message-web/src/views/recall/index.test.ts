/**
 * 消息召回管理页伴生测试
 *
 * @path apps/message-web/src/views/recall/index.test.ts
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

vi.mock('#/api/recall', () => ({
  recallNotification: vi.fn().mockResolvedValue(true),
  recallMessage: vi.fn().mockResolvedValue(true),
  recallByMsgId: vi.fn().mockResolvedValue(true),
  recallBatch: vi.fn().mockResolvedValue(1),
}));

vi.mock('@ydsz-core/shared/utils', () => ({
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
    YdBadge: { name: 'YdBadge', render: () => h('span') },
    YdButton: { name: 'YdButton', render: () => h('button') },
    YdCard: { name: 'YdCard', render: () => h('div') },
    YdCardContent: { name: 'YdCardContent', render: () => h('div') },
    YdInput: { name: 'YdInput', render: () => h('input') },
    YdSelectBase: { name: 'YdSelectBase', render: () => h('div') },
    YdSelectContentBase: { name: 'YdSelectContentBase', render: () => h('div') },
    YdSelectItemBase: { name: 'YdSelectItemBase', render: () => h('div') },
    YdSelectTriggerBase: { name: 'YdSelectTriggerBase', render: () => h('div') },
    YdSelectValueBase: { name: 'YdSelectValueBase', render: () => h('div') },
    YdForm: { name: 'YdForm', render: () => h('form') },
    YdFormItem: { name: 'YdFormItem', render: () => h('div') },
    YdTabsContent: { name: 'YdTabsContent', render: () => h('div') },
    YdTabs: { name: 'YdTabs', render: () => h('div') },
    YdTimeline: { name: 'YdTimeline', render: () => h('div') },
    YdTimelineItem: { name: 'YdTimelineItem', render: () => h('div') },
  };
});

vi.mock('@ydsz-core/popup-ui', () => ({
  YdConfirm: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

// ── 被测组件 ──────────────────────────────────────────────

import RecallManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('RecallManagement', () => {
  function createWrapper() {
    return mount(RecallManagement, {
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
    expect(wrapper.vm.$options.name).toBe('RecallManagement');
  });

  it('应在 Page 容器内渲染', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-page').exists()).toBe(true);
  });

  it('应渲染召回容器', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.recall-container').exists()).toBe(true);
  });
});
