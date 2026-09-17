/**
 * 通用异步组件注册表 —— 表单/弹窗/抽屉共享的 UI 组件统一装配层（基座版）
 *
 * 将原先写在 adapter/form 内部的基础组件提取为独立模块，使其可被
 * YDSZ-form、YDSZ-modal、YDSZ-drawer 等多个业务组件复用。
 *
 * EP 退场（ep-exit-refactor-plan v3 §P0-2）：原 Element Plus 异步组件注册表
 * 整体切换为 shadcn-ui + form-controls 适配层，与 @ydsz/shared-business 的
 * 公共注册表共用同一实现（common-ui form-controls）。shadcn kit 为可摇树
 * ESM，无需 EP 时代的 Promise.all 双 import 异步装配。
 *
 * 语义降级登记（P1-1 落地后回补）：
 * - Select：YDSZSelect 为 options 驱动（value 为字符串），ElSelectV2 的
 *   大数据虚拟滚动暂以全量渲染承接；
 * - DatePicker：kit 仅支持 date/datetime，range 型 schema 暂以单值承接；
 * - TimePicker：由 FormTimePicker（datetime）过渡承接。
 *
 * @path main\src\adapter\component\index.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { Component } from 'vue';

import type { YdBaseFormComponentType } from '@ydsz/common-ui';

import { defineComponent, h, ref } from 'vue';

import {
  ApiComponent,
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
  IconPicker,
} from '@ydsz/common-ui';
import { $t } from '@ydsz/locales';
import { showToast } from '@ydsz/notification';
import { DatePicker, Separator, YDSZInput, YDSZSelect } from '@ydsz-core/shadcn-ui';

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
 * 表单支持的组件类型集合。
 *
 * 需随业务组件库自行适配：用到的组件都应在此联合类型中声明。
 */
export type ComponentType =
  | 'ApiSelect'
  | 'ApiTreeSelect'
  | 'Checkbox'
  | 'CheckboxGroup'
  | 'DatePicker'
  | 'Divider'
  | 'IconPicker'
  | 'Input'
  | 'InputNumber'
  | 'RadioGroup'
  | 'Select'
  | 'Space'
  | 'Switch'
  | 'TimePicker'
  | 'TreeSelect'
  | 'Upload'
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
        ...ApiComponent,
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
        ...ApiComponent,
        name: 'ApiTreeSelect',
      },
      'select',
      {
        component: FormTreeSelect,
        optionsPropName: 'treeData',
      },
    ),
    Checkbox: FormCheckbox,
    CheckboxGroup: FormCheckboxGroup,
    DatePicker,
    Divider: Separator,
    IconPicker: withDefaultPlaceholder(IconPicker, 'select', {
      modelValueProp: 'model-value',
      inputComponent: YDSZInput,
    }),
    Input: withDefaultPlaceholder(YDSZInput, 'input'),
    InputNumber: withDefaultPlaceholder(FormInputNumber, 'input'),
    RadioGroup: FormRadioGroup,
    Select: YDSZSelect,
    Space: FormSpace,
    Switch: FormSwitch,
    TimePicker: FormTimePicker,
    TreeSelect: withDefaultPlaceholder(FormTreeSelect, 'select'),
    Upload: FormUpload,
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
