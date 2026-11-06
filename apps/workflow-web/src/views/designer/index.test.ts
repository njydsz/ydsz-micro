/**
 * 流程设计器主页面伴生测试
 *
 * @path apps/workflow-web/src/views/designer/index.test.ts
 * @author ydsz-team
 * @since 26.11.06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mount } from '@vue/test-utils';
import { h } from 'vue';

// ── Mock 依赖 ──────────────────────────────────────────────

vi.mock('#/api/flowDesigner', () => ({
  getDesignerData: vi.fn().mockResolvedValue({}),
  saveDesignerData: vi.fn().mockResolvedValue({}),
  lockDefinition: vi.fn().mockResolvedValue(false),
  unlockDefinition: vi.fn().mockResolvedValue({}),
}));

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@ydsz-core/shared/utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}));

vi.mock('#/locales', () => ({
  $t: (key: string) => key,
}));

vi.mock('./components/DesignerCanvas.vue', () => ({
  default: { name: 'DesignerCanvas', render: () => h('div') },
}));

vi.mock('./components/DesignerPalette.vue', () => ({
  default: { name: 'DesignerPalette', render: () => h('div') },
}));

vi.mock('./components/DesignerPropertyPanel.vue', () => ({
  default: { name: 'DesignerPropertyPanel', render: () => h('div') },
}));

vi.mock('./components/DesignerToolbar.vue', () => ({
  default: { name: 'DesignerToolbar', render: () => h('div') },
}));

// ── 被测组件 ──────────────────────────────────────────────

import Designer from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('Designer', () => {
  function createWrapper() {
    return mount(Designer, {
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

  it('应渲染设计器容器', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.designer-container').exists()).toBe(true);
  });

  it('应渲染设计器主体区域', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.designer-body').exists()).toBe(true);
  });

  it('应渲染画布包装器', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.designer-canvas-wrapper').exists()).toBe(true);
  });
});
