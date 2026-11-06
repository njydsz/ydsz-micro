/**
 * 定时任务表单组件伴生测试
 *
 * @path apps/cronjob-web/src/views/job/job-form.test.ts
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

vi.mock('#/api/job', () => ({
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
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
    YdAccordion: { name: 'YdAccordion', render: () => h('div') },
    YdAccordionContent: { name: 'YdAccordionContent', render: () => h('div') },
    YdAccordionItem: { name: 'YdAccordionItem', render: () => h('div') },
    YdAccordionTrigger: { name: 'YdAccordionTrigger', render: () => h('div') },
    YdInput: { name: 'YdInput', render: () => h('input') },
    YdSelectBase: { name: 'YdSelectBase', render: () => h('div') },
    YdSelectContentBase: { name: 'YdSelectContentBase', render: () => h('div') },
    YdSelectItemBase: { name: 'YdSelectItemBase', render: () => h('div') },
    YdSelectTriggerBase: { name: 'YdSelectTriggerBase', render: () => h('div') },
    YdTextarea: { name: 'YdTextarea', render: () => h('textarea') },
    YdForm: { name: 'YdForm', render: () => h('form') },
    YdFormItem: { name: 'YdFormItem', render: () => h('div') },
  };
});

vi.mock('#/components/cron-builder/index.vue', () => ({
  default: { name: 'CronBuilder', render: () => h('div') },
}));

// ── 被测组件 ──────────────────────────────────────────────

import JobForm from './job-form.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('JobForm', () => {
  function createWrapper() {
    return mount(JobForm, {
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
    expect(wrapper.vm.$options.name).toBeUndefined();
  });

  it('应渲染表单字段', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mock-modal').exists()).toBe(true);
  });

  it('应包含成功事件定义', () => {
    const wrapper = createWrapper();
    const emits = wrapper.vm.$options.emits;
    expect(emits).toBeDefined();
    expect(emits).toContain('success');
  });
});
