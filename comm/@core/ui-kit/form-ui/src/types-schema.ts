/**
 * form-ui 类型定义 — Schema 与字段配置
 *
 * 从 types.ts 提取，避免单文件超过 300 行。
 *
 * 包含：
 * - ComponentProps：组件 props 的静态/动态形式
 * - FormCommonConfig：表单项的通用后备配置
 * - 表单回调：HandleSubmitFn / HandleResetFn
 * - 字段映射：FieldMappingTime / ArrayToStringFields
 * - FormSchema / FormFieldProps：表单项声明
 *
 * @path comm/@core/ui-kit/form-ui/src/types-schema.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { GenericObject } from 'vee-validate';

import type { Component } from 'vue';

import type { YDSZButtonProps } from '@YDSZ-core/shadcn-ui';

import type {
  BaseFormComponentType,
  CustomRenderType,
  FormActions,
  FormFieldOptions,
  FormItemDependencies,
  FormSchemaRuleType,
  MaybeComponentProps,
} from './types-core';

type RenderComponentContentType = (
  // 表单值为 Partial 类型，值类型为 unknown 以支持任意表单结构
  value: Partial<Record<string, unknown>>,
  api: FormActions,
) => Record<string, unknown>;

/**
 * 表单项的通用后备配置。
 *
 * @remarks
 * 作用是消除重复：整表统一的 label 宽度、禁用态、样式等在此声明一次即可，
 * 无需在每个 {@link FormSchema} 里复写。
 *
 * **优先级规则**：字段级配置 &gt; 本对象配置。合并按属性逐项覆盖（浅合并），
 * 因此字段级只要声明了某个 key，本对象中同名 key 的值即完全失效，不做深度合并。
 *
 * 修改本对象会影响表单内**所有**字段，属于全局性变更，谨慎用于个别字段的特殊需求。
 */
export interface FormCommonConfig {
  /**
   * 在Label后显示一个冒号
   */
  colon?: boolean;
  /**
   * 所有表单项的props
   */
  componentProps?: ComponentProps;
  /**
   * 所有表单项的控件样式
   */
  controlClass?: string;
  /**
   * 所有表单项的禁用状态
   * @default false
   */
  disabled?: boolean;
  /**
   * 是否禁用所有表单项的change事件监听
   * @default true
   */
  disabledOnChangeListener?: boolean;
  /**
   * 是否禁用所有表单项的input事件监听
   * @default true
   */
  disabledOnInputListener?: boolean;
  /**
   * 所有表单项的空状态值,默认都是undefined，naive-ui的空状态值是null
   */
  emptyStateValue?: null | undefined;
  /**
   * 所有表单项的控件样式
   * @default {}
   */
  formFieldProps?: FormFieldOptions;
  /**
   * 所有表单项的栅格布局，支持函数形式
   * @default ""
   */
  formItemClass?: (() => string) | string;
  /**
   * 隐藏所有表单项label
   * @default false
   */
  hideLabel?: boolean;
  /**
   * 是否隐藏必填标记
   * @default false
   */
  hideRequiredMark?: boolean;
  /**
   * 所有表单项的label样式
   * @default ""
   */
  labelClass?: string;
  /**
   * 所有表单项的label宽度
   */
  labelWidth?: number;
  /**
   * 所有表单项的model属性名
   * @default "modelValue"
   */
  modelPropName?: string;
  /**
   * 所有表单项的wrapper样式
   */
  wrapperClass?: string;
}

type ComponentProps =
  | ((
      // 表单值为 Partial 类型，值类型为 unknown 以支持任意表单结构
      value: Partial<Record<string, unknown>>,
      actions: FormActions,
    ) => MaybeComponentProps)
  | MaybeComponentProps;

/**
 * 表单提交回调。
 *
 * @remarks
 * **仅在校验全部通过后**才会被调用，因此回调内无需再做必填等基础校验。
 * 入参是经过 `fieldMappingTime`、`arrayToStringFields` 等后处理的最终值，
 * 而非控件的原始值。
 * 使用 Record<string, unknown> 支持任意表单结构。
 *
 * 返回 Promise 时表单会等待其 resolve，期间提交按钮保持 loading，可借此防重复提交；
 * 若回调内抛出异常或 Promise reject，loading 状态由表单负责结束，但**不会自动提示错误**，
 * 需调用方自行捕获处理。
 *
 * @param values - 经过归一化处理的表单值
 */
export type HandleSubmitFn = (
  values: Record<string, unknown>,
) => Promise<void> | void;

/**
 * 表单重置回调。
 *
 * @remarks
 * 在表单值**已经被重置为默认值之后**触发，因此入参是重置后的值而非重置前的旧值；
 * 需要旧值请在回调外自行缓存。常用于重置后重新拉取列表数据。
 * 使用 Record<string, unknown> 支持任意表单结构。
 *
 * @param values - 重置完成后的表单值
 */
export type HandleResetFn = (
  values: Record<string, unknown>,
) => Promise<void> | void;

/**
 * 区间时间字段的拆分映射规则。
 *
 * @remarks
 * 用于解决「UI 上是一个日期区间选择器，接口却要求两个独立字段」的常见错配。
 * 每条规则是一个三元组：
 * 1. 第 0 项：区间控件绑定的源字段名，其值形如 `[start, end]`；
 * 2. 第 1 项：拆分后的两个目标字段名 `[startFieldName, endFieldName]`；
 * 3. 第 2 项（可选）：格式化方式——传字符串按该 dayjs 模板格式化两端；
 *    传 `[startFormat, endFormat]` 分别指定两端模板（如开始取 `00:00:00`、结束取 `23:59:59`）；
 *    传函数则完全自定义转换；传 `null` 或省略表示不格式化，原样输出。
 *
 * 提交时源字段会被**从结果中移除**，只保留拆分出的两个目标字段。
 * 源字段为空时，两个目标字段会被置空而非省略。
 */
