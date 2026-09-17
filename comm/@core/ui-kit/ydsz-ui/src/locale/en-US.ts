/**
 * ydsz-ui 组件内置英文文案（en-US）。
 *
 * 与 zh-CN.ts 保持键名一一对应；支持 {placeholder} 插值。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\en-US.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** English message table */
export const enUS = {
  // ===== Common =====
  'common.confirm': 'Confirm',
  'common.cancel': 'Cancel',
  'common.loading': 'Loading...',
  'common.search': 'Search',
  'common.reset': 'Reset',
  'common.submit': 'Submit',
  'common.close': 'Close',
  'common.more': 'More',
  'common.expand': 'Expand',
  'common.collapse': 'Collapse',
  'common.copy': 'Copy',
  'common.copied': 'Copied',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.add': 'Add',
  'common.save': 'Save',
  'common.refresh': 'Refresh',

  // ===== Table =====
  'table.empty': 'No data',
  'table.loading': 'Loading...',
  'table.total': '{count} records',
  'table.page': 'Page {page}',
  'table.filter.confirm': 'Filter',
  'table.filter.reset': 'Reset',
  'table.sort.asc': 'Ascending',
  'table.sort.desc': 'Descending',
  'table.selectAll': 'Select all',
  'table.selectRow': 'Select row',
  'table.cancelSelect': 'Cancel selection',
  'table.expandedRow': 'Expand row',
  'table.collapseRow': 'Collapse row',
  'table.columnSetting': 'Column settings',

  // ===== Form =====
  'form.validating': 'Validating...',
  'form.submitting': 'Submitting...',
  'form.required': 'This field is required',
  'form.invalid': 'Invalid format',
  'form.passwordMismatch': 'Passwords do not match',
  'form.validateSuccess': 'Validation passed',
  'form.validateFailed': 'Validation failed, please check inputs',

  // ===== Dialog / Sheet =====
  'dialog.close': 'Close',
  'dialog.confirm': 'Confirm',
  'dialog.cancel': 'Cancel',
  'dialog.deleteConfirm': 'Confirm delete?',
  'dialog.deleteWarning': 'This action cannot be undone',

  // ===== Upload =====
  'upload.drag': 'Click or drag file to this area to upload',
  'upload.dragging': 'Release to upload',
  'upload.error': 'Upload failed',
  'upload.success': 'Upload successful',
  'upload.preview': 'Preview',
  'upload.remove': 'Remove',
  'upload.retry': 'Retry',
  'upload.maxSize': 'File size exceeds limit',
  'upload.maxCount': 'File count exceeds limit',
  'upload.invalidFormat': 'Unsupported file format',

  // ===== Pagination =====
  'pagination.page': '',
  'pagination.total': '{count} records total',
  'pagination.size': '/ page',
  'pagination.jumpTo': 'Go to',
  'pagination.prev': 'Previous',
  'pagination.next': 'Next',
  'pagination.first': 'First',
  'pagination.last': 'Last',

  // ===== DatePicker =====
  'datepicker.placeholder': 'Select date',
  'datepicker.startPlaceholder': 'Start date',
  'datepicker.endPlaceholder': 'End date',
  'datepicker.today': 'Today',
  'datepicker.yesterday': 'Yesterday',
  'datepicker.thisWeek': 'This week',
  'datepicker.thisMonth': 'This month',
  'datepicker.thisYear': 'This year',
  'datepicker.clear': 'Clear',
  'datepicker.confirm': 'Confirm',
  'datepicker.mon': 'Mon',
  'datepicker.tue': 'Tue',
  'datepicker.wed': 'Wed',
  'datepicker.thu': 'Thu',
  'datepicker.fri': 'Fri',
  'datepicker.sat': 'Sat',
  'datepicker.sun': 'Sun',
  'datepicker.jan': 'Jan',
  'datepicker.feb': 'Feb',
  'datepicker.mar': 'Mar',
  'datepicker.apr': 'Apr',
  'datepicker.may': 'May',
  'datepicker.jun': 'Jun',
  'datepicker.jul': 'Jul',
  'datepicker.aug': 'Aug',
  'datepicker.sep': 'Sep',
  'datepicker.oct': 'Oct',
  'datepicker.nov': 'Nov',
  'datepicker.dec': 'Dec',

  // ===== Select =====
  'select.placeholder': 'Please select',
  'select.search': 'Search options',
  'select.empty': 'No matching options',
  'select.loading': 'Loading...',
  'select.selectAll': 'Select all',
  'select.clear': 'Clear',
  'create.label': 'Create "{value}"',

  // ===== Tree =====
  'tree.empty': 'No data',
  'tree.loading': 'Loading...',
  'tree.expandAll': 'Expand all',
  'tree.collapseAll': 'Collapse all',
  'tree.checkedAll': 'Check all',
  'tree.uncheckedAll': 'Uncheck all',

  // ===== Notification / Message =====
  'message.success': 'Success',
  'message.error': 'Error',
  'message.warning': 'Warning',
  'message.info': 'Info',
  'notification.title': 'Notifications',
  'notification.empty': 'No notifications',
  'notification.markAllRead': 'Mark all as read',
  'notification.viewAll': 'View all',

  // ===== Empty / Result =====
  'empty.default': 'No data',
  'empty.search': 'No results found',
  'empty.networkError': 'Network error',
  'empty.retry': 'Click to retry',
} as const satisfies Record<string, string>;

export default enUS;
