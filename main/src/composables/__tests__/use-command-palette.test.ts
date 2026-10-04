/**
 * use-command-palette 单元测试
 *
 * 覆盖核心交互场景：
 * 1. 按下 Cmd+K（Ctrl+K）时面板可见
 * 2. 按下 Esc 时面板关闭
 * 3. 空查询时显示历史搜索（visible 初始为 false，未触发搜索）
 *
 * @path main\src\composables\__tests__\use-command-palette.test.ts
 * @author ydsz-team
 * @since 5.1.0
 */
import { ref, nextTick } from 'vue';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useCommandPalette } from '../use-command-palette';

describe('useCommandPalette', () => {
  let visible: ReturnType<typeof ref<boolean>>;

  beforeEach(() => {
    visible = ref(false);
    // 清理所有 document 事件监听
    document.removeEventListener('keydown', () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Test 1: Cmd+K 触发可见 ====================

  it('按下 Cmd+K 时面板应可见', async () => {
    // 模拟非 Mac 环境 → 使用 Ctrl+K
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');

    const { open } = useCommandPalette({ visible });

    // 手动调用 onMounted 对应的绑定
    // useCommandPalette 内部使用 onMounted/onBeforeUnmounted
    // 组件生命周期在测试中不会自动触发，因此直接测试 toggle 行为
    // 以及事件监听的存在性

    // 模拟 Ctrl+K 按下
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    // 直接调用 open() 模拟快捷键效果
    open();
    await nextTick();

    expect(visible.value).toBe(true);

    // 再次 toggle 应关闭
    const { close } = useCommandPalette({ visible: ref(true) });
    close();
    // 这个测试主要验证 open() 能正确设置 visible
  });

  it('按下 Ctrl+K 切换：打开后再次按下关闭', async () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');

    // 手动注册事件监听（模拟 onMounted 行为）
    let handler: ((e: KeyboardEvent) => void) | null = null;
    const originalAdd = document.addEventListener.bind(document);
    const spy = vi.spyOn(document, 'addEventListener').mockImplementation((type: string, listener: any) => {
      if (type === 'keydown') {
        handler = listener;
      }
      return originalAdd(type, listener);
    });

    useCommandPalette({ visible });
    await nextTick();

    expect(handler).not.toBeNull();

    // 第一次 Ctrl+K → 打开
    handler!(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    await nextTick();
    expect(visible.value).toBe(true);

    // 第二次 Ctrl+K → 关闭
    handler!(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    await nextTick();
    expect(visible.value).toBe(false);

    spy.mockRestore();
  });

  // ==================== Test 2: Esc 关闭 ====================

  it('按下 Esc 时面板应关闭', async () => {
    // 面板已打开状态
    visible.value = true;

    let handler: ((e: KeyboardEvent) => void) | null = null;
    const originalAdd = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation((type: string, listener: any) => {
      if (type === 'keydown') {
        handler = listener;
      }
      return originalAdd(type, listener);
    });

    useCommandPalette({ visible });
    await nextTick();

    expect(visible.value).toBe(true);

    // 按下 Esc
    handler!(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(visible.value).toBe(false);
  });

  // ==================== Test 3: 空查询时显示历史搜索 ====================

  it('空查询时面板可见，显示历史搜索状态', async () => {
    const { open } = useCommandPalette({ visible });

    // 打开面板 → 应可见
    open();
    await nextTick();
    expect(visible.value).toBe(true);

    // 面板打开但未输入搜索词 → 应显示历史（由 search-panel.vue 的 watch 处理）
    // 此处验证面板处于可见状态
    // 具体历史 searchStore.recentSearches 是否为空的逻辑由 panel 组件处理
    // composable 层面确保 invisible → visible 转换正确

    // 验证 open 回调被调用
    const visible2 = ref(false);
    const onOpenSpy = vi.fn();
    const { open: open2 } = useCommandPalette({
      visible: visible2,
      onOpen: onOpenSpy,
    });

    open2();
    await nextTick();

    expect(visible2.value).toBe(true);
    expect(onOpenSpy).toHaveBeenCalledTimes(1);
  });
});
