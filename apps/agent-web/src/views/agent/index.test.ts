/**
 * Agent 定义管理页伴生测试
 *
 * @path apps/agent-web/src/views/agent/index.test.ts
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

vi.mock('#/api/agentDefinition', () => ({
  listPage: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  deleteApi: vi.fn().mockResolvedValue({}),
  exportAgentDefinitions: vi.fn().mockResolvedValue(new Blob()),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
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
    useYdModal: () => [
      {
        name: 'MockModal',
        render() {
          return h('div', { class: 'mock-modal' });
        },
      },
      {
        open: vi.fn(),
        setData: vi.fn(),
        close: vi.fn(),
        lock: vi.fn(),
        unlock: vi.fn(),
        getData: vi.fn(),
      },
    ],
  };
});

vi.mock('@ydsz-core/ydsz-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    YdCardGrid: { name: 'YdCardGrid', render: () => h('div') },
    YdEmptyState: { name: 'YdEmptyState', render: () => h('div') },
    YdEntityCard: { name: 'YdEntityCard', render: () => h('div') },
    YdDropdownMenu: { name: 'YdDropdownMenu', render: () => h('div') },
    YdDropdownMenuItem: { name: 'YdDropdownMenuItem', render: () => h('div') },
    YdButton: { name: 'YdButton', render: () => h('button') },
  };
});

vi.mock('@ydsz-core/popup-ui', () => ({
  YdConfirm: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key }),
  };
});

vi.mock('./agent-form.vue', () => ({
  default: { name: 'AgentForm', render: () => h('div') },
}));

// ── 被测组件 ──────────────────────────────────────────────

import AgentManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('AgentManagement', () => {
  function createWrapper() {
    return mount(AgentManagement, {
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
    expect(wrapper.vm.$options.name).toBe('AgentManagement');
  });

  it('应在 Page 容器内渲染', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-page').exists()).toBe(true);
  });

  it('应渲染视图切换按钮', () => {
    const wrapper = createWrapper();
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('应渲染卡片视图容器', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.min-h-\\[400px\\]').exists()).toBe(true);
  });
});
