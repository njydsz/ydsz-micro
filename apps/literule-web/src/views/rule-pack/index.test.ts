/**
 * 规则包管理页伴生测试
 *
 * @path apps/literule-web/src/views/rule-pack/index.test.ts
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

const { gridOptionsCalls } = vi.hoisted(() => ({
  gridOptionsCalls: [] as Array<{ gridOptions?: { columns?: Array<{ field?: string }> } }>,
}));

vi.mock('#/adapter/vxe-table', () => ({
  useYDSZVxeGrid: (options: { gridOptions?: { columns?: Array<{ field?: string }> } }) => {
    gridOptionsCalls.push(options);
    return [
      {
        name: 'MockGrid',
        setup:
          (_props: unknown, { slots }: MockSetupContext) =>
          () =>
            h('div', { class: 'mock-grid' }, [slots.default?.()]),
      },
      {
        query: vi.fn(),
        setGridOptions: vi.fn(),
        grid: { getTableData: () => ({ tableData: [] }) },
      },
    ];
  },
}));

vi.mock('#/api/rulePack', () => ({
  listPacks: vi.fn().mockResolvedValue([]),
  searchPacks: vi.fn().mockResolvedValue([]),
  installPack: vi.fn().mockResolvedValue({}),
  rollbackPack: vi.fn().mockResolvedValue({}),
  diffPack: vi.fn().mockResolvedValue({}),
  publishPack: vi.fn().mockResolvedValue({}),
  listPackVersions: vi.fn().mockResolvedValue([]),
  checkPackUpdates: vi.fn().mockResolvedValue([]),
  batchUpdatePacks: vi.fn().mockResolvedValue({}),
  stressTest: vi.fn().mockResolvedValue({}),
}));

vi.mock('#/api/rulePackExtend', () => ({
  scorePack: vi.fn().mockResolvedValue({}),
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
    YdCol: { name: 'YdCol', render: () => h('div') },
    YdCountToAnimator: { name: 'YdCountToAnimator', render: () => h('div') },
    YdDialog: { name: 'YdDialog', render: () => h('div') },
    YdForm: { name: 'YdForm', render: () => h('form') },
    YdFormItem: { name: 'YdFormItem', render: () => h('div') },
    YdInput: { name: 'YdInput', render: () => h('input') },
    YdNumberFieldInput: { name: 'YdNumberFieldInput', render: () => h('input') },
    YdRate: { name: 'YdRate', render: () => h('div') },
    YdRow: { name: 'YdRow', render: () => h('div') },
    YdTabs: { name: 'YdTabs', render: () => h('div') },
    YdTabsContent: { name: 'YdTabsContent', render: () => h('div') },
    YdTooltipSmart: { name: 'YdTooltipSmart', render: () => h('div') },
  };
});

vi.mock('@ydsz-core/popup-ui', () => ({
  YdAlert: vi.fn().mockResolvedValue({}),
  YdConfirm: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

// ── 被测组件 ──────────────────────────────────────────────

import RulePackManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('RulePackManagement', () => {
  function createWrapper() {
    return mount(RulePackManagement, {
      global: {
        stubs: {
          Teleport: { template: '<div><slot /></div>' },
        },
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    gridOptionsCalls.length = 0;
  });

  it('应成功渲染组件', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('defineOptions 应设置正确的组件名', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.$options.name).toBe('RulePackManagement');
  });

  it('应在 Page 容器内渲染', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-page').exists()).toBe(true);
  });

  it('应渲染多个 Grid（市场/已安装/可更新/版本历史）', () => {
    createWrapper();
    expect(gridOptionsCalls.length).toBeGreaterThanOrEqual(3);
  });

  it('市场 Grid 应包含 seq 列', () => {
    createWrapper();
    const columns = gridOptionsCalls[0]?.gridOptions?.columns ?? [];
    expect(columns.some((column) => column.field === 'packCode')).toBe(true);
  });
});
