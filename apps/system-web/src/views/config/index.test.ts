/**
 * 系统配置管理页伴生测试
 *
 * @path apps/system-web/src/views/config/index.test.ts
 * @author ydsz-team
 * @since 26.11.06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mount } from '@vue/test-utils';
import { h, ref, type Slot } from 'vue';

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
        grid: { getTableData: () => ({ tableData: [] }) },
      },
    ];
  },
}));

vi.mock('#/api/config', () => ({
  page: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  remove: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/access', () => ({
  useAccess: () => ({
    hasAccessByCodesAll: vi.fn().mockReturnValue(true),
    getDataScope: vi.fn().mockReturnValue(undefined),
  }),
}));

vi.mock('@ydsz-core/composables', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTableColumnPreference: () => ({
      visibleColumns: ref<string[]>([]),
      columnOrder: ref([
        'configKey',
        'configValue',
        'configGroup',
        'valueType',
        'isPublic',
        'status',
        'description',
      ]),
      columnWidth: ref<Record<string, number>>({}),
      setColumnVisible: vi.fn(),
      setColumnWidth: vi.fn(),
      resetToDefault: vi.fn(),
    }),
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
    YdConfirm: vi.fn().mockResolvedValue({}),
    showToast: { success: vi.fn(), error: vi.fn() },
  };
});

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key }),
  };
});

vi.mock('@ydsz-core/shared/utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('@ydsz-core/ydsz-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    YdBadge: { name: 'YdBadge', render: () => h('span') },
    YdButton: { name: 'YdButton', render: () => h('button') },
  };
});

vi.mock('./config-form.vue', () => ({
  default: { name: 'ConfigForm', render: () => h('div') },
}));

vi.mock('./config-history-dialog.vue', () => ({
  default: { name: 'ConfigHistoryDialog', render: () => h('div') },
}));

// ── 被测组件 ──────────────────────────────────────────────

import ConfigManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('ConfigManagement', () => {
  function createWrapper() {
    return mount(ConfigManagement, {
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
    expect(wrapper.vm.$options.name).toBe('ConfigManagement');
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
});