export type FieldMappingTime = [
  string,
  [string, string],
  (
    | ((value: unknown, fieldName: string) => unknown)
    | [string, string]
    | null
    | string
  )?,
][];

/**
 * 需要在提交时把数组值拼接为字符串的字段配置。
 *
 * @remarks
 * 面向后端只接受逗号分隔字符串、前端控件却产出数组的场景（多选、级联选择器等）。
 * 支持三种书写形式，可混用：
 * - `'fieldName'`：单字段，使用默认分隔符 `,`；
 * - `['a', 'b', '|']`：简单数组形式，**最后一个元素若被识别为分隔符则不作为字段名**，
 *   因此当字段名本身可能与分隔符混淆时，请改用下面的嵌套形式以消除歧义；
 * - `[['a', 'b'], '|']`：嵌套形式，字段名与分隔符边界明确，推荐使用。
 *
 * 转换只在提交阶段发生，不影响表单内部的响应式值，回显时仍需自行把字符串拆回数组。
 */
export type ArrayToStringFields = Array<
  | [string[], string?] // 嵌套数组格式，可选分隔符
  | string // 单个字段，使用默认分隔符
  | string[] // 简单数组格式，最后一个元素可以是分隔符
>;

/**
 * 单个表单项的完整声明，是「配置驱动表单」的最小描述单元。
 *
 * @remarks
 * 继承 {@link FormCommonConfig}，因此可在字段级覆盖任意通用配置，覆盖为浅合并。
 * 一份 `FormSchema[]` 即可完整描述一张表单的结构、校验与联动，
 * 渲染顺序与数组顺序一致。
 */
export interface FormSchema<
  T extends BaseFormComponentType = BaseFormComponentType,
> extends FormCommonConfig {
  /**
   * 组件
   *
   * @remarks
   * 可传已注册的控件名（走 `componentMap` 查表），也可直接传入 Vue 组件对象。
   * 传字符串时若名称未注册，该字段会渲染为空白且不报错，排查时优先核对注册表。
   */
  component: Component | T;
  /**
   * 组件参数
   *
   * @remarks
   * 传对象为静态 props；传函数则可依据当前表单值动态计算，
   * 函数在每次表单值变化时都会执行，应保持轻量且无副作用。
   */
  componentProps?: ComponentProps;
  /**
   * 默认值
   *
   * @remarks
   * 同时作为表单初始值与 reset 后的回填值。注意它优先级高于控件自身的默认值。
   * 使用 unknown 类型以支持任意表单值类型。
   */
  defaultValue?: unknown;
  /**
   * 依赖
   *
   * @remarks
   * 声明本字段随其他字段变化的联动行为，详见 {@link FormItemDependencies}。
   */
  dependencies?: FormItemDependencies;
  /**
   * 描述
   *
   * @remarks
   * 渲染在控件下方的辅助说明文字，常驻显示，适合放填写规则；
   * 与 {@link help} 的区别是后者通常为悬浮提示，不占布局空间。
   */
  description?: CustomRenderType;
  /**
   * 字段名
   *
   * @remarks
   * 表单数据对象中的键，支持 `a.b` 嵌套路径，同一表单内必须唯一；
   * 重复会导致两个控件绑定同一个值而相互覆盖。
   */
  fieldName: string;
  /**
   * 帮助信息
   *
   * @remarks
   * 一般渲染为 label 旁的问号图标 + 悬浮气泡，不占据布局空间。
   */
  help?: CustomRenderType;
  /**
   * 表单项
   *
   * @remarks
   * 字段标签内容。省略时不渲染 label，但仍会占据 label 列的宽度以保持栅格对齐；
   * 需要完全不占位请配合 `hideLabel`。
   */
  label?: CustomRenderType;
  /**
   * 自定义控件内部插槽内容。
   *
   * @remarks
   * 返回一个「插槽名 → 渲染函数」的对象，用于向控件内部传递具名插槽，
   * 例如给 Select 定制 option 渲染。返回值在每次表单值变化时重新计算。
   */
  // 自定义组件内部渲染
  renderComponentContent?: RenderComponentContentType;
  /**
   * 字段规则
   *
   * @remarks
   * 静态校验规则，可被 `dependencies.rules` 动态覆盖，取值语义见 {@link FormSchemaRuleType}。
   */
  rules?: FormSchemaRuleType;
  /**
   * 后缀
   *
   * @remarks
   * 渲染在控件右侧的附加内容，如单位、快捷操作按钮。它位于控件外部，
   * 不会成为控件的一部分，因此不影响控件取值。
   */
  suffix?: CustomRenderType;
}

/**
 * 传递给单个字段渲染组件的 props。
 *
 * @remarks
 * 在 {@link FormSchema} 基础上追加了一个**已解析完成**的 `required` 标记：
 * schema 中的必填态可能来自 `rules` 简写或 `dependencies.required` 动态计算，
 * 渲染层不应重复推导，而是直接消费此处的结果。
 */
export interface FormFieldProps extends FormSchema {
  /**
   * 该字段当前是否必填，由上层综合静态 rules 与动态依赖计算得出，仅用于渲染必填标记。
   */
  required?: boolean;
}
