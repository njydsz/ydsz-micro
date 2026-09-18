/**
 * useDesignerState — 设计器状态管理组合式 API。
 *
 * <p>集中管理设计器的 Schema、选中状态、历史记录（undo/redo）。
 *
 * @path comm\@core\ui-kit\form-designer\src\composables\use-designer-state.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';

import type {
  CanvasItem,
  DesignerComponentMeta,
  DesignerSchema,
} from '../types';

import {
  DEFAULT_DESIGNER_SCHEMA,
} from '../types';

/** 字段类型计数器，用于自动生成唯一 fieldName */
let fieldCounter = 0;

/**
 * 生成唯一 ID。
 */
function generateId(): string {
  return `field_${Date.now()}_${fieldCounter++}`;
}

/**
 * 从组件元数据创建画布字段实例。
 */
function createCanvasItem(meta: DesignerComponentMeta): CanvasItem {
  const cleanLabel = meta.label.replace(/[（(].*?[)）]/, '').trim();
  return {
    id: generateId(),
    fieldName: `field_${fieldCounter}`,
    label: cleanLabel,
    componentType: meta.componentType,
    componentProps: { ...meta.defaultProps },
    rules: [],
    isRequired: false,
    span: 12,
    sort: Date.now(),
    isDisabled: false,
    placeholder: (meta.defaultProps.placeholder as string) ?? `请输入${cleanLabel}`,
  };
}

/**
 * 设计器状态组合式 API。
 *
 * @param initialSchema 初始 Schema（可选）
 * @return 设计器状态和操作方法
 */
export function useDesignerState(initialSchema?: Partial<DesignerSchema>) {
  const schema = ref<DesignerSchema>({
    ...DEFAULT_DESIGNER_SCHEMA,
    ...initialSchema,
    items: initialSchema?.items ?? [],
    config: {
      ...DEFAULT_DESIGNER_SCHEMA.config,
      ...(initialSchema?.config ?? {}),
    },
  });

  /** 当前选中的字段 ID */
  const selectedId = ref<string | null>(null);

  /** 历史记录栈（undo） */
  const undoStack = ref<string[]>([]);

  /** 历史记录栈（redo） */
  const redoStack = ref<string[]>([]);

  /** 当前选中字段（计算属性） */
  const selectedItem = computed<CanvasItem | null>(() => {
    if (!selectedId.value) {
      return null;
    }
    return schema.value.items.find((item) => item.id === selectedId.value) ?? null;
  });

  /** 字段数量 */
  const itemCount = computed<number>(() => schema.value.items.length);

  /** 是否可撤销 */
  const canUndo = computed<boolean>(() => undoStack.value.length > 0);

  /** 是否可重做 */
  const canRedo = computed<boolean>(() => redoStack.value.length > 0);

  /**
   * 压入历史记录（修改前调用）。
   */
  function pushHistory(): void {
    undoStack.value.push(JSON.stringify(schema.value));
    if (undoStack.value.length > 50) {
      undoStack.value.shift();
    }
    redoStack.value = [];
  }

  /**
   * 从面板拖入新组件。
   */
  function addItem(meta: DesignerComponentMeta): CanvasItem {
    pushHistory();
    const item = createCanvasItem(meta);
    schema.value.items = [...schema.value.items, item];
    selectedId.value = item.id;
    return item;
  }

  /**
   * 复制字段。
   */
  function duplicateItem(id: string): CanvasItem | null {
    const source = schema.value.items.find((item) => item.id === id);
    if (!source) {
      return null;
    }
    pushHistory();
    const newItem: CanvasItem = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateId(),
      fieldName: `${source.fieldName}_copy`,
      label: `${source.label}_副本`,
      sort: Date.now(),
    };
    schema.value.items = [...schema.value.items, newItem];
    selectedId.value = newItem.id;
    return newItem;
  }

  /**
   * 移除字段。
   */
  function removeItem(id: string): void {
    pushHistory();
    schema.value.items = schema.value.items.filter((item) => item.id !== id);
    if (selectedId.value === id) {
      selectedId.value = null;
    }
  }

  /**
   * 更新字段。
   */
  function updateItem(id: string, updates: Partial<CanvasItem>): void {
    pushHistory();
    schema.value.items = schema.value.items.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return { ...item, ...updates };
    });
  }

  /**
   * 选中字段。
   */
  function selectItem(id: string | null): void {
    selectedId.value = id;
  }

  /**
   * 排序字段（拖拽后调用）。
   */
  function reorderItems(fromIndex: number, toIndex: number): void {
    pushHistory();
    const items = [...schema.value.items];
    const [moved] = items.splice(fromIndex, 1);
    if (moved) {
      items.splice(toIndex, 0, moved);
      items.forEach((item, index) => {
        item.sort = index * 10;
      });
      schema.value.items = items;
    }
  }

  /**
   * 撤销。
   */
  function undo(): void {
    if (undoStack.value.length === 0) {
      return;
    }
    redoStack.value.push(JSON.stringify(schema.value));
    const previous = undoStack.value.pop();
    if (previous) {
      schema.value = JSON.parse(previous) as DesignerSchema;
    }
  }

  /**
   * 重做。
   */
  function redo(): void {
    if (redoStack.value.length === 0) {
      return;
    }
    undoStack.value.push(JSON.stringify(schema.value));
    const next = redoStack.value.pop();
    if (next) {
      schema.value = JSON.parse(next) as DesignerSchema;
    }
  }

  /**
   * 更新全局配置。
   */
  function updateConfig(updates: Partial<DesignerSchema['config']>): void {
    pushHistory();
    schema.value.config = { ...schema.value.config, ...updates };
  }

  /**
   * 清空画布。
   */
  function clearAll(): void {
    pushHistory();
    schema.value.items = [];
    selectedId.value = null;
  }

  /**
   * 导出 Schema（深拷贝）。
   */
  function exportSchema(): DesignerSchema {
    return JSON.parse(JSON.stringify(schema.value)) as DesignerSchema;
  }

  return {
    schema,
    selectedId,
    selectedItem,
    itemCount,
    canUndo,
    canRedo,
    addItem,
    duplicateItem,
    removeItem,
    updateItem,
    selectItem,
    reorderItems,
    undo,
    redo,
    updateConfig,
    clearAll,
    exportSchema,
  };
}
