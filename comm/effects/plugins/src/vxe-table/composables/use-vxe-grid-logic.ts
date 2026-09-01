/**
 * use-vxe-grid-logic 组合式函数
 *
 * @path comm\effects\plugins\src\vxe-table\composables\use-vxe-grid-logic.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 将 use-vxe-grid.vue 中的表格核心逻辑（CRUD 操作、分页管理、数据加载、列配置处理、
 * 工具栏/表单/插槽等响应式计算与生命周期）抽取为独立 composable，
 * 使 Vue 单文件组件保持在 400 行以内。
 * 插槽相关职责（工具栏/标题/表单插槽）已进一步拆分至 use-vxe-grid-slots.ts。
 *
 * 使用方式：
 * ```ts
 * const {
 *   gridRef, options, events, showToolbar, Form, onSearchBtnClick, ...
 * } = useVxeGridLogic(props);
 * ```
 */

import type {
  VxeGridDefines,
  VxeGridInstance,
  VxeGridListeners,
  VxeGridProps as VxeTableGridProps,
} from 'vxe-table';

import type { Component, ComputedRef, Ref, SetupContext } from 'vue';

import type { YDSZFormProps } from '@YDSZ-core/form-ui';

import type { ExtendedVxeGridApi, VxeGridProps } from '../types';

import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  toRaw,
  useSlots,
  useTemplateRef,
  watch,
} from 'vue';

import { usePriorityValues } from '@ydsz/hooks';
import { $t } from '@ydsz/locales';
import { usePreferences } from '@ydsz/preferences';
import {
  cloneDeep,
  cn,
  isBoolean,
  isEqual,
  mergeWithArrayOverride,
} from '@ydsz/utils';

import { VxeUI } from 'vxe-table';

import { extendProxyOptions } from '../extends';
import { useTableForm } from '../init';

import { createLogger } from '@YDSZ-core/shared/utils';

import {
  FORM_SLOT_PREFIX,
  useVxeGridSlotComputeds,
} from './use-vxe-grid-slots';

export {
  FORM_SLOT_PREFIX,
  TABLE_TITLE,
  TOOLBAR_ACTIONS,
  TOOLBAR_TOOLS,
} from './use-vxe-grid-slots';

const logger = createLogger('use-vxe-grid-logic');

/**
 * use-vxe-grid 组合式函数的 Props 类型。
 *
 * @remarks
 * 与 use-vxe-grid.vue 中定义的 Props 保持一致，
 * 在 VxeGridProps 基础上扩展了 api 字段用于操作表格。
 */
export interface VxeGridLogicProps extends VxeGridProps {
  /** 表格操作 API 句柄 */
  api: ExtendedVxeGridApi;
}

/**
 * use-vxe-grid-logic 组合式函数的返回类型。
 *
 * @remarks
 * 包含模板渲染所需的全部响应式数据、事件处理器与子组件，
 * 结构上与原 Vue 组件 `<script setup>` 中声明的变量一一对应。
 */
export interface UseVxeGridLogicReturn {
  /** 表格实例模板引用 */
  gridRef: Ref<VxeGridInstance | undefined>;
  /** 合并后的 vxe-grid 配置（含工具栏、分页、代理等） */
  options: ComputedRef<VxeTableGridProps>;
  /** 合并后的 vxe-grid 事件监听器 */
  events: ComputedRef<Record<string, unknown>>;
  /** 是否显示工具栏 */
  showToolbar: ComputedRef<boolean>;
  /** 是否显示表格标题 */
  showTableTitle: ComputedRef<boolean>;
  /** 表格标题文本 */
  tableTitle: ComputedRef<string | undefined>;
  /** 表格标题帮助文本 */
  tableTitleHelp: ComputedRef<string | undefined>;
  /** 需要委派给 vxe-grid 的插槽名列表（排除 empty/form/loading/toolbar） */
  delegatedSlots: ComputedRef<string[]>;
  /** 需要委派给搜索表单的插槽名列表（form- 前缀） */
  delegatedFormSlots: ComputedRef<string[]>;
  /** 搜索表单配置 */
  formOptions: ComputedRef<YDSZFormProps | undefined>;
  /** 是否显示搜索表单 */
  showSearchForm: ComputedRef<boolean | undefined>;
  /** 是否为紧凑模式表单 */
  isCompactForm: ComputedRef<boolean>;
  /** 是否显示搜索表单与表格之间的分隔条 */
  isSeparator: ComputedRef<boolean>;
  /** 分隔条背景色 */
  separatorBg: ComputedRef<string | undefined>;
  /** 表单插槽前缀常量 */
  FORM_SLOT_PREFIX: string;
  /** 搜索表单组件 */
  Form: Component;
  /** 搜索按钮点击事件处理器 */
  onSearchBtnClick: () => void;
  /** vxe-grid 原始配置（含 toolbarConfig 等） */
  gridOptions: ComputedRef<VxeTableGridProps>;
  /** 是否显示默认空状态 */
  showDefaultEmpty: ComputedRef<boolean>;
  /** 类名合并工具函数 */
  cn: typeof cn;
  /** 组件根元素 class */
  className: ComputedRef<string>;
  /** vxe-grid 元素 class */
  gridClass: ComputedRef<string>;
}

