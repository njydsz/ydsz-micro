/**
 * ydsz-ui 组件内置英文文案。
 *
 * 包含组件内部硬编码的简短字符串（empty state、loading state、validation state）。
 * 业务方可通过 ConfigProvider 的 locale 属性覆盖任意字段。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\en-US.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** English message table */
export const enUS: Record<string, string> = {
  // YdTable
  'table.empty': 'No data',
  'table.loading': 'Loading...',
  // YdFormMessage / YdForm
  'form.validating': 'Validating...',
  'form.submitting': 'Submitting...',
  // YdSheet / YdDialog
  'dialog.close': 'Close',
  // useTheme
  'theme.toggle': 'Toggle theme',
  // Common
  'common.confirm': 'Confirm',
  'common.cancel': 'Cancel',
  'common.loading': 'Loading...',
};

export default enUS;
