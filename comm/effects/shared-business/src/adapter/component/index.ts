/**
 * 通用组件共同的使用的基础组件（公共包）—— shadcn/ui 注册表。
 *
 * 原先放在各子应用 adapter/form 内部，现提取到 @ydsz/shared-business 统一复用。
 * 可用于 YDSZ-form、YDSZ-modal、YDSZ-drawer 等组件使用。
 *
 * EP 退场（ep-exit-refactor-plan v3 §P0-1a）：原 Element Plus 异步组件注册表
 * 整体切换为 shadcn-ui + form-controls 适配层。shadcn kit 为可摇树 ESM，
 * 无需 EP 时代的 Promise.all 双 import 异步装配；控件值桥接由
 * @ydsz/common-ui 的 form-controls 承担（与 main 注册表共用同一实现）。
 *
 * 语义降级登记（P1-1 落地后回补）：
 * - YdSelectBase：YDSZSelect 为 options 驱动（value 为字符串），ElSelectV2 的
 *   大数据虚拟滚动暂以全量渲染承接；
 * - YdDatePicker：kit 仅支持 date/datetime，range 型 schema 暂以单值承接；
 * - TimePicker：由 FormTimePicker（datetime）过渡承接。
 *
 * @path comm\effects\shared-business\src\adapter\component\index.ts
 * @author ydsz-team
 * @since 1.1.0
 */

import type { Component } from 'vue';

import type { YdBaseFormComponentType } from '@ydsz/common-ui';

import { defineComponent, h, ref } from 'vue';

import {
  YdApiComponent,
  FormCheckbox,
  FormCheckboxGroup,
  FormInputNumber,
  FormRadioGroup,
  FormSpace,
  FormSwitch,
  FormTimePicker,
  FormTreeSelect,
  FormUpload,
  globalShareState,
  YdIconPicker,
} from '@ydsz/common-ui';
import { $t } from '@ydsz/locales';
import { showToast } from '@ydsz/notification';
import { YdDatePicker, YdSeparator, YDSZInput, YDSZSelect } from '@ydsz-core/ydsz-ui';

/**
 * 为底层组件包裹默认 placeholder 并透传 expose 方法的高阶包装函数。
 *
 * @remarks
 * placeholder 取值优先级为 props > attrs > i18n 兜底，保证调用方显式传入时不被覆盖。
 * 由于 `inheritAttrs: false` 且外层是新的 defineComponent，底层实例方法默认会丢失，
 * 因此用 Proxy 惰性代理 `innerRef`，使 `formApi` 等调用方仍能拿到 focus/validate 等方法。
 *
 * @param component - 被包裹的底层组件
 * @param type - 组件语义类型，用于回退到对应的 i18n 占位符（'input' | 'select'）
 * @param componentProps - 透传给底层组件的默认 props，会被外部 props/attrs 覆盖
 * @returns 包裹后的新组件，自动注入 placeholder 并透传内部实例方法
 */
const withDefaultPlaceholder = <T extends Component>(
  component: T,
  type: 'input' | 'select',
  componentProps: Record<string, unknown> = {},
) => {
  return defineComponent({
    name: component.name,
    inheritAttrs: false,
    setup: (props: Record<string, unknown>, { attrs, expose, slots }) => {
      const placeholder =
        props?.placeholder ||
        attrs?.placeholder ||
        $t(`ui.placeholder.${type}`);
      // 透传组件暴露的方法
      const innerRef = ref();
      expose(
        new Proxy(
          {},
          {
            get: (_target, key) => innerRef.value?.[key],
            has: (_target, key) => key in (innerRef.value || {}),
          },
        ),
      );
      return () =>
        h(
          component,
          { ...componentProps, placeholder, ...props, ...attrs, ref: innerRef },
          slots,
        );
    },
  });
};

/**
 * 表单可用的组件类型枚举。
 *
 * @remarks
 * 需根据业务组件库自行扩展；所有表单渲染用到的组件都必须在此声明，
 * 并在 {@link initComponentAdapter} 中注册对应实现，否则 Schema 里写了也渲染不出来。
 */
export type ComponentType =
  | 'ApiSelect'
  | 'ApiTreeSelect'
  | 'YdCheckboxBase'
  | 'CheckboxGroup'
  | 'YdDatePicker'
  | 'Divider'
  | 'YdIconPicker'
  | 'YdInput'
  | 'InputNumber'
  | 'YdRadioGroup'
  | 'YdSelectBase'
  | 'Space'
  | 'YdSwitch'
  | 'TimePicker'
  | 'TreeSelect'
  | 'YdUpload'
  | YdBaseFormComponentType;

/**
 * 初始化组件适配器：将表单/表格所需的 shadcn-ui 组件注册到全局共享状态。
 *
 * @remarks
 * 需在应用启动时调用一次，使 YDSZ-form、YDSZ-modal、YDSZ-drawer 能解析 {@link ComponentType}。
 * DefaultButton / PrimaryButton / YDSZInput / YDSZCheckbox / YDSZSelect 等基础键
 * 已由 form-ui 的 COMPONENT_MAP 内置 shadcn 实现，此处仅注册扩展键，同名覆盖请保持谨慎。
 */
async function initComponentAdapter() {
  const components: Partial<Record<ComponentType, Component>> = {
    ApiSelect: withDefaultPlaceholder(
      {
        ...YdApiComponent,
        name: 'ApiSelect',
      },
      'select',
      {
        component: YDSZSelect,
        optionsPropName: 'options',
      },
    ),
    ApiTreeSelect: withDefaultPlaceholder(
      {
        ...YdApiComponent,
        name: 'ApiTreeSelect',
      },
      'select',
      {
        component: FormTreeSelect,
        optionsPropName: 'treeData',
      },
    ),
    YdCheckboxBase: FormCheckbox,
    CheckboxGroup: FormCheckboxGroup,
    YdDatePicker,
    Divider: YdSeparator,
    YdIconPicker: withDefaultPlaceholder(YdIconPicker, 'select', {
      modelValueProp: 'model-value',
      inputComponent: YDSZInput,
    }),
    YdInput: withDefaultPlaceholder(YDSZInput, 'input'),
    InputNumber: withDefaultPlaceholder(FormInputNumber, 'input'),
    YdRadioGroup: FormRadioGroup,
    YdSelectBase: YDSZSelect,
    Space: FormSpace,
    YdSwitch: FormSwitch,
    TimePicker: FormTimePicker,
    TreeSelect: withDefaultPlaceholder(FormTreeSelect, 'select'),
    YdUpload: FormUpload,
  };

  // 将组件注册到全局共享状态中
  globalShareState.setComponents(components);

  // 定义全局共享状态中的消息提示
  globalShareState.defineMessage({
    // 复制成功消息提示
    copyPreferencesSuccess: (title, content) => {
      showToast.success(title, { description: content });
    },
  });
}

export { initComponentAdapter };
