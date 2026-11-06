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
export type AriaRoleCategory =
  'widget' | 'structure' | 'landmark' | 'window' | 'liveRegion' | 'navigation';

/** 组件 ARIA 契约定义 */
export interface AriaContract {
  role: string;
  requiredAttrs?: string[];
  optionalAttrs?: string[];
  keyboardInteractions?: string[];
  category: AriaRoleCategory;
}

export const ARIA_ROLE_CONTRACTS: Record<string, AriaContract> = {
  YdAccordion: { role: 'region', requiredAttrs: ['aria-labelledby'], category: 'structure' },
  YdAlertDialog: {
    role: 'alertdialog',
    requiredAttrs: ['aria-modal', 'aria-labelledby', 'aria-describedby'],
    keyboardInteractions: ['Escape'],
    category: 'window',
  },
  YdAutoComplete: {
    role: 'combobox',
    requiredAttrs: ['aria-expanded', 'aria-haspopup', 'aria-controls'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Escape', 'Enter'],
    category: 'widget',
  },
  YdAvatar: {
    role: 'img',
    requiredAttrs: ['aria-label'],
    category: 'widget',
  },
  YdCollapsible: {
    role: 'region',
    requiredAttrs: ['aria-labelledby'],
    category: 'structure',
  },
  YdContextMenu: {
    role: 'menu',
    requiredAttrs: ['aria-orientation'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Space', 'Escape'],
    category: 'widget',
  },
  YdHoverCard: {
    role: 'tooltip',
    category: 'widget',
  },
  YdLabel: {
    role: 'label',
    requiredAttrs: ['for'],
    category: 'structure',
  },
  YdMenubar: {
    role: 'menubar',
    requiredAttrs: ['aria-orientation'],
    keyboardInteractions: ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', 'Escape'],
    category: 'navigation',
  },
  YdNumberField: {
    role: 'spinbutton',
    requiredAttrs: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End'],
    category: 'widget',
  },
  YdPinInput: {
    role: 'group',
    requiredAttrs: ['aria-label'],
    keyboardInteractions: ['ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'],
    category: 'widget',
  },
  YdSeparator: {
    role: 'separator',
    optionalAttrs: ['aria-orientation'],
    category: 'structure',
  },
  YdSplitter: {
    role: 'separator',
    requiredAttrs: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    keyboardInteractions: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'],
    category: 'widget',
  },
  YdToggle: {
    role: 'button',
    requiredAttrs: ['aria-pressed'],
    keyboardInteractions: ['Space'],
    category: 'widget',
  },
  YdToggleGroup: {
    role: 'group',
    requiredAttrs: ['aria-label'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End'],
    category: 'widget',
  },
  YdTreeVirtualizer: {
    role: 'tree',
    category: 'structure',
  },
  YdTabsPro: {
    role: 'tablist',
    requiredAttrs: ['aria-orientation'],
    keyboardInteractions: ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
    category: 'structure',
  },
  YdBreadcrumb: { role: 'navigation', requiredAttrs: ['aria-label'], category: 'landmark' },
  YdButton: { role: 'button', keyboardInteractions: ['Enter', 'Space'], category: 'widget' },
  YdCalendar: {
    role: 'grid',
    requiredAttrs: ['aria-label'],
    keyboardInteractions: [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ],
    category: 'widget',
  },
  YdCascader: {
    role: 'combobox',
    requiredAttrs: ['aria-expanded', 'aria-haspopup'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'],
    category: 'widget',
  },
  YdCheckbox: {
    role: 'checkbox',
    requiredAttrs: ['aria-checked'],
    keyboardInteractions: ['Space'],
    category: 'widget',
  },
  YdDataTable: {
    role: 'grid',
    requiredAttrs: ['aria-rowcount', 'aria-colcount'],
    optionalAttrs: ['aria-sort', 'aria-selected', 'aria-multiselectable'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'],
    category: 'widget',
  },
  YdDialog: {
    role: 'dialog',
    requiredAttrs: ['aria-modal', 'aria-labelledby'],
    keyboardInteractions: ['Escape'],
    category: 'window',
  },
  YdDrawer: {
    role: 'dialog',
    requiredAttrs: ['aria-modal', 'aria-labelledby'],
    keyboardInteractions: ['Escape'],
    category: 'window',
  },
  YdDropdownMenu: {
    role: 'menu',
    requiredAttrs: ['aria-orientation'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Space', 'Escape'],
    category: 'widget',
  },
  YdForm: { role: 'form', requiredAttrs: ['aria-label'], category: 'landmark' },
  YdInput: {
    role: 'textbox',
    optionalAttrs: ['aria-invalid', 'aria-describedby', 'aria-required'],
    category: 'widget',
  },
  YdInputNumber: {
    role: 'spinbutton',
    requiredAttrs: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End'],
    category: 'widget',
  },
  YdListbox: {
    role: 'listbox',
    requiredAttrs: ['aria-multiselectable'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Space'],
    category: 'widget',
  },
  YdMenu: {
    role: 'menu',
    requiredAttrs: ['aria-orientation'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', 'Space', 'Escape'],
    category: 'widget',
  },
  YdModal: {
    role: 'dialog',
    requiredAttrs: ['aria-modal', 'aria-labelledby'],
    keyboardInteractions: ['Escape'],
    category: 'window',
  },
  YdNotification: { role: 'alert', requiredAttrs: ['aria-label'], category: 'liveRegion' },
  YdPagination: { role: 'navigation', category: 'landmark' },
  YdPopover: {
    role: 'dialog',
    optionalAttrs: ['aria-labelledby', 'aria-describedby'],
    keyboardInteractions: ['Escape'],
    category: 'widget',
  },
  YdProgress: {
    role: 'progressbar',
    requiredAttrs: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    category: 'widget',
  },
  YdRadioGroup: {
    role: 'radiogroup',
    requiredAttrs: ['aria-labelledby'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'],
    category: 'widget',
  },
  YdScrollArea: {
    role: 'scrollbar',
    requiredAttrs: ['aria-controls', 'aria-valuenow', 'aria-orientation'],
    category: 'widget',
  },
  YdSelect: {
    role: 'combobox',
    requiredAttrs: ['aria-expanded', 'aria-haspopup'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Escape', 'Home', 'End'],
    category: 'widget',
  },
  YdSlider: {
    role: 'slider',
    requiredAttrs: ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'],
    category: 'widget',
  },
  YdSteps: { role: 'list', category: 'navigation' },
  YdSwitch: {
    role: 'switch',
    requiredAttrs: ['aria-checked'],
    keyboardInteractions: ['Space'],
    category: 'widget',
  },
  YdTable: {
    role: 'table',
    optionalAttrs: ['aria-rowcount', 'aria-colcount', 'aria-sort'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
    category: 'widget',
  },
  YdTabs: {
    role: 'tablist',
    requiredAttrs: ['aria-orientation'],
    keyboardInteractions: ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
    category: 'structure',
  },
  YdTextarea: {
    role: 'textbox',
    optionalAttrs: ['aria-invalid', 'aria-describedby', 'aria-required'],
    category: 'widget',
  },
  YdTimeline: { role: 'list', category: 'structure' },
  YdToast: { role: 'status', requiredAttrs: ['aria-label'], category: 'liveRegion' },
  YdToggler: {
    role: 'switch',
    requiredAttrs: ['aria-checked'],
    keyboardInteractions: ['Space'],
    category: 'widget',
  },
  YdTooltip: { role: 'tooltip', category: 'widget' },
  YdTransfer: {
    role: 'listbox',
    requiredAttrs: ['aria-multiselectable'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Enter', 'Space'],
    category: 'widget',
  },
  YdTree: { role: 'tree', category: 'structure' },
  YdTreeSelect: {
    role: 'combobox',
    requiredAttrs: ['aria-expanded', 'aria-haspopup'],
    keyboardInteractions: ['ArrowUp', 'ArrowDown', 'Escape', 'Enter'],
    category: 'widget',
  },
  YdUpload: { role: 'button', keyboardInteractions: ['Enter', 'Space'], category: 'widget' },
};

export const ARIA_RTL_LANGUAGES: string[] = ['ar-SA', 'fa-IR', 'he-IL'];

export const ARIA_KEYBOARD_KEYS = {
  activation: ['Enter', 'Space'],
  escape: ['Escape'],
  tab: ['Tab'],
} as const;
