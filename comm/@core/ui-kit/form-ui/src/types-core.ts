/**
 * form-ui 类型定义 — 核心类型
 *
 * 从 types.ts 提取，避免单文件超过 300 行。
 *
 * 包含：
 * - 基础类型：FormLayout / BaseFormComponentType / WrapperClassType / FormItemClassType
 * - 字段配置：FormFieldOptions / FormShape / MaybeComponentPropKey / MaybeComponentProps
 * - 表单操作与渲染：FormActions / CustomRenderType / FormSchemaRuleType
 * - 联动依赖：FormItemDependencies 及其辅助类型
 *
 * @path comm/@core/ui-kit/form-ui/src/types-core.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { FieldOptions, FormContext, GenericObject } from 'vee-validate';
import type { ZodTypeAny } from 'zod';

import type { Component, HtmlHTMLAttributes } from 'vue';

/**
 * 表单项的标签排布方式。
 *
 * @remarks
 * `horizontal` 表示 label 与控件左右排列（label 宽度由 `labelWidth` 决定），
 * `vertical` 表示 label 在控件上方换行显示。窄屏下若仍用 horizontal，
 * label 会挤压控件可用宽度，移动端建议切到 vertical。
 */
export type FormLayout = 'horizontal' | 'vertical';

/**
 * 表单可用控件的类型标识。
 *
 * @remarks
 * 联合类型末尾的 `Record<never, never> & string` 是一个「保留字面量提示」的技巧：
 * 它让该类型在接受任意字符串的同时，IDE 仍能补全前面列出的内置控件名。
 * 因此适配器注册的自定义组件名可以直接传入而无需扩展本类型，
 * 代价是**拼写错误不会在编译期报错**，只会在运行时表现为控件渲染不出来。
 */
export type BaseFormComponentType =
  | 'DefaultButton'
  | 'PrimaryButton'
  | 'YDSZCheckbox'
  | 'YDSZInput'
  | 'YDSZInputPassword'
  | 'YDSZPinInput'
  | 'YDSZSelect'
  | (Record<never, never> & string);

type Breakpoints = '2xl:' | '3xl:' | '' | 'lg:' | 'md:' | 'sm:' | 'xl:';

type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/**
 * 表单外层栅格容器的 class 类型，用于控制整个表单分几列。
 *
 * @remarks
 * 通过模板字面量类型约束出 `grid-cols-1` ~ `grid-cols-13` 及其带断点前缀的形式
 * （如 `md:grid-cols-2`），使 IDE 能直接补全合法栅格值，避免手写 typo 导致样式静默失效。
 * 同样保留了任意字符串的兜底分支，可传入项目自定义 class，但会失去校验能力。
 */
export type WrapperClassType =
  | `${Breakpoints}grid-cols-${GridCols}`
  | (Record<never, never> & string);

/**
 * 单个表单项在栅格中的占位 class 类型。
 *
 * @remarks
 * 在 {@link WrapperClassType} 的基础上追加了 `cols-span-*`、`cols-start-*`、`cols-end-*`
 * 三类定位能力，用于让某个字段跨列或对齐到指定列，典型场景是备注、富文本这类需要独占整行的字段
 * （`cols-span-full`）。
 *
 * 注意这里的 class 名不带 Tailwind 原生的 `col-` 前缀写法，是项目内约定的样式名，
 * 需要与表单渲染层的样式表配套使用，直接照搬 Tailwind 文档中的类名不会生效。
 */
export type FormItemClassType =
  | `${Breakpoints}cols-end-${'auto' | GridCols}`
  | `${Breakpoints}cols-span-${'auto' | 'full' | GridCols}`
  | `${Breakpoints}cols-start-${'auto' | GridCols}`
  | (Record<never, never> & string)
  | WrapperClassType;

/**
 * 透传给 vee-validate `useField` 的字段级配置。
 *
 * @remarks
 * 在 vee-validate 原生 `FieldOptions` 之外显式补充了四个校验时机开关，
 * 用于按字段粒度控制「何时触发校验」：过早校验（如 input 即校验）会让用户刚开始输入就看到红字，
 * 体验差；过晚（仅 submit）又难以即时纠错。默认策略由表单层统一给定，此处用于个别字段做覆盖。
 *
 * 整体被 `Partial` 包裹，任意项均可省略，省略时回落到 vee-validate 或表单层的默认行为。
 */
