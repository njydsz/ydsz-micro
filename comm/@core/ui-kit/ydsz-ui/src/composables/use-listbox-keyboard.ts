/**
 * 列表框键盘导航 composable —— 单选/多选下拉与树选择共用的活动项模型。
 *
 * <p>对标 WAI-ARIA Authoring Practices 的 Listbox / Combobox 键盘规范，
 * 并补齐本仓此前完全缺失的一环：styled 层的选择器此前没有任何 `@keydown` 实现，
 * 键盘用户只能在选项间 Tab 或无法展开面板。
 *
 * <p>支持按键：
 * <ul>
 *   <li>ArrowDown / ArrowUp：在可选项间前后移动，到边界回绕（与 Ant Design、Element Plus 一致）</li>
 *   <li>Home / End：首项 / 末项</li>
 *   <li>Enter / Space：确认当前活动项</li>
 *   <li>Escape：关闭面板</li>
 *   <li>可打印字符：单字符搜索，跳到下一个以该字母开头的选项（到边界回绕）</li>
 * </ul>
 *
 * <p>禁用项自动跳过；活动索引变化时通过 `onActiveChange` 通知调用方做滚动定位，
 * 因此虚拟滚动下键盘导航依然可用（调用方只需把可见切片喂进 `items`）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-listbox-keyboard.ts
 * @author ydsz-team
 * @since 5.7.0
 */

import type { MaybeRefOrGetter } from 'vue';

import type { ComputedRef, Ref } from 'vue';

import { computed, ref, toValue, watch } from 'vue';

/** 参与键盘导航的选项最小契约 */
export interface ListboxKeyboardItem {
  /** 是否禁用（禁用项被导航跳过） */
  disabled?: boolean;
  /** 用于首字母匹配的文本 */
  label?: string;
  /** 选项值 */
  value: string | number;
}

/** useListboxKeyboard 配置 */
export interface UseListboxKeyboardOptions {
  /** 当前参与导航的选项序列（过滤后 / 虚拟窗口内的可见项） */
  items: MaybeRefOrGetter<ListboxKeyboardItem[]>;
  /** 导航到边界时是否回绕，默认 true */
  wrap?: MaybeRefOrGetter<boolean>;
  /** 活动项变化回调（滚动定位、aria-activedescendant） */
  onActiveChange?: (index: number) => void;
  /** Enter / Space 确认活动项 */
  onSelect?: (index: number) => void;
  /** Escape 关闭面板 */
  onClose?: () => void;
}

/** useListboxKeyboard 返回句柄 */
export interface UseListboxKeyboardReturn {
  /** 当前活动项索引，-1 表示无活动项 */
  activeIndex: Ref<number>;
  /** 活动项的稳定标识，供 aria-activedescendant 使用 */
  activeValue: ComputedRef<string | number | undefined>;
  /** 绑定到触发器/面板的 keydown 处理 */
  handleKeydown: (event: KeyboardEvent) => void;
  /** 清除活动态（面板关闭或过滤结果变化后调用） */
  resetActive: () => void;
  /** 显式设置活动索引（点击选项时同步） */
  setActiveIndex: (index: number) => void;
}

/** 方向键与功能键之外，需要交给面板输入框处理的控制键 */
const IGNORED_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab']);

/**
 * 判断选项是否可被导航到。
 *
 * @param item - 候选项
 * @returns 是否可选
 */
function isNavigable(item: ListboxKeyboardItem | undefined): boolean {
  return !!item && !item.disabled;
}

/**
 * 归一化匹配文本，用于大小写不敏感的前缀比较。
 *
 * @param label - 原始文本
 * @returns 小写文本，缺省为空串
 */
function normalize(label: string | undefined): string {
  return (label ?? '').trim().toLowerCase();
}

/**
 * 在序列中查找第一个 label 以 query 开头的项。
 *
 * @param items - 选项序列
 * @param query - 前缀（已小写）
 * @param from - 起始索引（不含）
 * @returns 命中索引，未命中返回 -1
 */
function findByPrefix(
  items: ListboxKeyboardItem[],
  query: string,
  from: number,
): number {
  for (let offset = 1; offset <= items.length; offset++) {
    const index = (from + offset) % items.length;
    const item = items[index];
    if (item && normalize(item.label).startsWith(query)) return index;
  }
  return -1;
}

/**
 * 从起始索引向前/向后寻找下一个可选项。
 *
 * @param items - 选项序列
 * @param from - 起始索引
 * @param step - 步长（+1 / -1）
 * @param wrap - 是否回绕
 * @returns 命中的索引，无命中返回 -1
 */
