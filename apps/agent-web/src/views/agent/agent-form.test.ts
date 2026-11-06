/**
 * Agent 定义表单组件伴生测试
 *
 * @path apps/agent-web/src/views/agent/agent-form.test.ts
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

vi.mock('#/api/agentDefinition', () => ({
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
}));

vi.mock('#/api/agentMetadata', () => ({
  tools: vi.fn().mockResolvedValue([]),
}));

vi.mock('@ydsz/common-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useYdModal: () => [
      {
        name: 'MockModal',
        setup:
          (_props: unknown, { slots }: MockSetupContext) =>
          () =>
            h('div', { class: 'mock-modal' }, slots.default?.()),
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

vi.mock('@ydsz/notification', () => ({
  showToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('@ydsz-core/ydsz-ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    YdForm: { name: 'YdForm', render: () => h('form') },
    YdFormItem: { name: 'YdFormItem', render: () => h('div') },
    YdInput: { name: 'YdInput', render: () => h('input') },
    YdNumberFieldInput: { name: 'YdNumberFieldInput', render: () => h('input') },
    YdSelect: { name: 'YdSelect', render: () => h('div') },
    YdSelectItem: { name: 'YdSelectItem', render: () => h('div') },
  };
});

// ── 被测组件 ──────────────────────────────────────────────

import AgentForm from './agent-form.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('AgentForm', () => {
  function createWrapper() {
    return mount(AgentForm, {
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

  it('应渲染表单', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-modal').exists()).toBe(true);
  });

  it('应包含 success 事件定义', () => {
    const wrapper = createWrapper();
    const emits = wrapper.vm.$options.emits;
    expect(emits).toBeDefined();
    expect(emits).toContain('success');
  });
});