export type FormFieldOptions = Partial<
  FieldOptions & {
    validateOnBlur?: boolean;
    validateOnChange?: boolean;
    validateOnInput?: boolean;
    validateOnModelUpdate?: boolean;
  }
>;

/**
 * 从表单 schema 中抽取出的字段「形状」描述，供初始值构造与校验器生成使用。
 *
 * @remarks
 * 它是 {@link FormSchema} 的精简投影：只保留生成 initialValues 和 zod schema 所必需的信息，
 * 剥离了组件、label 等渲染相关字段，避免渲染层改动影响数据层逻辑。
 */
export interface FormShape {
  /**
   * 默认值
   *
   * @remarks
   * 表单初始化及 reset 后回填的值。未设置时字段初始为 `undefined`，
   * 对于 Select 等受控组件可能触发「非受控转受控」告警，建议显式给出。
   * 使用 unknown 类型以支持任意表单值类型。
   */
  default?: unknown;
  /**
   * 字段名
   *
   * @remarks
   * 对应表单数据对象中的键，支持 `a.b` 形式的嵌套路径，必须在同一表单内唯一。
   */
  fieldName: string;
  /**
   * 是否必填
   *
   * @remarks
   * 仅代表由 `rules` 简写（如 `'required'`）推导出的必填态，用于渲染 label 前的星号标记；
   * 真正的校验仍以 `rules` 为准，二者不同步时以 `rules` 的结果为最终校验依据。
   */
  required?: boolean;
  /**
   * 该字段的 zod 校验规则；为空表示不参与校验，提交时原样透传。
   */
  rules?: ZodTypeAny;
}

/**
 * 可传给表单控件的 prop 名集合。
 *
 * @remarks
 * 由于控件是运行时动态决定的，无法静态得知其确切 props，这里以「原生 HTML 属性 +
 * 三个最高频的业务 prop（options / placeholder / title）」作为补全提示的基础，
 * 再用任意字符串兜底以容纳各 UI 库的私有 prop。
 */
export type MaybeComponentPropKey =
  | 'options'
  | 'placeholder'
  | 'title'
  | keyof HtmlHTMLAttributes
  | (Record<never, never> & string);

/**
 * 传递给具体表单控件的 props 对象。
 *
 * @remarks
 * 值类型为 `unknown` 是刻意的——控件类型直到运行时才确定，无法做静态约束。
 * 代价是这里**完全没有类型保护**，prop 名或值写错只会在运行时表现为控件行为异常，
 * 编写时建议对照目标控件的文档。
 */
export type MaybeComponentProps = { [K in MaybeComponentPropKey]?: unknown };

/**
 * 表单操作句柄，即 vee-validate 的表单上下文。
 *
 * @remarks
 * 起别名而非直接暴露 vee-validate 类型，是为了收敛外部依赖：
 * 后续若更换校验库，只需改动此处的类型指向，依赖方（如联动回调的第二个入参）无需调整。
 * 通过它可以读写字段值、手动触发校验、设置错误信息等。
 */
export type FormActions = FormContext<GenericObject>;

/**
 * 可自定义渲染的内容类型，用于 label、help、description、suffix 等插槽位。
 *
 * @remarks
 * 传字符串时按纯文本渲染；传函数时**每次重渲染都会被调用**，
 * 因此函数内不要做耗时计算或产生副作用。函数可返回组件（渲染为节点）或字符串。
 *
 * 注意：字符串分支不做 HTML 转义处理之外的加工，需要富文本请返回组件而非拼接 HTML 串。
 */
export type CustomRenderType = (() => Component | string) | string;

/**
 * 字段校验规则的声明形式。
 *
 * @remarks
 * 支持三种写法，按表达能力递增：
 * 1. 内置简写字符串 `'required'` / `'selectRequired'`——由适配器在
 *    {@link YDSZFormAdapterOptions.defineRules} 中注册具体实现，二者区别在于错误文案
 *    （「请输入」vs「请选择」）；
 * 2. 任意自定义规则名字符串——需适配器提前注册，未注册时该字段校验被静默跳过；
 * 3. zod schema——直接给出完整校验逻辑，表达能力最强。
 *
 * 传 `null` 表示显式声明「无校验」，语义上区别于 `undefined`（未配置，可能被上层默认配置覆盖）。
 */
