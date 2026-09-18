/**
 * useLocale composable 测试 —— 验证语种读取与文案回退。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\useLocale.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

import { mount } from '@vue/test-utils';
import { defineComponent, h, provide, ref } from 'vue';

import { enUS } from './en-US';
import { LOCALE_LANG_KEY, useLocale } from './useLocale';
import { zhCN } from './zh-CN';

describe('useLocale', () => {
  it('默认语种为 zh-CN', () => {
    const state = { isRTL: false, lang: 'zh-CN' as const };
    const Comp = defineComponent({
      setup() {
        provide(LOCALE_LANG_KEY, ref(state));
        const { t } = useLocale();
        return { t };
      },
      render() {
        return h('div', this.t('table.empty'));
      },
    });
    const wrapper = mount(Comp);
    expect(wrapper.text()).toBe(zhCN['table.empty']);
    wrapper.unmount();
  });

  it('注入的 zh-CN + 注入覆盖消息应叠加', () => {
    const langRef = ref({ isRTL: false, lang: 'zh-CN' as const });
    const Comp = defineComponent({
      setup() {
        provide(LOCALE_LANG_KEY, langRef);
        const { t } = useLocale({
          messages: {
            'zh-CN': { 'custom.key': '自定义值' },
          },
        });
        return { t };
      },
      render() {
        return h('div', `${this.t('custom.key')}|${this.t('common.confirm')}`);
      },
    });
    const wrapper = mount(Comp);
    expect(wrapper.text()).toBe('自定义值|确认');
    wrapper.unmount();
  });

  it('未包裹 ConfigProvider 应回退到 zh-CN', () => {
    const Comp = defineComponent({
      setup() {
        const { t } = useLocale();
        return { t };
      },
      render() {
        return h('span', this.t('common.confirm'));
      },
    });
    const wrapper = mount(Comp);
    expect(wrapper.text()).toBe('确认');
    wrapper.unmount();
  });

  it('未匹配的 key 应返回 key 本身', () => {
    const Comp = defineComponent({
      setup() {
        const { t } = useLocale();
        return { t };
      },
      render() {
        return h('span', this.t('nonexistent.key'));
      },
    });
    const wrapper = mount(Comp);
    expect(wrapper.text()).toBe('nonexistent.key');
    wrapper.unmount();
  });

  it('应支持 fallback 参数', () => {
    const Comp = defineComponent({
      setup() {
        const { t } = useLocale();
        return { t };
      },
      render() {
        return h('span', this.t('nonexistent.key', 'fallback text'));
      },
    });
    const wrapper = mount(Comp);
    expect(wrapper.text()).toBe('fallback text');
    wrapper.unmount();
  });

  it('注入的自定义消息应覆盖内置文案', () => {
    const Comp = defineComponent({
      setup() {
        provide(LOCALE_LANG_KEY, ref({ isRTL: false, lang: 'zh-CN' as const }));
        const { t } = useLocale({
          messages: {
            'zh-CN': { 'table.empty': '暂无数据（自定义）' },
          },
        });
        return { t };
      },
      render() {
        return h('span', this.t('table.empty'));
      },
    });
    const wrapper = mount(Comp);
    expect(wrapper.text()).toBe('暂无数据（自定义）');
    wrapper.unmount();
  });
});
