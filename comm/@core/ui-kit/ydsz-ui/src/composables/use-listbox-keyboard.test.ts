/**
 * useListboxKeyboard 单元测试 —— 方向键移动 / 边界回绕 / 禁用项跳过 / Home·End /
 * Enter·Space 确认 / Escape 关闭 / 单字符搜索 / 选项收缩后的越界收敛。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-listbox-keyboard.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { describe, expect, it, vi } from 'vitest';

import { nextTick, ref } from 'vue';

import { useListboxKeyboard } from './use-listbox-keyboard';

import type { ListboxKeyboardItem } from './use-listbox-keyboard';

const fruitItems: ListboxKeyboardItem[] = [
  { label: 'Apple', value: 'apple' },
  { disabled: true, label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
];

/**
 * 以静态数组挂载键盘导航，便于逐例覆盖不同回调组合。
 *
 * @param items - 选项序列
 * @param extra - 追加配置
 * @returns 键盘导航句柄与事件派发器
 */
function setup(
  items: ListboxKeyboardItem[] = fruitItems,
  extra: Record<string, unknown> = {},
) {
  const list = ref(items);
  const handle = useListboxKeyboard({ items: () => list.value, ...extra });
  return { handle, list };
}

/**
 * 构造一个可断言 preventDefault 的键盘事件对象。
 *
 * @param key - 键名
 * @returns 伪造的 KeyboardEvent
 */
function keyEvent(key: string): KeyboardEvent {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;
}

describe('useListboxKeyboard', () => {
  it('无活动项时 ArrowDown 落到首个可选项，ArrowUp 落到末个可选项', () => {
    const down = setup();
    down.handle.handleKeydown(keyEvent('ArrowDown'));
    expect(down.handle.activeIndex.value).toBe(0);

    const up = setup();
    up.handle.handleKeydown(keyEvent('ArrowUp'));
    expect(up.handle.activeIndex.value).toBe(3);
  });

  it('方向键跳过禁用项并在边界回绕', () => {
    const { handle } = setup();

    handle.handleKeydown(keyEvent('ArrowDown'));
    handle.handleKeydown(keyEvent('ArrowDown'));
    expect(handle.activeIndex.value).toBe(2);

    handle.setActiveIndex(3);
    handle.handleKeydown(keyEvent('ArrowDown'));
    expect(handle.activeIndex.value).toBe(0);

    handle.handleKeydown(keyEvent('ArrowUp'));
    expect(handle.activeIndex.value).toBe(3);
  });

  it('Home / End 直达首项与末项', () => {
    const { handle } = setup();

    handle.handleKeydown(keyEvent('End'));
    expect(handle.activeIndex.value).toBe(3);

    handle.handleKeydown(keyEvent('Home'));
    expect(handle.activeIndex.value).toBe(0);
  });

  it('Enter 与 Space 确认当前活动项，无活动项时不触发', () => {
    const onSelect = vi.fn();
    const { handle } = setup(fruitItems, { onSelect });

    handle.handleKeydown(keyEvent('Enter'));
    expect(onSelect).not.toHaveBeenCalled();

    handle.setActiveIndex(2);
    handle.handleKeydown(keyEvent('Enter'));
    handle.handleKeydown(keyEvent(' '));
    expect(onSelect).toHaveBeenNthCalledWith(1, 2);
    expect(onSelect).toHaveBeenNthCalledWith(2, 2);
  });

  it('Escape 关闭面板且不清空活动项', () => {
    const onClose = vi.fn();
    const { handle } = setup(fruitItems, { onClose });
    handle.setActiveIndex(1);

    handle.handleKeydown(keyEvent('Escape'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(handle.activeIndex.value).toBe(1);
  });

  it('单字符搜索跳到下一个同前缀选项并在边界回绕', () => {
    const { handle } = setup([
      { label: 'Apple', value: 'apple' },
      { label: 'Apricot', value: 'apricot' },
      { label: 'Banana', value: 'banana' },
    ]);

    handle.handleKeydown(keyEvent('a'));
    expect(handle.activeIndex.value).toBe(0);

    handle.handleKeydown(keyEvent('A'));
    expect(handle.activeIndex.value).toBe(1);

    handle.handleKeydown(keyEvent('a'));
    expect(handle.activeIndex.value).toBe(0);

    handle.handleKeydown(keyEvent('b'));
    expect(handle.activeIndex.value).toBe(2);
  });

  it('活动项变化通过 onActiveChange 上报一次，重复设置不重复上报', () => {
    const onActiveChange = vi.fn();
    const { handle } = setup(fruitItems, { onActiveChange });

    handle.setActiveIndex(2);
    handle.setActiveIndex(2);
    expect(onActiveChange).toHaveBeenCalledTimes(1);
    expect(onActiveChange).toHaveBeenCalledWith(2);
  });

  it('选项收缩到越界时活动态自动复位', async () => {
    const { handle, list } = setup();
    handle.setActiveIndex(3);

    list.value = fruitItems.slice(0, 2);
    await nextTick();

    expect(handle.activeIndex.value).toBe(-1);
  });

  it('activeValue 跟随活动索引，resetActive 后为 undefined', () => {
    const { handle } = setup();

    handle.setActiveIndex(2);
    expect(handle.activeValue.value).toBe('cherry');

    handle.resetActive();
    expect(handle.activeIndex.value).toBe(-1);
    expect(handle.activeValue.value).toBeUndefined();
  });

  it('全禁用列表不产生活动项', () => {
    const { handle } = setup([
      { disabled: true, label: 'X', value: 'x' },
      { disabled: true, label: 'Y', value: 'y' },
    ]);

    handle.handleKeydown(keyEvent('ArrowDown'));
    handle.handleKeydown(keyEvent('ArrowUp'));
    expect(handle.activeIndex.value).toBe(-1);
  });

  it('方向键阻止默认滚动，Shift 等修饰键被忽略', () => {
    const { handle } = setup();

    const arrow = keyEvent('ArrowDown');
    handle.handleKeydown(arrow);
    expect(arrow.preventDefault).toHaveBeenCalled();

    const shift = keyEvent('Shift');
    handle.handleKeydown(shift);
    expect(shift.preventDefault).not.toHaveBeenCalled();
    expect(handle.activeIndex.value).toBe(0);
  });
});
