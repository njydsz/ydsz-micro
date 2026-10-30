/**
 * useColumnChooser composable —— 表格列显隐状态管理。
 *
 * <p>提供列可见性切换、全选/全不选、重置默认状态等能力，
 * 供 ColumnChooser 组件与 YdDataTable toolbar 集成。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-table\use-column-chooser.ts
 * @author ydsz-team
 * @since 26.10.30
 */

import { computed, ref } from 'vue';

import type {
  ColumnVisibilityState,
  UseColumnChooserOptions,
  UseColumnChooserReturn,
} from './column-chooser-types';

/* ============================================================ */
/* 默认 key 黑名单：selection / expand / operation 列不可隐藏         */
/* ============================================================ */

const ALWAYS_VISIBLE_KEYS = new Set(['selection', 'expand', 'operation', '__selection__', '__expand__']);

function isAlwaysVisible(key: string): boolean {
  return ALWAYS_VISIBLE_KEYS.has(key);
}

/* ============================================================ */
/* Composable                                                     */
/* ============================================================ */

/**
 * useColumnChooser —— 列显隐状态管理。
 *
 * @param options - 配置
 * @returns 列显隐操作句柄
 */
export function useColumnChooser(options: UseColumnChooserOptions): UseColumnChooserReturn {
  const { allColumns } = options;

  /** 内部可见性状态（非受控模式） */
  const internalVisibility = ref<Record<string, boolean>>({});

  /** 同步列定义到内部状态：新列默认可见，不可隐藏列强制 true */
  function syncColumns(): void {
    const cols = allColumns();
    const next: Record<string, boolean> = {};
    for (const col of cols) {
      if (isAlwaysVisible(col.key) || col.hideable === false) {
        next[col.key] = true;
        continue;
      }
      next[col.key] = internalVisibility.value[col.key] ?? true;
    }
    internalVisibility.value = next;
  }

  // 初始化同步
  syncColumns();

  /** 有效可见性状态（受控优先） */
  const effectiveVisibility = computed<Record<string, boolean>>(() => {
    if (options.controlledVisibility?.value) {
      return options.controlledVisibility.value;
    }
    return internalVisibility.value;
  });

  /** 列状态列表 */
  const states = computed<ColumnVisibilityState[]>(() => {
    const cols = allColumns();
    const vis = effectiveVisibility.value;
    return cols.map((col) => ({
      hideable: !isAlwaysVisible(col.key) && col.hideable !== false,
      key: col.key,
      label: col.label || col.key,
      visible: vis[col.key] ?? true,
    }));
  });

  /** 当前可见列 keys */
  const visibleKeys = computed<string[]>(() =>
    states.value.filter((s) => s.visible).map((s) => s.key),
  );

  const hideableStates = computed(() => states.value.filter((s) => s.hideable));

  const allVisible = computed(() =>
    hideableStates.value.length > 0 && hideableStates.value.every((s) => s.visible),
  );

  const someVisible = computed(() => {
    const visible = hideableStates.value.filter((s) => s.visible).length;
    return visible > 0 && visible < hideableStates.value.length;
  });

  function toggle(key: string): void {
    const s = states.value.find((item) => item.key === key);
    if (!s?.hideable) return;
    setVisible(key, !s.visible);
  }

  function setVisible(key: string, visible: boolean): void {
    if (options.controlledVisibility) {
      options.controlledVisibility.value = {
        ...options.controlledVisibility.value,
        [key]: visible,
      };
      return;
    }
    internalVisibility.value = { ...internalVisibility.value, [key]: visible };
  }

  const showAll = (): void => {
    const next = { ...effectiveVisibility.value };
    for (const col of allColumns()) {
      if (!isAlwaysVisible(col.key) && col.hideable !== false) {
        next[col.key] = true;
      }
    }
    if (options.controlledVisibility) {
      options.controlledVisibility.value = next;
    } else {
      internalVisibility.value = next;
    }
  };

  const hideAll = (): void => {
    const next = { ...effectiveVisibility.value };
    for (const col of allColumns()) {
      if (!isAlwaysVisible(col.key) && col.hideable !== false) {
        next[col.key] = false;
      }
    }
    if (options.controlledVisibility) {
      options.controlledVisibility.value = next;
    } else {
      internalVisibility.value = next;
    }
  };

  const reset = (): void => {
    if (options.controlledVisibility) {
      options.controlledVisibility.value = {};
    } else {
      internalVisibility.value = {};
    }
    syncColumns();
  };

  const apply = (visibility: Record<string, boolean>): void => {
    if (options.controlledVisibility) {
      options.controlledVisibility.value = { ...visibility };
    } else {
      internalVisibility.value = { ...visibility };
    }
  };

  return {
    allVisible,
    apply,
    hideAll,
    someVisible,
    states,
    reset,
    setVisible,
    showAll,
    toggle,
    visibleKeys,
  };
}
