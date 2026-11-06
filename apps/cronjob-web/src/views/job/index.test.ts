/**
 * 定时任务列表页伴生测试
 *
 * @path apps/cronjob-web/src/views/job/index.test.ts
 * @author ydsz-team
 * @since 26.11.06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mount } from '@vue/test-utils';
import { h, type Slot } from 'vue';

// ── Mock 依赖 ──────────────────────────────────────────────

interface GridCall {
  gridOptions?: { columns?: Array<{ field?: string; fixed?: string; type?: string }> };
}

interface MockSetupContext {
  slots: Record<string, Slot | undefined>;
}

const { gridOptionsCalls } = vi.hoisted(() => ({ gridOptionsCalls: [] as GridCall[] }));

vi.mock('#/adapter/vxe-table', () => ({
  useYDSZVxeGrid: (options: GridCall) => {
    gridOptionsCalls.push(options);
    return [
      {
        name: 'MockGrid',
        setup:
          (_props: unknown, { slots }: MockSetupContext) =>
          () =>
            h('div', { class: 'mock-grid' }, [slots.default?.(), slots['toolbar-tools']?.()]),
      },
      {
        query: vi.fn(),
        setGridOptions: vi.fn(),
        grid: {
          getTableData: () => ({ tableData: [] }),
          getCheckboxRecords: () => [],
          getData: () => [],
          updateData: vi.fn(),
        },
      },
    ];
  },
}));

vi.mock('#/api/job', () => ({
  page: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  remove: vi.fn().mockResolvedValue({}),
  batchDelete: vi.fn().mockResolvedValue({}),
  batchPause: vi.fn().mockResolvedValue({}),
  batchResume: vi.fn().mockResolvedValue({}),
  pause: vi.fn().mockResolvedValue({}),
  resume: vi.fn().mockResolvedValue({}),
  trigger: vi.fn().mockResolvedValue({}),
  deleteApi: vi.fn().mockResolvedValue({}),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
}));

vi.mock('#/api/eventStore', () => ({
  getJobEventStream: vi.fn().mockResolvedValue([]),
}));

vi.mock('#/composables/use-job-status-sse', () => ({
  useJobStatusSse: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
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

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
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

vi.mock('@ydsz-core/popup-ui', () => ({
  YdConfirm: vi.fn().mockResolvedValue({}),
  YdAlert: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@ydsz-core/ydsz-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    YdBadge: { name: 'YdBadge', render: () => h('span') },
    YdButton: { name: 'YdButton', render: () => h('button') },
    YdSheet: { name: 'YdSheet', render: () => h('div') },
    YdSheetContent: { name: 'YdSheetContent', render: () => h('div') },
    YdSheetHeader: { name: 'YdSheetHeader', render: () => h('div') },
    YdSheetTitle: { name: 'YdSheetTitle', render: () => h('div') },
  };
});

vi.mock('./job-form.vue', () => ({
  default: { name: 'JobForm', render: () => h('div') },
}));

vi.mock('./components/WebhookConfigPanel.vue', () => ({
  default: { name: 'WebhookConfigPanel', render: () => h('div') },
}));

// ── 被测组件 ──────────────────────────────────────────────

import JobManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('JobManagement', () => {
  function createWrapper() {
    return mount(JobManagement, {
      global: {
        directives: { permission: {} },
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
    expect(wrapper.vm.$options.name).toBe('JobManagement');
  });

  it('应在 Page 容器内渲染 Grid 与工具栏', () => {
    const wrapper = createWrapper();
    const page = wrapper.find('.mock-page');
    expect(page.exists()).toBe(true);
    expect(page.find('.mock-grid').exists()).toBe(true);
    expect(page.find('button').exists()).toBe(true);
  });

  it('gridOptions 应包含 seq 列（排序列）', () => {
    createWrapper();
    const columns = gridOptionsCalls[0]?.gridOptions?.columns ?? [];
    expect(columns.some((column) => column.type === 'seq')).toBe(true);
  });

  it('操作列应固定在右侧', () => {
    createWrapper();
    const columns = gridOptionsCalls[0]?.gridOptions?.columns ?? [];
    const actionColumn = columns.find((column) => column.field === 'action');
    expect(actionColumn?.fixed).toBe('right');
  });

  it('应包含 checkbox 列用于批量操作', () => {
    createWrapper();
    const columns = gridOptionsCalls[0]?.gridOptions?.columns ?? [];
    expect(columns.some((column) => column.type === 'checkbox')).toBe(true);
  });
});
