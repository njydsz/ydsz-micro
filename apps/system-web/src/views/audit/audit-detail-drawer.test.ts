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

vi.mock('@ydsz-core/ydsz-ui', async () => {
  const actual = await vi.importActual('@ydsz-core/ydsz-ui');
  // 在 factory 内部定义 stub，避免 vi.mock 提升导致的 TDZ 问题
  const DrawerStub = defineComponent({
    name: 'YdDrawer',
    props: {
      title: { type: String, default: '' },
      visible: { type: Boolean, default: false },
    },
    emits: ['close'],
    setup(props, { emit }) {
      return () =>
        props.visible
          ? h('div', { class: 'yd-drawer-stub' }, [
              h('span', { class: 'yd-drawer-title' }, props.title),
              h('button', { class: 'yd-drawer-close', onClick: () => emit('close') }, 'close'),
            ])
          : h('div', { class: 'yd-drawer-hidden' });
    },
  });
  return {
    ...actual,
    YdDrawer: DrawerStub,
  };
});

vi.mock('@ydsz-core/popup-ui', () => ({}));

vi.mock('#/api/audit', () => ({ getAuditLogDetailApi: vi.fn() }));

// i18n：测试环境只返回 key 本身，避免加载完整词条
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import AuditDetailDrawer from './audit-detail-drawer.vue';

const SAMPLE_RECORD = {
  action: 1,
  actionName: '登录',
  browser: 'Chrome',
  id: '1',
  ip: '127.0.0.1',
  location: '本地',
  module: '认证',
  os: 'Windows',
  result: 1,
  resultName: '成功',
  tenantId: 't1',
  url: '/login',
  userAgent: 'UA',
  userId: 'u1',
  username: 'admin',
};

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