export type FormSchemaRuleType =
  | 'required'
  | 'selectRequired'
  | null
  | (Record<never, never> & string)
  | ZodTypeAny;

type FormItemDependenciesCondition<T = boolean | PromiseLike<boolean>> = (
  // 表单值为 Partial 类型，值类型为 unknown 以支持任意表单结构
  value: Partial<Record<string, unknown>>,
  actions: FormActions,
) => T;

type FormItemDependenciesConditionWithRules = (
  // 表单值为 Partial 类型，值类型为 unknown 以支持任意表单结构
  value: Partial<Record<string, unknown>>,
  actions: FormActions,
) => FormSchemaRuleType | PromiseLike<FormSchemaRuleType>;

type FormItemDependenciesConditionWithProps = (
  // 表单值为 Partial 类型，值类型为 unknown 以支持任意表单结构
  value: Partial<Record<string, unknown>>,
  actions: FormActions,
) => MaybeComponentProps | PromiseLike<MaybeComponentProps>;

/**
 * 表单项联动配置：声明当前字段如何随其他字段的值变化而改变。
 *
 * @remarks
 * 所有联动回调都以「当前全量表单值 + 表单操作句柄」为入参，返回目标状态，
 * 由渲染层负责应用。回调**仅在 {@link triggerFields} 中列出的字段发生变化时执行**，
 * 而非任意字段变化都执行——漏配 `triggerFields` 是联动不生效的最常见原因。
 *
 * 回调均支持返回 Promise（可发起远程校验/查询），但要注意：
 * 多次快速变更会并发触发，返回顺序不保证与触发顺序一致，
 * 存在竞态时需在回调内自行做防抖或版本号校验。
 */
export interface FormItemDependencies {
  /**
   * 动态计算控件 props，返回值会与静态 `componentProps` 合并，同名键以此处结果为准。
   *
   * @remarks
   * 典型用途是级联下拉：上级选中后在此拉取并返回下级的 `options`。
   */
  componentProps?: FormItemDependenciesConditionWithProps;
  /**
   * 是否禁用。可传静态布尔值，或按表单值动态计算的函数。
   *
   * @remarks
   * 禁用只影响交互，字段值仍会随表单一并提交。若希望值也一并排除，请改用 {@link if}。
   */
  disabled?: boolean | FormItemDependenciesCondition;
  /**
   * 是否渲染该字段（条件为假时从 DOM 中移除）。
   *
   * @remarks
   * 与 {@link show} 的关键差异：`if` 为假时字段被销毁，其**值会从表单数据中移除**，
   * 也不再参与校验；再次显示时恢复为默认值，原先输入的内容丢失。
   * 需要保留用户已填内容的场景请用 `show`。
   */
  if?: boolean | FormItemDependenciesCondition;
  /**
   * 动态计算是否必填，返回 `true` 时显示必填标记并施加必填校验。
   */
  required?: FormItemDependenciesCondition;
  /**
   * 动态计算校验规则，返回值语义同 {@link FormSchemaRuleType}。
   *
   * @remarks
   * 返回结果会**整体替换**静态 `rules` 而非合并；返回 `null` 可临时取消该字段的校验。
   */
  rules?: FormItemDependenciesConditionWithRules;
  /**
   * 是否显示（通过 CSS 隐藏，DOM 仍保留）。
   *
   * @remarks
   * 隐藏期间字段值**依旧保留且参与校验**——若隐藏的是必填字段，会出现「校验不通过却看不到错误项」
   * 的情况，此时应改用 {@link if} 或同步放开必填。
   */
  show?: boolean | FormItemDependenciesCondition;
  /**
   * 通用副作用钩子：只要 {@link triggerFields} 中任一字段变化就会执行，无返回值。
   *
   * @remarks
   * 用于上述声明式能力覆盖不到的场景，例如联动清空下级字段、按选项拉取远程数据。
   * 由于是纯副作用，回调内通过 `actions` 修改其他字段可能再次触发联动，
   * 需自行避免形成循环。
   */
  trigger?: FormItemDependenciesCondition<void>;
  /**
   * 触发字段
   *
   * @remarks
   * 依赖的字段名列表，是本对象内所有回调的**唯一触发源**，必填。
   * 只有这些字段的值变化才会重新计算联动；填写的是字段名而非 label。
   */
  triggerFields: string[];
}
