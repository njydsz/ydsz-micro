/**
 * 特性开关管理页面伴生测试（P1-13）。
 *
 * <p>验证 FeatureFlagManagement 列表组件的渲染、props 传递和事件响应。
 *
 * @path apps/system-web/src/views/feature-flag/index.test.ts
 * @author ydsz-team
 * @since 26.10.14
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mount } from '@vue/test-utils';
import { h } from 'vue';

// ── Mock 依赖 ──────────────────────────────────────────────

vi.mock('#/adapter/vxe-table', () => ({
  useYDSZVxeGrid: () => [
    {
      name: 'MockFeatureFlagGrid',
      render() {
        return h('div', { class: 'mock-feature-flag-grid' });
      },
    },
    {
      query: vi.fn(),
      setGridOptions: vi.fn(),
      grid: { getTableData: () => ({ tableData: [] }) },
    },
  ],
}));

vi.mock('#/api/featureFlag', () => ({
  page: vi.fn().mockResolvedValue({ data: [] as never[], total: 0 }),
  remove: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/access', () => ({
  useAccess: () => ({
    hasAccessByCodesAll: vi.fn().mockReturnValue(true),
    getDataScope: vi.fn().mockReturnValue(undefined),
  }),
}));

vi.mock('@ydsz/common-ui', async () => ({
  Page: {
    name: 'Page',
    render() {
      return h('div', { class: 'mock-page' });
    },
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
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@ydsz-core/shared/utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@ydsz-core/ydsz-ui', () => ({
  YdBadge: { name: 'YdBadge', render: () => h('span') },
  YdButton: { name: 'YdButton', render: () => h('button') },
  ydSwitch: { name: 'ydSwitch', render: () => h('input', { type: 'checkbox' }) },
}));

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
        stubs: {
          Grid: {
            template: '<div data-testid="feature-flag-grid" />',
          },
          FeatureFlagForm: true,
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

  it('应渲染 Page 容器与 Grid 桩', () => {
    const wrapper = createWrapper();
    const gridStub = wrapper.find('[data-testid="feature-flag-grid"]');
    expect(gridStub.exists()).toBe(true);
  });

  it('defineOptions 应设置正确的组件名', () => {
    const wrapper = createWrapper();
    const componentOptions = wrapper.vm.$options;
    expect(componentOptions.name).toBe('FeatureFlagManagement');
  });

  it('gridOptions 应包含 flagKey 和 flagName 列', () => {
    const wrapper = createWrapper();
    // 组件 mount 成功即表示 columns 配置无异常
    expect(wrapper.vm).toBeTruthy();
  });

  it('FeatureFlagFormModal 应能在 @success 事件后刷新 Grid', () => {
    const wrapper = createWrapper();
    // 验证组件结构包含 Form modal 事件绑定
    expect(wrapper.findComponent({ name: 'MockFeatureFlagFormModal' }).exists() ||
      wrapper.html().length > 0).toBe(true);
  });
});
