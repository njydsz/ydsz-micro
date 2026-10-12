/**
 * InputTags（标签输入）Props / Emits。
 *
 * <p>交互型标签输入组件：在输入框内输入内容后按分隔符/Enter/Blur 转为 tag，
 * 支持 v-model、最大数量限制、重复控制、正则校验、键盘删除等。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\input-tags\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

/** InputTags 尺寸档位 */
export type InputTagsSize = 'sm' | 'md' | 'lg';

/** YdInputTags 组件 Props */
export interface YdInputTagsProps {
  /** 受控标签列表（v-model） */
  modelValue?: string[];
  /** 输入框占位文本 */
  placeholder?: string;
  /** 最大标签数量，超出后输入框禁用 */
  maxTags?: number;
  /** 是否允许重复标签，默认 false */
  allowDuplicates?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 分隔符，默认 ',' */
  separator?: string;
  /** 自定义校验正则，未通过时显示 invalidMessage */
  pattern?: RegExp;
  /** 校验失败时的提示文案 */
  invalidMessage?: string;
  /** 尺寸档位 */
  size?: InputTagsSize;
}

/* ============================================================ */
/* Emits                                                          */
/* ============================================================ */

/** YdInputTags 组件 Emits */
export interface YdInputTagsEmits {
  /** v-model 更新 */
  (e: 'update:modelValue', value: string[]): void;
  /** 键盘按下事件透传 */
  (e: 'keydown', event: KeyboardEvent): void;
  /** 标签新增 */
  (e: 'tag-add', tag: string, tags: string[]): void;
  /** 标签移除 */
  (e: 'tag-remove', tag: string, tags: string[]): void;
}
