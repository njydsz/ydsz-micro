/**
 * YDSZVxeGrid 表格插槽渲染相关的响应式计算模块。
 *
 * 从 use-vxe-grid-logic 拆分出表格插槽处理职责：
 * - 工具栏插槽（toolbar-actions / toolbar-tools）与搜索按钮合并；
 * - 表格标题插槽（table-title）的显示判断；
 * - 搜索表单插槽（form- 前缀）与委派插槽名列表的计算。
 *
 * 通过 {@link useVxeGridSlotComputeds} 以参数传值的方式接收主 composable
 * 的响应式依赖，不持有任何模块级可变状态。
 *
 * @path comm\effects\plugins\src\vxe-table\composables\use-vxe-grid-slots.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { VxeGridPropTypes, VxeToolbarPropTypes } from 'vxe-table';

import type { ComputedRef, SetupContext } from 'vue';

import type { YDSZFormProps } from '@YDSZ-core/form-ui';

import type { VxeGridProps } from '../types';

import { computed } from 'vue';

import { $t } from '@ydsz/locales';

/** 表单插槽前缀 */
export const FORM_SLOT_PREFIX = 'form-';

/** 工具栏左侧操作插槽名 */
export const TOOLBAR_ACTIONS = 'toolbar-actions';

/** 工具栏右侧工具插槽名 */
export const TOOLBAR_TOOLS = 'toolbar-tools';

/** 表格标题插槽名 */
export const TABLE_TITLE = 'table-title';

/**
 * useVxeGridSlotComputeds 的依赖参数。
 *
 * @remarks
 * 全部通过参数传入，不引入模块级可变状态。
 */
export interface VxeGridSlotDeps {
  /** 搜索表单配置 */
  formOptions: ComputedRef<YDSZFormProps | undefined>;
  /** vxe-grid 原始配置（含 toolbarConfig 等） */
  gridOptions: ComputedRef<VxeGridProps['gridOptions']>;
  /** 是否显示搜索表单 */
  showSearchForm: ComputedRef<boolean | undefined>;
  /** 组件插槽集合 */
  slots: SetupContext['slots'];
  /** 表格标题文本 */
  tableTitle: ComputedRef<string | undefined>;
}

/**
 * useVxeGridSlotComputeds 的返回值。
 *
 * @remarks
 * 结构与 use-vxe-grid-logic 中的原始计算属性一一对应。
 */
export interface VxeGridSlotComputeds {
  /** 需要委派给搜索表单的插槽名列表（form- 前缀） */
  delegatedFormSlots: ComputedRef<string[]>;
  /** 需要委派给 vxe-grid 的插槽名列表（排除 empty/form/loading/toolbar） */
  delegatedSlots: ComputedRef<string[]>;
  /** 是否显示表格标题 */
  showTableTitle: ComputedRef<boolean | string | undefined>;
  /** 是否显示工具栏 */
  showToolbar: ComputedRef<boolean | string | undefined>;
  /** 工具栏配置（含搜索按钮与插槽合并结果） */
  toolbarOptions: ComputedRef<{
    toolbarConfig: VxeGridPropTypes.ToolbarConfig;
  }>;
}

/**
 * 计算与表格插槽相关的响应式数据。
 *
 * @remarks
 * 覆盖工具栏插槽、表格标题插槽与搜索表单插槽三类职责，
 * 逻辑与 use-vxe-grid-logic 中的原始实现保持一致。
 *
 * @param deps - 主 composable 传入的响应式依赖
 * @returns 工具栏/标题显示状态、工具栏配置与插槽委派列表
 */
export function useVxeGridSlotComputeds(
  deps: VxeGridSlotDeps,
): VxeGridSlotComputeds {
  const { formOptions, gridOptions, showSearchForm, slots, tableTitle } = deps;

  // ---------- 工具栏 ----------

  const showTableTitle = computed(() => {
    return !!slots[TABLE_TITLE]?.() || tableTitle.value;
  });

  const showToolbar = computed(() => {
    return (
      !!slots[TOOLBAR_ACTIONS]?.() ||
      !!slots[TOOLBAR_TOOLS]?.() ||
      showTableTitle.value
    );
  });

  const toolbarOptions = computed(() => {
    const slotActions = slots[TOOLBAR_ACTIONS]?.();
    const slotTools = slots[TOOLBAR_TOOLS]?.();
    const searchBtn: VxeToolbarPropTypes.ToolConfig = {
      code: 'search',
      icon: 'vxe-icon-search',
      circle: true,
      status: showSearchForm.value ? 'primary' : undefined,
      title: showSearchForm.value
        ? $t('common.hideSearchPanel')
        : $t('common.showSearchPanel'),
    };
    // 将搜索按钮合并到用户配置的toolbarConfig.tools中
    const toolbarConfig: VxeGridPropTypes.ToolbarConfig = {
      tools: (gridOptions.value?.toolbarConfig?.tools ??
        []) as VxeToolbarPropTypes.ToolConfig[],
    };
    if (gridOptions.value?.toolbarConfig?.search && !!formOptions.value) {
      toolbarConfig.tools = Array.isArray(toolbarConfig.tools)
        ? [...toolbarConfig.tools, searchBtn]
        : [searchBtn];
    }

    if (!showToolbar.value) {
      return { toolbarConfig };
    }

    // 强制使用固定的toolbar配置，不允许用户自定义
    // 减少配置的复杂度，以及后续维护的成本
    toolbarConfig.slots = {
      ...(slotActions || showTableTitle.value
        ? { buttons: TOOLBAR_ACTIONS }
        : {}),
      ...(slotTools ? { tools: TOOLBAR_TOOLS } : {}),
    };
    return { toolbarConfig };
  });

  // ---------- 插槽委派 ----------

  const delegatedSlots = computed(() => {
    const resultSlots: string[] = [];

    for (const key of Object.keys(slots)) {
      if (
        !['empty', 'form', 'loading', TOOLBAR_ACTIONS, TOOLBAR_TOOLS].includes(
          key,
        )
      ) {
        resultSlots.push(key);
      }
    }
    return resultSlots;
  });

  const delegatedFormSlots = computed(() => {
    const resultSlots: string[] = [];

    for (const key of Object.keys(slots)) {
      if (key.startsWith(FORM_SLOT_PREFIX)) {
        resultSlots.push(key);
      }
    }
    return resultSlots.map((key) => key.replace(FORM_SLOT_PREFIX, ''));
  });

  return {
    delegatedFormSlots,
    delegatedSlots,
    showTableTitle,
    showToolbar,
    toolbarOptions,
  };
}
