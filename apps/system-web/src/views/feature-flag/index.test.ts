/**
 * 特性开关管理页面伴生测试（P1-13）。
 *
 * <p>验证 FeatureFlagManagement 的挂载、Page/Grid 组合渲染与列配置契约。
 * 所有第三方包一律用局部 mock（importOriginal 展开），保留其余导出，
 * 避免整包替换让间接依赖（popup-ui、comm/locales 等）取不到 createContext / useSimpleLocale。
 *
 * @path apps/system-web/src/views/feature-flag/index.test.ts
 * @author ydsz-team
 * @since 26.10.14
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mount } from '@vue/test-utils';
import { h, nextTick, type Slot } from 'vue';

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
const { gridOptionsCalls, gridApiStub } = vi.hoisted(() => ({
  gridOptionsCalls: [] as GridCall[],
  gridApiStub: { query: vi.fn(), setGridOptions: vi.fn(), grid: { getTableData: () => ({ tableData: [] }) } },
}));

vi.mock('#/adapter/vxe-table', () => ({
  useYDSZVxeGrid: (options: GridCall) => {
    gridOptionsCalls.push(options);
    return [
      {
        name: 'MockFeatureFlagGrid',
        setup: (_props: unknown, { slots }: MockSetupContext) =>
          () => h('div', { class: 'mock-feature-flag-grid' }, [slots.default?.(), slots['toolbar-tools']?.()]),
      },
      gridApiStub,
    ];
  },
}));

vi.mock('#/api/featureFlag', () => ({
  page: vi.fn().mockResolvedValue({ data: [] as never[], total: 0 }),
  remove: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/access', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useAccess: () => ({
      hasAccessByCodesAll: vi.fn().mockReturnValue(true),
      getDataScope: vi.fn().mockReturnValue(undefined),
    }),
  };
});

vi.mock('@ydsz/common-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // Page 桩必须透传默认插槽，否则挂在其中的 Grid 永远渲染不到
    Page: {
      name: 'Page',
      setup: (_props: unknown, { slots }: MockSetupContext) =>
        () => h('div', { class: 'mock-page' }, slots.default?.()),
    },
    useYdModal: () => [
      {
        name: 'MockFeatureFlagFormModal',
        render() {
          return h('div', { class: 'mock-form-modal' });
        },
      },
      {
        open: vi.fn(),
        setData: vi.fn(),
      },
    ],
  };
});

// 局部 mock：t() 回显 key（等价于 vue-i18n 缺词条时的行为），断言因此面向 key 而非中文文案
vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key }),
  };
});

vi.mock('@ydsz-core/shared/utils', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    createLogger: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  };
});

vi.mock('@ydsz-core/ydsz-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    YdBadge: { name: 'YdBadge', render: () => h('span') },
    YdButton: { name: 'YdButton', render: () => h('button') },
  };
});

vi.mock('./feature-flag-form.vue', () => ({
  default: { name: 'FeatureFlagForm', render: () => h('div') },
}));

// ── 被测组件 ─────────────────────────────────────────────

import FeatureFlagManagement from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('FeatureFlagManagement', () => {
  function createWrapper() {
    return mount(FeatureFlagManagement, {
      global: {
        // 页面用例绕过 createSubApp 启动流程，需自行补齐 bootstrap 阶段注册的全局指令；
        // 权限隐藏逻辑本身由 @ydsz/access 的用例覆盖，这里只需指令可解析
        directives: { permission: {} },
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
    // <script setup> 里 Grid 是 useYDSZVxeGrid 返回的局部绑定，global.stubs 按名字匹配不到，
    // 因此断言 adapter 桩真正渲染出的节点
    expect(page.find('.mock-feature-flag-grid').exists()).toBe(true);
    expect(page.find('button').exists()).toBe(true);
  });

  it('defineOptions 应设置正确的组件名', () => {
    const wrapper = createWrapper();
    const componentOptions = wrapper.vm.$options;
    expect(componentOptions.name).toBe('FeatureFlagManagement');
  });

  it('gridOptions 应包含 flagKey、flagName 与 seq 列', () => {
    createWrapper();
    const columns = gridOptionsCalls[0]?.gridOptions?.columns ?? [];
    expect(columns.map((column) => column.field ?? column.type)).toEqual(
      expect.arrayContaining(['seq', 'flagKey', 'flagName']),
    );
  });

  it('操作列应固定在右侧', () => {
    createWrapper();
    const columns = gridOptionsCalls[0]?.gridOptions?.columns ?? [];
    const actionColumn = columns.find((column) => column.field === 'action');
    expect(actionColumn?.fixed).toBe('right');
  });

  it('Form 弹窗成功后应刷新列表', async () => {
    const wrapper = createWrapper();
    const modal = wrapper.findComponent({ name: 'MockFeatureFlagFormModal' });
    expect(modal.exists()).toBe(true);
    modal.vm.$emit('success');
    await nextTick();
    expect(gridApiStub.query).toHaveBeenCalledTimes(1);
  });
});
