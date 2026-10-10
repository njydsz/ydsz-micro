/**
 * ConfigProvider（config-provider）组件单元测试。
 *
 * <p>覆盖核心路径：
 * <ul>
 *   <li>theme 切换后 document.documentElement.dataset.theme 更新</li>
 *   <li>locale 切换后 document.documentElement.lang 更新</li>
 *   <li>density 切换后 data-density 属性更新</li>
 *   <li>子组件 inject 验证（LOCALE_LANG_KEY 注入）</li>
 * </ul>
 *
 * <p>mock 策略：useDensity / useTheme 修改了 localStorage / document.documentElement，
 * 此处通过 vi.mock 替换为可控实现，避免污染真实 DOM 与单例泄漏。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\config-provider.test.ts
 * @author ydsz-team
 * @since 26.09.24
 */
import { describe, expect, it, vi } from 'vitest';

import { mount } from '@vue/test-utils';
import { defineComponent, h, inject, nextTick, ref } from 'vue';

import ConfigProvider from './config-provider.vue';
import { LOCALE_LANG_KEY } from '../../locale/useLocale';
import type { ConfigProviderProps } from './config-provider-types';

// ===== mock useDensity =====
const setDensityMock = vi.fn();

vi.mock('@ydsz-core/design-tokens/composables', () => ({
  useDensity: () => ({
    setDensity: setDensityMock,
    density: ref('standard'),
    isCompact: ref(false),
  }),
}));

// ===== mock useTheme（避免单例泄漏）=====
const themeRef = ref<'light' | 'dark' | 'auto'>('auto');
const setThemeMock = vi.fn();

vi.mock('../../composables/use-theme', () => ({
  useTheme: () => ({
    theme: themeRef,
    setTheme: setThemeMock,
    toggleTheme: vi.fn(),
    isDark: ref(false),
  }),
}));

/**
 * 创建 ConfigProvider 包裹器。
 *
 * @param props - props 覆盖
 * @param slots - 插槽内容
 * @returns mount 包裹器
 */
function createConfigProvider(
  props: ConfigProviderProps = {},
  slots?: { default?: unknown },
) {
  return mount(ConfigProvider, {
    props,
    slots: slots as { default?: string } | undefined,
  });
}