function findNextNavigable(
  items: ListboxKeyboardItem[],
  from: number,
  step: number,
  wrap: boolean,
): number {
  const last = items.length - 1;
  if (last < 0) return -1;

  let cursor = from;
  for (let guard = 0; guard <= last + 1; guard++) {
    cursor += step;
    if (cursor > last) {
      if (!wrap) return -1;
      cursor = 0;
    } else if (cursor < 0) {
      if (!wrap) return -1;
      cursor = last;
    }
    if (isNavigable(items[cursor])) return cursor;
    // 回绕一整圈仍无可选项：cursor 会停在起点，此处用 guard 次数兜底
  }
  return -1;
}

/**
 * useListboxKeyboard —— 维护列表框活动项与按键响应。
 *
 * @param options - 配置
 * @returns 键盘导航句柄
 */
export function useListboxKeyboard(
  options: UseListboxKeyboardOptions,
): UseListboxKeyboardReturn {
  const activeIndex = ref(-1);

  /**
   * 设置活动项并通知调用方。
   *
   * @param index - 目标索引
   * @returns 无
   */
  function setActiveIndex(index: number): void {
    if (activeIndex.value === index) return;
    activeIndex.value = index;
    options.onActiveChange?.(index);
  }

  /**
   * 清除活动态。
   *
   * @returns 无
   */
  function resetActive(): void {
    activeIndex.value = -1;
  }

  /** 选项序列的当前快照 */
  function currentItems(): ListboxKeyboardItem[] {
    return toValue(options.items) ?? [];
  }

  /**
   * 移动活动项到边界或下一个可选项。
   *
   * @param step - 步长方向
   * @param edge - 直接跳到首/末项时的目标索引，-1 表示不启用
   * @returns 无
   */
  function move(step: number, edge = -1): void {
    const items = currentItems();
    if (items.length === 0) return;

    if (edge >= 0) {
      const index = edge === 0
        ? findNextNavigable(items, -1, 1, false)
        : findNextNavigable(items, items.length, -1, false);
      if (index >= 0) setActiveIndex(index);
      return;
    }

    const from = activeIndex.value;
    // 尚无活动项时：向后从头部起，向前从尾部起
    const candidate = from < 0
      ? (step > 0 ? findNextNavigable(items, -1, 1, false) : findNextNavigable(items, items.length, -1, false))
      : findNextNavigable(items, from, step, toValue(options.wrap ?? true));
    if (candidate >= 0) setActiveIndex(candidate);
  }

  /**
   * 处理单字符搜索：从当前活动项向后找下一个前缀命中项（到边界回绕）。
   *
   * <p>采用 W3C ARIA APG 的单字符语义而非累积前缀缓冲：累积匹配会让「再按一次同一个
   * 字母」停留在同一项上，无法在同一首字母的多个选项间切换。
   *
   * @param key - 按下的字符
   * @returns 无
   */
  function typeahead(key: string): void {
    const items = currentItems();
    if (items.length === 0) return;
    const hit = findByPrefix(items, key.toLowerCase(), activeIndex.value);
    if (hit >= 0) setActiveIndex(hit);
  }

  /**
   * 键盘事件入口。
   *
   * @param event - 原生键盘事件
   * @returns 无
   */
  function handleKeydown(event: KeyboardEvent): void {
    const { key } = event;
    if (IGNORED_KEYS.has(key)) return;

    switch (key) {
      case ' ':
      case 'Enter': {
        if (activeIndex.value >= 0) {
          event.preventDefault();
          options.onSelect?.(activeIndex.value);
        }
        return;
      }
      case 'ArrowDown': {
        event.preventDefault();
        move(1);
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        move(-1);
        return;
      }
      case 'End': {
        event.preventDefault();
        move(-1, 1);
        return;
      }
      case 'Escape': {
        options.onClose?.();
        return;
      }
      case 'Home': {
        event.preventDefault();
        move(1, 0);
        return;
      }
      default: {
        // 单字符可打印键进入 typeahead；其余（如 PageDown）交回浏览器默认行为
        if (key.length === 1) typeahead(key);
      }
    }
  }

  // 选项序列变化时把活动项收敛回有效范围，避免删除/过滤后指向越界索引
  const itemsSnapshot = computed(() => toValue(options.items));
  watch(itemsSnapshot, (items) => {
    if (activeIndex.value >= (items?.length ?? 0)) resetActive();
  });

  return {
    activeIndex,
    activeValue: computed(() => currentItems()[activeIndex.value]?.value),
    handleKeydown,
    resetActive,
    setActiveIndex,
  };
}
