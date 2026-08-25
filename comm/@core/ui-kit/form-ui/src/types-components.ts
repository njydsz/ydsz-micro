/**
 * form-ui 类型定义 — 组件配置与渲染
 *
 * 从 types.ts 提取，避免单文件超过 300 行。
 *
 * 包含：
 * - FormRenderProps：表单渲染器 props
 * - ActionButtonOptions：操作按钮配置
 * - YDSZFormProps：业务侧表单组件 props
 * - YDSZFormAdapterOptions：适配器全局初始化选项
 *
 * @path comm/@core/ui-kit/form-ui/src/types-components.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { FormContext, GenericObject } from 'vee-validate';

import type { ClassType, MaybeComputedRef } from '@YDSZ-core/typings';

import type { YDSZButtonProps } from '@YDSZ-core/shadcn-ui';

import type {
  ArrayToStringFields,
  BaseFormComponentType,
  FieldMappingTime,
  FormLayout,
  FormSchema,
  WrapperClassType,
} from './types-schema';

// 重新导出依赖类型以保持向后兼容性
export type {
  ArrayToStringFields,
  FieldMappingTime,
  FormSchema,
} from './types-schema';

/** 从 types-core 补充需要的类型 */
import type { FormCommonConfig } from './types-schema';

/**
 * 表单渲染器（FormRender）的 props，负责「把 schema 画成 DOM」这一层。
 *
 * @remarks
 * 它是纯渲染层，**不持有表单实例**：`form` 由外部传入，因此同一份 schema 可被多个
 * 表单实例复用。与之相对，{@link YDSZFormProps} 是面向业务的上层封装，
 * 会自行创建表单实例并屏蔽 `componentMap` 等底层细节。
 * 业务代码通常不直接使用本类型。
 */
export interface FormRenderProps<
  T extends BaseFormComponentType = BaseFormComponentType,
> {
  /**
   * 表单字段数组映射字符串配置 默认使用","
   */
  arrayToStringFields?: ArrayToStringFields;
  /**
   * 是否展开，在showCollapseButton=true下生效
   */
  collapsed?: boolean;
  /**
   * 折叠时保持行数
   * @default 1
   */
  collapsedRows?: number;
  /**
   * 是否触发resize事件
   * @default false
   */
  collapseTriggerResize?: boolean;
  /**
   * 表单项通用后备配置，当子项目没配置时使用这里的配置，子项目配置优先级高于此配置
   */
  commonConfig?: FormCommonConfig;
  /**
   * 紧凑模式（移除表单每一项底部为校验信息预留的空间）
   */
  compact?: boolean;
  /**
   * 组件v-model事件绑定
   */
  componentBindEventMap?: Partial<Record<BaseFormComponentType, string>>;
  /**
   * 组件集合
   */
  componentMap: Record<BaseFormComponentType, Component>;
  /**
   * 表单字段映射到时间格式
   */
  fieldMappingTime?: FieldMappingTime;
  /**
   * 表单实例
   */
  form?: FormContext<GenericObject>;
  /**
   * 表单项布局
   */
  layout?: FormLayout;
  /**
   * 表单定义
   */
  schema?: FormSchema<T>[];

  /**
   * 是否显示展开/折叠
   */
  showCollapseButton?: boolean;
  /**
   * 格式化日期
   */

  /**
   * 表单栅格布局
   * @default "grid-cols-1"
   */
  wrapperClass?: WrapperClassType;
}

import type { Component } from 'vue';

/**
 * 表单操作按钮（提交 / 重置）的配置。
 *
 * @remarks
 * 继承 {@link YDSZButtonProps}，故按钮的尺寸、类型、loading 等原生能力均可直接透传；
 * 索引签名的存在意味着**多余的属性不会被类型系统拦截**，会原样透传到按钮组件，
 * 拼错 prop 名时不会有编译错误，只表现为配置不生效。
 * 使用 unknown 作为索引签名类型以支持任意透传属性。
 */
export interface ActionButtonOptions extends YDSZButtonProps {
  [key: string]: unknown;
  /**
   * 按钮文案。支持传 ref 或 getter，以便在切换语言时自动更新；
   * 传普通字符串则固定不变，国际化场景下会出现切换语言后文案不刷新的问题。
   */
  content?: MaybeComputedRef<string>;
  /**
   * 是否显示该按钮，默认显示。设为 `false` 时按钮不渲染，
   * 与设置 `disabled` 的区别是后者仍占据布局空间。
   */
  show?: boolean;
}

/**
 * 业务侧使用的表单组件 props，是 form-ui 对外的主入口类型。
 *
 * @remarks
 * 相较 {@link FormRenderProps}，此处 `Omit` 掉了 `componentMap`、`componentBindEventMap`
 * 与 `form` 三项：前两者由适配器（见 {@link YDSZFormAdapterOptions}）在应用启动时全局注册，
 * 后者由组件内部创建，业务无需也不应关心，从而让调用方只聚焦「字段长什么样、提交做什么」。
 *
 * 在此基础上补充了操作按钮布局与提交/重置/值变更回调等业务能力。
 */
export interface YDSZFormProps<
  T extends BaseFormComponentType = BaseFormComponentType,
> extends Omit<
  FormRenderProps<T>,
  'componentBindEventMap' | 'componentMap' | 'form'
