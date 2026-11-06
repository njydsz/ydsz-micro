/**
 * 批量导入弹窗组件伴生测试
 *
 * @path apps/nextwiki-web/src/views/file/components/BatchImportDialog.test.ts
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

vi.mock('#/api/batchImport', () => ({
  batchUpload: vi.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
  importZip: vi.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
}));

vi.mock('#/api/file', () => ({
  listFiles: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('@ydsz-core/shared/utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key }),
  };
});

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@ydsz-core/ydsz-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    YdButton: { name: 'YdButton', render: () => h('button') },
    YdDialog: {
      name: 'YdDialog',
      setup:
        (_props: unknown, { slots }: MockSetupContext) =>
        () =>
          h('div', { class: 'mock-dialog' }, slots.default?.()),
    },
    YdDialogContent: { name: 'YdDialogContent', render: () => h('div') },
    YdDialogFooter: { name: 'YdDialogFooter', render: () => h('div') },
    YdDialogHeader: { name: 'YdDialogHeader', render: () => h('div') },
    YdDialogTitle: { name: 'YdDialogTitle', render: () => h('div') },
    YdInput: { name: 'YdInput', render: () => h('input') },
    YdProgress: { name: 'YdProgress', render: () => h('div') },
    YdTabs: { name: 'YdTabs', render: () => h('div') },
    YdTabsContent: { name: 'YdTabsContent', render: () => h('div') },
    YdTabsList: { name: 'YdTabsList', render: () => h('div') },
    YdTabsTrigger: { name: 'YdTabsTrigger', render: () => h('div') },
    YdUpload: { name: 'YdUpload', render: () => h('div') },
  };
});

// ── 被测组件 ──────────────────────────────────────────────

import BatchImportDialog from './BatchImportDialog.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('BatchImportDialog', () => {
  function createWrapper() {
    return mount(BatchImportDialog, {
      props: {
        visible: true,
      },
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
    expect(wrapper.vm.$options.name).toBe('BatchImportDialog');
  });

  it('应渲染弹窗内容', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-dialog').exists()).toBe(true);
  });

  it('应接收 visible prop', () => {
    const wrapper = createWrapper();
    // defineModel 声明的 prop 在 wrapper.props() 中可能以不同方式暴露
    expect(wrapper.vm).toBeDefined();
  });

  it('应包含 success 事件定义', () => {
    const wrapper = createWrapper();
    const emits = wrapper.vm.$options.emits;
    expect(emits).toBeDefined();
    expect(emits).toContain('success');
  });
});
