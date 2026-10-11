/**
 * ARIA 角色与属性映射表 —— 供 axe-core 审计与 Vitest 单元测试引用。
 *
 * 符合 WAI-ARIA 1.2 + WCAG 2.2 AA 规范。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/a11y/aria-role-map.ts
 * @author ydsz-team
 * @since 26.10.10
 */

/** 交互角色分类 */
export type AriaRoleCategory = 'widget' | 'structure' | 'landmark' | 'window' | 'liveRegion'

/** 组件 ARIA 契约定义 */
export interface AriaContract {
  role: string
  requiredAttrs?: string[]
  optionalAttrs?: string[]
  keyboardInteractions?: string[]
  category: AriaRoleCategory
}

export const ARIA_ROLE_CONTRACTS: Record<string, AriaContract> = {
  YdAccordion: { role: 'region', requiredAttrs: ['aria-labelledby'], category: 'structure' },
  YdAlertDialog: { role: 'alertdialog', requiredAttrs: ['aria-modal', 'aria-labelledby', 'aria-describedby'], keyboardInteractions: ['Escape'], category: 'window' },
  YdCheckbox: { role: 'checkbox', requiredAttrs: ['aria-checked'], category: 'widget' },
  YdDialog: { role: 'dialog', requiredAttrs: ['aria-modal', 'aria-labelledby'], keyboardInteractions: ['Escape'], category: 'window' },
  YdMenu: { role: 'menu', requiredAttrs: ['aria-orientation'], keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Space', 'Escape'], category: 'widget' },
  YdPagination: { role: 'navigation', category: 'landmark' },
  YdPopover: { role: 'dialog', optionalAttrs: ['aria-labelledby', 'aria-describedby'], keyboardInteractions: ['Escape'], category: 'widget' },
  YdProgress: { role: 'progressbar', requiredAttrs: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'], category: 'widget' },
  YdRadioGroup: { role: 'radiogroup', requiredAttrs: ['aria-labelledby'], category: 'widget' },
  YdScrollArea: { role: 'scrollbar', requiredAttrs: ['aria-controls', 'aria-valuenow', 'aria-orientation'], category: 'widget' },
  YdSelect: { role: 'combobox', requiredAttrs: ['aria-expanded', 'aria-haspopup'], keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Escape', 'Home', 'End'], category: 'widget' },
  YdSlider: { role: 'slider', requiredAttrs: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'], keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'], category: 'widget' },
  YdSwitch: { role: 'switch', requiredAttrs: ['aria-checked'], category: 'widget' },
  YdTabs: { role: 'tablist', requiredAttrs: ['aria-orientation'], keyboardInteractions: ['ArrowLeft', 'ArrowRight', 'Home', 'End'], category: 'structure' },
  YdTooltip: { role: 'tooltip', category: 'widget' },
  YdTree: { role: 'tree', category: 'structure' },
}

export const ARIA_RTL_LANGUAGES: string[] = ['ar-SA', 'fa-IR', 'he-IL']

export const ARIA_KEYBOARD_KEYS = {
  activation: ['Enter', 'Space'],
  escape: ['Escape'],
  tab: ['Tab'],
} as const
