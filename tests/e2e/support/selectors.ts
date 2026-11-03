/**
 * E2E 语义化选择器。
 *
 * 页面已从 Element Plus 迁移到 ydsz-ui，测试不得依赖实现类名。
 * 主容器使用稳定的 #subapp-container；业务结构使用 ARIA 语义选择器。
 */
export const APP_SELECTOR = '#subapp-container';

export const SELECTORS = {
  appContainer: APP_SELECTOR,
  dataTable: 'table, [role="table"]',
  emptyState: '[data-testid*="empty"], [class*="empty-state"]',
  dialog: '[role="dialog"]',
  dialogSave:
    '[role="dialog"] button:has-text("保存"), [role="dialog"] button:has-text("提交"), [role="dialog"] button:has-text("确定"), [role="dialog"] button:has-text("创建")',
  formError: '[role="alert"], [class*="form-error"], [class*="field-error"]',
  heading: 'h1, h2, [role="heading"]',
  tableRow: 'tbody tr',
  confirmOk:
    '[role="dialog"] button:has-text("确定"), [role="alertdialog"] button:has-text("确定"), button:has-text("确定")',
  switchToggle: '[role="switch"]',
  tab: '[role="tab"]',
} as const;

export function appContainer() {
  return APP_SELECTOR;
}

export function dataTable() {
  return SELECTORS.dataTable;
}

export function dialog() {
  return SELECTORS.dialog;
}

export function dialogSave() {
  return SELECTORS.dialogSave;
}

export function formError() {
  return SELECTORS.formError;
}

export function heading() {
  return SELECTORS.heading;
}

export function tableRow() {
  return SELECTORS.tableRow;
}

export function emptyState() {
  return SELECTORS.emptyState;
}
