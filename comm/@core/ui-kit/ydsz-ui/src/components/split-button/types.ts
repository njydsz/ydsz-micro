/**
 * SplitButton（分裂按钮）Props / Emits / 关联类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\split-button\types.ts
 * @author ydsz-team
 * @since 26.10.12
 */

/** 单个下拉动作定义 */
export interface SplitButtonAction {
  /** 动作显示文本 */
  label: string
  /** 动作图标（iconify class 名） */
  icon?: string
  /** 点击回调 */
  command?: () => void
  /** 是否禁用该动作 */
  disabled?: boolean
  /** 唯一标识，便于外部追踪 */
  key?: string
}

/** SplitButton 组件 props */
export interface YdSplitButtonProps {
  /** 主按钮文案 */
  label?: string
  /** 主按钮图标（iconify class 名） */
  icon?: string
  /** 下拉动作列表 */
  actions: SplitButtonAction[]
  /** 整体禁用 */
  disabled?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 视觉变体 */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** 下拉箭头图标（iconify class 名） */
  dropdownIcon?: string
}

/** SplitButton 组件 emits */
export interface SplitButtonEmits {
  /** 任一动作被点击（含主按钮） */
  (e: 'action', action: SplitButtonAction): void
}
