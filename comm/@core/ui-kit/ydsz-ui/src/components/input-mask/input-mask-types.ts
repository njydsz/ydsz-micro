/**
 * YdInputMask 格式化输入组件的类型定义。
 *
 * 对标 PrimeVue InputMask：通过 mask 模板约束输入格式，
 * 掩码字符 9 = 数字、a = 字母、* = 字母数字，其余字符视为字面量。
 *
 * @module primitives/input-mask
 * @author ydsz-team
 * @since 5.6.0
 */

/** 掩码模板字符类型 */
export type MaskTokenType = '9' | 'a' | '*';

/** 组件属性 */
export interface YdInputMaskProps {
  /** 格式化模板
   * 9 = 数字, a = 字母, * = 字母数字
   * 例: "9999-9999-9999" (银行卡), "(999) 999-9999" (电话), "999.999.999.999" (IP) */
  mask: string;
  /** 是否输出未掩码的纯值（去除字面量占位符），默认 false */
  unmask?: boolean;
  /** 占位符字符，默认 "_" */
  placeholderChar?: string;
  /** 是否清除不符合格式的尾部，默认 true */
  autoClear?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 变体 */
  variant?: 'default' | 'filled' | 'underlined';
  /** 自定义类名 */
  class?: any;
  /** input 类型 */
  type?: string;
  /** 是否只读 */
  readonly?: boolean;
  /** 自动聚焦 */
  autofocus?: boolean;
  /** 占位符文本 */
  placeholder?: string;
}

/** 内部解析出的掩码 token */
export interface MaskToken {
  /** 字符 */
  char: string;
  /** 是否为掩码位（9 / a / *） */
  isEditable: boolean;
  /** 该位期望的正则校验 */
  pattern?: RegExp;
}
