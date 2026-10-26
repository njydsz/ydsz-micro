/**
 * 系统配置管理页面伴生测试（P1-13）。
 *
 * <p>验证 ConfigManagement 列表组件的渲染、关键逻辑和事件响应。
 *
 * @path apps/system-web/src/views/config/index.test.ts
 * @author ydsz-team
 * @since 26.10.14
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mount } from '@vue/test-utils';
import { h, ref, type Slot } from 'vue';

// ── Mock 依赖 ──────────────────────────────────────────────

/** `useYDSZVxeGrid` 收到的入参（只取断言用到的字段） */
interface GridCall {
  gridOptions?: { columns?: Array<{ field?: string; fixed?: string; type?: string }> };
}

/** 组件桩 setup 的第二参：只需透传插槽 */
interface MockSetupContext {
  slots: Record<string, Slot | undefined>;
}

// hoisted：mock 工厂在 import 之前求值，跨作用域变量必须经 vi.hoisted 暴露
const { gridOptionsCalls } = vi.hoisted(() => ({ gridOptionsCalls: [] as GridCall[] }));

vi.mock('#/adapter/vxe-table', () => ({
  useYDSZVxeGrid: (options: GridCall) => {
    gridOptionsCalls.push(options);
    return [
      {
        name: 'MockGrid',
        setup: (_props: unknown, { slots }: MockSetupContext) =>
          () => h('div', { class: 'mock-grid' }, [slots.default?.(), slots['toolbar-tools']?.()]),
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

// 局部 mock：@ydsz-core/composables 还被 comm/locales 等间接依赖使用（useSimpleLocale），
// 整包替换会让它们在 collect 阶段拿不到导出。
vi.mock('@ydsz-core/composables', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // 真实实现返回 Ref，桩必须保持同一形状，否则组件里 columnWidth.value.xxx 直接崩
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

// 局部 mock：保留包内其他导出，只替换需要真实渲染的容器；
// Page 桩必须透传默认插槽，否则挂在其中的 Grid 永远渲染不到。
vi.mock('@ydsz/common-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Page: {
      name: 'Page',
      setup: (_props: unknown, { slots }: MockSetupContext) =>
        () => h('div', { class: 'mock-page' }, slots.default?.()),
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
      },
    ],
    YdConfirm: vi.fn().mockResolvedValue({}),
    showToast: { success: vi.fn(), error: vi.fn() },
  };
});

// 局部 mock：t() 回显 key（等价于 vue-i18n 缺词条时的行为），
// 因此断言面向 key 而非中文文案；createI18n 等导出必须保留给间接依赖。
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
  }),
}));

// 局部 mock：只替换渲染开销大的 Yd* 组件，保留包内其他导出。
// 整包 mock 会让 popup-ui 等间接依赖拿不到 createContext 而在 collect 阶段抛错。
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

// ── 被测组件（mock 定义后再 import） ─────────────────────

import ConfigManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('ConfigManagement', () => {
  function createWrapper() {
    return mount(ConfigManagement, {
      global: {
        // 页面用例绕过 createSubApp 启动流程，需自行补齐 bootstrap 阶段注册的全局指令；
        // 权限隐藏逻辑本身由 @ydsz/access 的用例覆盖，这里只需指令可解析
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

  it('应在 Page 容器内渲染 Grid 与工具栏', () => {
    const wrapper = createWrapper();
    const page = wrapper.find('.mock-page');
    expect(page.exists()).toBe(true);
    // Page / Grid 桩都透传插槽，缺任一层插槽渲染都会在此暴露
    expect(page.find('.mock-grid').exists()).toBe(true);
    expect(page.find('button').exists()).toBe(true);
  });

  it('defineOptions 应设置正确的组件名', () => {
    // 通过 mount 验证组件实例的 type.name
    const wrapper = createWrapper();
    const componentOptions = wrapper.vm.$options;
    expect(componentOptions.name).toBe('ConfigManagement');
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
