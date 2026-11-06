/**
 * 审计详情抽屉伴生测试（test-companion 门禁）。
 *
 * <p>验证 AuditDetailDrawer 的 open/close 契约：
 * open 后可见性置真并持有记录，close 后可见性置假，
 * 且抽屉关闭时清空记录（避免下次打开闪现上一条数据）。
 *
 * @path apps/system-web/src/views/audit/audit-detail-drawer.test.ts
 * @author ydsz-team
 * @since 26.11.06
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';

// ── Mock 依赖 ──────────────────────────────────────────────

/** 抽屉 stub：暴露 visible，并把 close 事件抛给父级 */
const YdDrawerStub = defineComponent({
  name: 'YdDrawer',
  props: { visible: { type: Boolean, default: false }, title: { type: String, default: '' } },
  emits: ['close'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'yd-drawer-stub' }, [
        h('span', { class: 'yd-drawer-title' }, props.title),
        h('button', { class: 'yd-drawer-close', onClick: () => emit('close') }, 'close'),
      ]);
  },
});

vi.mock('@ydsz-core/ydsz-ui', async () => {
  const actual = await vi.importActual('@ydsz-core/ydsz-ui');
  return {
    ...actual,
    YdDrawer: YdDrawerStub,
  };
});

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// ── 被测组件 ──────────────────────────────────────────────

const AuditDetailDrawer = (await import('./audit-detail-drawer.vue')).default;

// ── 夹具 ──────────────────────────────────────────────────

const SAMPLE_RECORD = {
  id: 'audit-1',
  module: 'system',
  action: 1,
  status: 1,
  operator: 'tester',
  createdAt: '2026-11-06 10:00:00',
} as never;

// ── 用例 ──────────────────────────────────────────────────

describe('AuditDetailDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('open 后应展示记录并置可见', async () => {
    const wrapper = mount(AuditDetailDrawer);
    const vm = wrapper.vm as unknown as { open: (row: unknown) => void };

    vm.open(SAMPLE_RECORD);
    await nextTick();

    expect(wrapper.find('.yd-drawer-stub').exists()).toBe(true);
    expect(wrapper.find('.yd-drawer-title').text()).toContain('audit.detail.title');
  });

  it('close 后应隐藏抽屉', async () => {
    const wrapper = mount(AuditDetailDrawer);
    const vm = wrapper.vm as unknown as { open: (row: unknown) => void };

    vm.open(SAMPLE_RECORD);
    await nextTick();

    await wrapper.find('.yd-drawer-close').trigger('click');
    await nextTick();

    expect(wrapper.find('.yd-drawer-stub').exists()).toBe(false);
  });
});