> {
  /**
   * 操作按钮是否反转（提交按钮前置）
   */
  actionButtonsReverse?: boolean;
  /**
   * 操作按钮组的样式
   * newLine: 在新行显示。rowEnd: 在行内显示，靠右对齐（默认）。inline: 使用grid默认样式
   */
  actionLayout?: 'inline' | 'newLine' | 'rowEnd';
  /**
   * 操作按钮组显示位置，默认靠右显示
   */
  actionPosition?: 'center' | 'left' | 'right';
  /**
   * 表单操作区域class
   */
  actionWrapperClass?: ClassType;
  /**
   * 表单字段数组映射字符串配置 默认使用","
   */
  arrayToStringFields?: ArrayToStringFields;

  /**
   * 表单字段映射
   */
  fieldMappingTime?: FieldMappingTime;
  /**
   * 表单重置回调
   */
  handleReset?: HandleResetFn;
  /**
   * 表单提交回调
   */
  handleSubmit?: HandleSubmitFn;
  /**
   * 表单值变化回调
   * 使用 Record<string, unknown> 支持任意表单结构。
   */
  handleValuesChange?: (
    values: Record<string, unknown>,
    fieldsChanged: string[],
  ) => void;
  /**
   * 重置按钮参数
   */
  resetButtonOptions?: ActionButtonOptions;

  /**
   * 验证失败时是否自动滚动到第一个错误字段
   * @default false
   */
  scrollToFirstError?: boolean;

  /**
   * 是否显示默认操作按钮
   * @default true
   */
  showDefaultActions?: boolean;

  /**
   * 提交按钮参数
   */
  submitButtonOptions?: ActionButtonOptions;

  /**
   * 是否在字段值改变时提交表单
   * @default false
   */
  submitOnChange?: boolean;

  /**
   * 是否在回车时提交表单
   * @default false
   */
  submitOnEnter?: boolean;
}

import type { HandleResetFn, HandleSubmitFn } from './types-schema';

/**
 * 表单适配器的全局初始化选项，用于把 form-ui 对接到具体的 UI 组件库。
 *
 * @remarks
 * 由 `setupYDSZForm` 在应用启动阶段消费，**全局只应配置一次**。
 * 其存在意义是让 form-ui 与具体 UI 库解耦：不同组件库的 v-model prop 名、
 * 空值表示、必填判定方式各不相同，这些差异全部在此收敛。
 */
export interface YDSZFormAdapterOptions<
  T extends BaseFormComponentType = BaseFormComponentType,
> {
  /**
   * 控件行为的适配配置。
   */
  config?: {
    /**
     * 默认的 v-model prop 名，未在 `modelPropNameMap` 中特别指定的控件都用它，
     * 通常为 `'modelValue'`；对接 Vue 2 风格组件库时可能需要改为 `'value'`。
     */
    baseModelPropName?: string;
    /**
     * 是否全局禁止监听控件的 change 事件。
     *
     * @remarks
     * 部分组件库的 change 与 v-model 更新重复触发，会导致校验执行两次，
     * 此开关用于规避；关闭后依赖 change 才能更新的控件将无法正常取值。
     */
    disabledOnChangeListener?: boolean;
    /**
     * 是否全局禁止监听控件的 input 事件，动机同 `disabledOnChangeListener`，
     * 主要用于避免输入过程中的高频校验。
     */
    disabledOnInputListener?: boolean;
    /**
     * 清空字段时写入的「空值」。
     *
     * @remarks
     * 该值必须与 UI 库的约定一致，否则清空后控件仍显示旧值或出现受控告警：
     * 多数库用 `undefined`，naive-ui 等则要求 `null`。
     */
    emptyStateValue?: null | undefined;
    /**
     * 按控件类型覆盖 v-model prop 名，用于处理个别不遵循通用约定的控件
     * （如 Checkbox 用 `checked`、Upload 用 `fileList`）。
     */
    modelPropNameMap?: Partial<Record<T, string>>;
  };
  /**
   * 内置校验规则简写的具体实现。
   *
   * @remarks
   * 对应 {@link FormSchemaRuleType} 中的 `'required'` / `'selectRequired'` 字符串写法。
   * 若不注册，schema 中使用这些简写的字段将**不会产生任何校验**且无告警。
   */
  defineRules?: {
    /**
     * 输入类控件的必填校验。返回 `true` 表示通过，返回字符串表示不通过并作为错误文案。
     * 参数类型来自 vee-validate 的 RuleOptions 定义，使用 unknown 以兼容各种校验场景。
     */
    required?: (
      value: unknown,
      params: unknown,
      // 兼容 vee-validate 的校验上下文类型
      ctx: Record<string, unknown>,
    ) => boolean | string;
    /**
     * 选择类控件的必填校验。
     *
     * @remarks
     * 与 `required` 分开是因为二者的「空」判定不同：选择类的空值可能是 `[]` 或 `null`，
     * 直接套用输入类的非空字符串判断会误判；错误文案也需为「请选择」。
     */
    selectRequired?: (
      value: unknown,
      params: unknown,
      // 兼容 vee-validate 的校验上下文类型
      ctx: Record<string, unknown>,
    ) => boolean | string;
  };
}