/**
 * use-vxe-grid 的组合式函数，封装表格的核心逻辑。
 *
 * @remarks
 * 将表格的 CRUD 操作、分页管理、数据加载、列配置处理、工具栏/表单/插槽等
 * 响应式计算与生命周期封装为独立 composable。
 *
 * 职责范围：
 * - **CRUD 操作**：通过 `props.api` 提供 reload / toggleSearchForm / mount / unmount 等能力；
 * - **分页管理**：在 `options` 计算属性中合并分页配置（layouts、pageSizes、pageSize 等）；
 * - **数据加载**：`init` 函数在挂载时触发首次查询，并扩展 proxyConfig 以携带表单参数；
 * - **列配置处理**：合并全局配置、工具栏配置与用户自定义配置，处理代理、分页、表单等。
 *
 * 生命周期：
 * - `onMounted`：挂载 API 与表单，执行 `init` 初始化数据加载；
 * - `onUnmounted`：卸载 API 与表单，释放资源。
 *
 * @param props - 组件属性，包含 api 句柄与表格/表单配置
 * @returns 模板渲染所需的全部响应式数据、事件处理器与子组件
 */
export function useVxeGridLogic(
  props: VxeGridLogicProps,
): UseVxeGridLogicReturn {
  const slots: SetupContext['slots'] = useSlots();

  const gridRef = useTemplateRef<VxeGridInstance>('gridRef');

  const state = props.api?.useStore?.();

  const {
    gridOptions,
    class: className,
    gridClass,
    gridEvents,
    formOptions,
    tableTitle,
    tableTitleHelp,
    showSearchForm,
    separator,
  } = usePriorityValues(props, state);

  const { isMobile } = usePreferences();

  // ---------- 分隔条 ----------

  const isSeparator = computed(() => {
    if (
      !formOptions.value ||
      showSearchForm.value === false ||
      separator.value === false
    ) {
      return false;
    }
    if (separator.value === true || separator.value === undefined) {
      return true;
    }
    return separator.value.show !== false;
  });

  const separatorBg = computed(() => {
    return !separator.value ||
      isBoolean(separator.value) ||
      !separator.value.backgroundColor
      ? undefined
      : separator.value.backgroundColor;
  });

  // ---------- 搜索表单 ----------

  const [Form, formApi] = useTableForm({
    compact: true,
    handleSubmit: async () => {
      const formValues = await formApi.getValues();
      formApi.setLatestSubmissionValues(toRaw(formValues));
      props.api.reload(formValues);
    },
    handleReset: async () => {
      const prevValues = await formApi.getValues();
      await formApi.resetForm();
      const formValues = await formApi.getValues();
      formApi.setLatestSubmissionValues(formValues);
      // 如果值发生了变化，submitOnChange会触发刷新。所以只在submitOnChange为false或者值没有发生变化时，手动刷新
      if (isEqual(prevValues, formValues) || !formOptions.value?.submitOnChange) {
        props.api.reload(formValues);
      }
    },
    commonConfig: {
      componentProps: {
        class: 'w-full',
      },
    },
    showCollapseButton: true,
    submitButtonOptions: {
      content: computed(() => $t('common.search')),
    },
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  });

  // ---------- 工具栏 / 插槽 ----------

  const {
    delegatedFormSlots,
    delegatedSlots,
    showTableTitle,
    showToolbar,
    toolbarOptions,
  } = useVxeGridSlotComputeds({
    formOptions,
    gridOptions,
    showSearchForm,
    slots,
    tableTitle,
  });

  // ---------- 合并后的 vxe-grid 配置 ----------

  const options = computed(() => {
    const globalGridConfig = VxeUI?.getConfig()?.grid ?? {};

    const mergedOptions: VxeTableGridProps = cloneDeep(
      mergeWithArrayOverride(
        {},
        toRaw(toolbarOptions.value),
        toRaw(gridOptions.value),
        globalGridConfig,
      ),
    );

    if (mergedOptions.proxyConfig) {
      const { ajax } = mergedOptions.proxyConfig;
      mergedOptions.proxyConfig.enabled = !!ajax;
      // 不自动加载数据, 由组件控制
      mergedOptions.proxyConfig.autoLoad = false;
    }

    if (mergedOptions.pagerConfig) {
      const mobileLayouts = [
        'PrevJump',
        'PrevPage',
        'Number',
        'NextPage',
        'NextJump',
      ] as string[];
      const layouts = [
        'Total',
        'Sizes',
        'Home',
        ...mobileLayouts,
        'End',
      ] as readonly string[];
      mergedOptions.pagerConfig = mergeWithArrayOverride(
        {},
        mergedOptions.pagerConfig,
        {
          pageSize: 20,
          background: true,
          pageSizes: [10, 20, 30, 50, 100, 200],
          className: 'mt-2 w-full',
          layouts: isMobile.value ? mobileLayouts : layouts,
          size: 'mini' as const,
        },
      );
    }
    if (mergedOptions.formConfig) {
      mergedOptions.formConfig.enabled = false;
    }
    return mergedOptions;
  });

  // ---------- 事件处理 ----------

  function onToolbarToolClick(
    event: VxeGridDefines.ToolbarToolClickEventParams,
  ) {
    if (event.code === 'search') {
      onSearchBtnClick();
    }
    (
      gridEvents.value?.toolbarToolClick as VxeGridListeners['toolbarToolClick']
    )?.(event);
  }

  function onSearchBtnClick() {
    props.api?.toggleSearchForm?.();
  }

  const events = computed(() => {
    return {
      ...gridEvents.value,
      toolbarToolClick: onToolbarToolClick,
    };
  });

  // ---------- 空状态 ----------

  const showDefaultEmpty = computed(() => {
    // 检查是否有原生的 VXE Table 空状态配置
    const hasEmptyText = options.value.emptyText !== undefined;
    const hasEmptyRender = options.value.emptyRender !== undefined;

    // 如果有原生配置，就不显示默认的空状态
    return !hasEmptyText && !hasEmptyRender;
  });

  // ---------- 初始化 ----------

  async function init() {
    await nextTick();
    const globalGridConfig = VxeUI?.getConfig()?.grid ?? {};
    const defaultGridOptions: VxeTableGridProps = mergeWithArrayOverride(
      {},
      toRaw(gridOptions.value),
      toRaw(globalGridConfig),
    );
    // 内部主动加载数据，防止form的默认值影响
    const autoLoad = defaultGridOptions.proxyConfig?.autoLoad;
    const enableProxyConfig = options.value.proxyConfig?.enabled;
    if (enableProxyConfig && autoLoad) {
      props.api.grid.commitProxy?.(
        'query',
        formOptions.value ? ((await formApi.getValues()) ?? {}) : {},
      );
      // props.api.reload(formApi.form?.values ?? {});
    }

    // form 由 YDSZ-form代替，所以不适配formConfig，这里给出警告
    const formConfig = gridOptions.value?.formConfig;
    // 处理某个页面加载多个Table时，第2个之后的Table初始化报出警告
    // 因为第一次初始化之后会把defaultGridOptions和gridOptions合并后缓存进State
    if (formConfig && formConfig.enabled) {
      logger.warn(
        '[YDSZ Vxe Table]: The formConfig in the grid is not supported, please use the `formOptions` props',
      );
    }
    props.api?.setState?.({ gridOptions: defaultGridOptions });
    // form 由 YDSZ-form 代替，所以需要保证query相关事件可以拿到参数
    extendProxyOptions(props.api, defaultGridOptions, () =>
      formApi.getLatestSubmissionValues(),
    );
  }

  // ---------- 响应式监听 ----------

  // formOptions支持响应式
  watch(
    formOptions,
    () => {
      formApi.setState((prev) => {
        const finalFormOptions: YDSZFormProps = mergeWithArrayOverride(
          {},
          formOptions.value,
          prev,
        );
        return {
          ...finalFormOptions,
          collapseTriggerResize: !!finalFormOptions.showCollapseButton,
        };
      });
    },
    {
      immediate: true,
    },
  );

  const isCompactForm = computed(() => {
    return formApi.getState()?.compact;
  });

  // ---------- 生命周期 ----------

  onMounted(() => {
    props.api?.mount?.(gridRef.value, formApi);
    init();
  });

  onUnmounted(() => {
    formApi?.unmount?.();
    props.api?.unmount?.();
  });

  // ---------- 返回值 ----------

  return {
    gridRef,
    options,
    events,
    showToolbar,
    showTableTitle,
    tableTitle,
    tableTitleHelp,
    delegatedSlots,
    delegatedFormSlots,
    formOptions,
    showSearchForm,
    isCompactForm,
    isSeparator,
    separatorBg,
    FORM_SLOT_PREFIX,
    Form,
    onSearchBtnClick,
    gridOptions,
    showDefaultEmpty,
    cn,
    className,
    gridClass,
  } as UseVxeGridLogicReturn;
}