describe('ConfigProvider', () => {
  describe('theme 切换', () => {
    it('期望 theme=dark 时应调用 setTheme 并触发 theme-change 事件', async () => {
      setThemeMock.mockClear();
      const wrapper = createConfigProvider({ theme: 'dark' });
      await nextTick();
      expect(setThemeMock).toHaveBeenCalledWith('dark');
      expect(wrapper.emitted('theme-change')).toBeTruthy();
      expect(wrapper.emitted('theme-change')?.[0]).toEqual(['dark']);
      wrapper.unmount();
    });

    it('期望 theme=light 时应调用 setTheme 并触发 theme-change 事件', async () => {
      setThemeMock.mockClear();
      const wrapper = createConfigProvider({ theme: 'light' });
      await nextTick();
      expect(setThemeMock).toHaveBeenCalledWith('light');
      expect(wrapper.emitted('theme-change')).toBeTruthy();
      expect(wrapper.emitted('theme-change')?.[0]).toEqual(['light']);
      wrapper.unmount();
    });

    it('期望切换 theme prop 应触发 theme-change 事件且携带新值', async () => {
      setThemeMock.mockClear();
      themeRef.value = 'light';
      const wrapper = createConfigProvider({ theme: 'light' });
      await wrapper.setProps({ theme: 'dark' });
      await nextTick();
      expect(wrapper.emitted('theme-change')).toBeTruthy();
      expect(wrapper.emitted('theme-change')?.slice(-1)[0]).toEqual(['dark']);
      wrapper.unmount();
    });
  });

  describe('locale 切换', () => {
    it('期望 locale=en-US 时 document.documentElement.lang 应为 en-US', async () => {
      const wrapper = createConfigProvider({ locale: 'en-US' });
      await nextTick();
      expect(document.documentElement.lang).toBe('en-US');
      wrapper.unmount();
    });

    it('期望默认 locale 应为 zh-CN', async () => {
      const wrapper = createConfigProvider({});
      await nextTick();
      expect(document.documentElement.lang).toBe('zh-CN');
      wrapper.unmount();
    });

    it('期望 data-locale 属性应反映当前 locale', async () => {
      const wrapper = createConfigProvider({ locale: 'ja-JP' });
      await nextTick();
      expect(wrapper.attributes('data-locale')).toBe('ja-JP');
      wrapper.unmount();
    });

    it('期望切换 locale 应触发 locale-change 事件', async () => {
      const wrapper = createConfigProvider({ locale: 'zh-CN' });
      await wrapper.setProps({ locale: 'en-US' });
      await nextTick();
      expect(wrapper.emitted('locale-change')).toBeTruthy();
      expect(wrapper.emitted('locale-change')?.slice(-1)[0]).toEqual(['en-US']);
      wrapper.unmount();
    });
  });

  describe('density 切换', () => {
    it('期望 density=compact 时 data-density 属性应为 compact', async () => {
      setDensityMock.mockClear();
      const wrapper = createConfigProvider({ density: 'compact' });
      await nextTick();
      expect(wrapper.attributes('data-density')).toBe('compact');
      expect(setDensityMock).toHaveBeenCalledWith('compact');
      wrapper.unmount();
    });

    it('期望默认 density 应为 standard', async () => {
      setDensityMock.mockClear();
      const wrapper = createConfigProvider({});
      await nextTick();
      expect(wrapper.attributes('data-density')).toBe('standard');
      wrapper.unmount();
    });

    it('期望切换 density 应触发 density-change 事件', async () => {
      setDensityMock.mockClear();
      const wrapper = createConfigProvider({ density: 'standard' });
      await wrapper.setProps({ density: 'loose' });
      await nextTick();
      expect(wrapper.emitted('density-change')).toBeTruthy();
      expect(wrapper.emitted('density-change')?.slice(-1)[0]).toEqual(['loose']);
      wrapper.unmount();
    });
  });

  describe('子组件 inject 验证', () => {
    it('期望子组件通过 inject(LOCALE_LANG_KEY) 应能读取注入的语种状态并渲染', async () => {
      // 使用运行时模板字符串在 ConfigProvider 内部解析 Child，
      // 使 Child 的 inject 沿渲染链向上找到 ConfigProvider 的 provide
      const childRender = vi.fn();

      const Child = defineComponent({
        setup() {
          const state = inject(LOCALE_LANG_KEY);
          childRender(state?.value);
          return { state };
        },
        render() {
          return h('span', this.state?.value?.lang ?? '');
        },
      });

      // 通过 render 函数直接嵌套，确保 Child 处于 ConfigProvider 的 provide 链中
      const Wrapper = defineComponent({
        props: { locale: { type: String, default: 'en-US' } },
        render() {
          return h(ConfigProvider, { locale: this.locale }, {
            default: () => h(Child),
          });
        },
      });

      const wrapper = mount(Wrapper, {
        props: { locale: 'en-US' },
      });
      await nextTick();
      // childRender 应被调用且参数为 { lang: 'en-US', isRTL: false }
      expect(childRender).toHaveBeenCalled();
      const injectedState = childRender.mock.calls[0]?.[0];
      expect(injectedState?.lang).toBe('en-US');
      wrapper.unmount();
    });

    it('期望 locale 切换后注入状态应同步更新', async () => {
      // 使用捕获 ref 以追踪最新值：setup 中 inject 的 state 是 ref，
      // 后续 prop 变化直接反应在该 ref 的 value 上（无需重推数组）
      let capturedRef: { value?: { lang?: string } } | undefined;

      const Child = defineComponent({
        setup() {
          const state = inject(LOCALE_LANG_KEY);
          capturedRef = state as { value?: { lang?: string } } | undefined;
          return { state };
        },
        render() {
          return h('span', this.state?.value?.lang ?? '');
        },
      });

      const Wrapper = defineComponent({
        props: { locale: { type: String, default: 'zh-CN' } },
        render() {
          return h(ConfigProvider, { locale: this.locale }, {
            default: () => h(Child),
          });
        },
      });

      const wrapper = mount(Wrapper, {
        props: { locale: 'zh-CN' },
      });
      await nextTick();
      expect(capturedRef?.value?.lang).toBe('zh-CN');

      await wrapper.setProps({ locale: 'ja-JP' });
      await nextTick();
      expect(capturedRef?.value?.lang).toBe('ja-JP');
      wrapper.unmount();
    });
  });

  describe('边界路径', () => {
    it('期望未传 props 时组件应正常渲染且基础类名 yd-config-provider 存在', () => {
      const wrapper = createConfigProvider({});
      expect(wrapper.classes()).toContain('yd-config-provider');
      wrapper.unmount();
    });

    it('期望 disabled 为 true 时应附加 yd-config-provider--disabled 类名', () => {
      const wrapper = createConfigProvider({ disabled: true });
      expect(wrapper.classes()).toContain('yd-config-provider--disabled');
      wrapper.unmount();
    });

    it('期望插槽内容应被渲染', () => {
      const wrapper = createConfigProvider({}, { default: '内容' });
      expect(wrapper.text()).toBe('内容');
      wrapper.unmount();
    });
  });
});
