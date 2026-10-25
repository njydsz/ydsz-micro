/**
 * use-command-palette 单元测试
 *
 * 覆盖核心交互场景：
 * 1. open/close 与 onOpen/onClose 回调契约
 * 2. Ctrl+K 切换面板显隐
 * 3. Esc 仅在面板可见时关闭
 * 4. 卸载后移除全局监听（云顶编码规范 §5.5）
 *
 * <p>keydown 监听注册在 composable 的 onMounted 中，裸调用不会触发注册，
 * 因此所有用例都放进真实组件生命周期里跑。
 *
 * @path main\src\composables\__tests__\use-command-palette.test.ts
 * @author ydsz-team
 * @since 5.1.0
 */

import { defineComponent, h, nextTick, ref } from 'vue';

import { mount } from '@vue/test-utils';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { type UseCommandPaletteOptions, useCommandPalette } from '../use-command-palette';

/** 挂载结果 */
interface MountedPalette {
  /** composable 返回的控制函数 */
  api: ReturnType<typeof useCommandPalette>;
  /** 组件包装器 */
  wrapper: ReturnType<typeof mount>;
}

/**
 * 在真实组件生命周期内挂载 composable。
 *
 * @param options - 传给 useCommandPalette 的配置
 * @returns composable 句柄与组件包装器
 */
function mountPalette(options: UseCommandPaletteOptions): MountedPalette {
  let api!: ReturnType<typeof useCommandPalette>;
  const wrapper = mount(defineComponent({
    setup() {
      api = useCommandPalette(options);
      return () => h('div');
    },
  }));
  return { api, wrapper };
}

/** 向 document 派发一次 keydown */
function press(init: KeyboardEventInit): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
}

/** 模拟 Windows 键盘布局，使快捷键走 Ctrl+K */
function mockWin32Platform(): void {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
}

describe('useCommandPalette', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('open() 置 visible 为 true 并触发 onOpen', async () => {
    mockWin32Platform();
    const visible = ref(false);
    const onOpen = vi.fn();
    const { api, wrapper } = mountPalette({ onOpen, visible });

    api.open();
    await nextTick();

    expect(visible.value).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('Ctrl+K 打开后再次 Ctrl+K 关闭', async () => {
    mockWin32Platform();
    const visible = ref(false);
    const { wrapper } = mountPalette({ visible });
    await nextTick();

    press({ ctrlKey: true, key: 'k' });
    await nextTick();
    expect(visible.value).toBe(true);

    press({ ctrlKey: true, key: 'k' });
    await nextTick();
    expect(visible.value).toBe(false);

    wrapper.unmount();
  });

  it('面板可见时按 Esc 关闭并触发 onClose', async () => {
    const visible = ref(true);
    const onClose = vi.fn();
    const { wrapper } = mountPalette({ onClose, visible });
    await nextTick();

    press({ key: 'Escape' });
    await nextTick();

    expect(visible.value).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('面板未打开时按 Esc 不改写 visible', async () => {
    const visible = ref(false);
    const onClose = vi.fn();
    const { wrapper } = mountPalette({ onClose, visible });
    await nextTick();

    press({ key: 'Escape' });
    await nextTick();

    expect(visible.value).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('卸载后移除全局监听（云顶 §5.5 资源清理）', async () => {
    mockWin32Platform();
    const visible = ref(false);
    const { wrapper } = mountPalette({ visible });
    await nextTick();

    wrapper.unmount();
    press({ ctrlKey: true, key: 'k' });
    await nextTick();

    expect(visible.value).toBe(false);
  });
});
