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
  'table.editCell': 'Edit cell',
  'table.sortHint': 'Click to sort, Shift+click to add multi-sort',
  'table.resizeColumn': 'Drag to resize column',
  'table.dragColumn': 'Drag to reorder column',

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

  // ===== Drawer =====
  'drawer.ariaLabel': 'Drawer',
  'drawer.close': 'Close',
  'drawer.closeAriaLabel': 'Close drawer',
  'drawer.confirm': 'Confirm',
  'drawer.cancel': 'Cancel',

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
  'pagination.page': 'Page',
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
  'datepicker.openCalendar': 'Open calendar',
  'datepicker.previousMonth': 'Previous month',
  'datepicker.nextMonth': 'Next month',
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
  'select.removeTag': 'Remove',
  'create.label': 'Create "{value}"',

  // ===== Tree =====
  'tree.empty': 'No data',
  'tree.loading': 'Loading...',
  'tree.expandAll': 'Expand all',
  'tree.collapseAll': 'Collapse all',
  'tree.checkedAll': 'Check all',
  'tree.uncheckedAll': 'Uncheck all',
  'tree.search': 'Search nodes...',
  'tree.clearSearch': 'Clear search',
  'tree.searchResults': 'Search results',

  // ===== Notification / Message =====
  'message.success': 'Success',
  'message.error': 'Error',
  'message.warning': 'Warning',
  'message.info': 'Info',
  'notification.title': 'Notifications',
  'notification.empty': 'No notifications',
  'notification.markAllRead': 'Mark all as read',
  'notification.viewAll': 'View all',
  'notification.closeAriaLabel': 'Close notification',

  // ===== Toast =====
  'toast.region': 'Notifications',

  // ===== Empty / Result =====
  'empty.default': 'No data',
  'empty.search': 'No results found',
  'empty.networkError': 'Network error',
  'empty.retry': 'Click to retry',
  'empty.created': 'Start creating',
  'empty.error': 'Loading failed',
  'empty.no-data': 'No data',
  'empty.no-permission': 'No permission',
  'empty.no-result': 'No matching results',

  // ===== AutoComplete =====
  'autoComplete.placeholder': 'Type a keyword',
  'autoComplete.emptyText': 'No matching items',
  'autoComplete.loadingText': 'Loading...',
  'autoComplete.clearAriaLabel': 'Clear input',

  // ===== Upload / FileUpload =====
  'upload.clickToUpload': 'Click to upload',
  'upload.dragTipPrefix': 'Drag a file here, or ',
  'fileUpload.clickToUpload': 'Click or drag to upload',
  'fileUpload.dragAndDrop': 'Drag files to this area',
  'fileUpload.fileSize': 'Size',

  // ===== OrderList =====
  'orderList.moveToTop': 'Move to top',
  'orderList.moveUp': 'Move up',
  'orderList.moveDown': 'Move down',
  'orderList.moveToBottom': 'Move to bottom',
  'orderList.filterPlaceholder': 'Search',

  // ===== PickList =====
  'pickList.sourceLabel': 'Source list',
  'pickList.targetLabel': 'Target list',
  'pickList.moveToTarget': 'Move to target',
  'pickList.moveToSource': 'Move back to source',
  'pickList.moveAllToTarget': 'Move all to target',
  'pickList.moveAllToSource': 'Move all back to source',
  'pickList.filterPlaceholder': 'Search',

  // ===== QrCode / SplitButton =====
  'qrCode.download': 'Download QR code',
  'splitButton.toggleDropdown': 'Toggle dropdown',
  'orgChart.search': 'Search {field}...',
  // ===== Mention / PinInput / Cascader / Popconfirm / Input 无障碍文案 =====
  'cascader.ariaLabel': 'Cascader',
  'cascader.searchPlaceholder': 'Search...',
  'common.clearAriaLabel': 'Clear input',
  'mention.ariaLabel': 'Mention input',
  'mention.optionsAriaLabel': 'Mention suggestions',
  'mention.placeholder': 'Type @ to mention',
  'pinInput.ariaLabel': 'Verification code',
  'pinInput.groupAriaLabel': 'Verification code digits',
  'pinInput.itemAriaLabel': 'Digit {index} of the verification code',
  'pinInput.sendAriaLabel': 'Send verification code',
  'pinInput.sendingAriaLabel': 'Sending verification code',
  'popconfirm.defaultTitle': 'Confirm this action?',

  // ===== ColorPicker / InputTags / ImagePreview 无障碍与操作文案 =====
  'colorPicker.ariaLabel': 'Color picker',
  'colorPicker.clear': 'Clear color',
  'colorPicker.custom': 'Custom',
  'colorPicker.presets': 'Presets',
  'colorPicker.saturationAriaLabel': 'Saturation picker',
  'colorPicker.unselected': 'Not selected',
  'image.closeAriaLabel': 'Close preview',
  'image.itemAriaLabel': 'Image {index}',
  'image.nextAriaLabel': 'Next image',
  'image.prevAriaLabel': 'Previous image',
  'image.previewAlt': 'Preview image {index}',
  'image.previewAriaLabel': 'Image preview',
  'image.switchAriaLabel': 'Image switcher',
  'inputTags.ariaLabel': 'Tag input ({count} tags)',
  'inputTags.placeholder': 'Enter a tag',
  'inputTags.removeAriaLabel': 'Remove tag {tag}',
  'inputTags.tagAriaLabel': 'Tag: {tag}',

  // ===== TimePicker / RangePicker / Calendar / Pagination 无障碍与操作文案 =====
  'calendar.monthOption': '{month}',
  'calendar.selectMonthAriaLabel': 'Select month',
  'calendar.selectYearAriaLabel': 'Select year',
  'calendar.yearOption': '{year}',
  'datepicker.yearMonth': '{month}/{year}',
  'pagination.sizeOption': '{size} / page',
  'rangePicker.ariaLabel': 'Date range picker',
  'rangePicker.endTimePlaceholder': 'End time',
  'rangePicker.startTimePlaceholder': 'Start time',
  'rangePicker.to': 'to',
  'timepicker.ariaLabel': 'Time picker',
  'timepicker.clearAriaLabel': 'Clear time',
  'timepicker.hourAriaLabel': 'Hours',
  'timepicker.meridiemAriaLabel': 'AM/PM',
  'timepicker.minuteAriaLabel': 'Minutes',
  'timepicker.placeholder': 'Select time',
  'timepicker.secondAriaLabel': 'Seconds',

  // ===== ProTable 搜索表单与操作列文案 =====
  'proTable.actionColumn': 'Actions',
  'proTable.create': 'Create',
  'proTable.searchField': 'Enter {label}',
  'proTable.selectField': 'Select {label}',

  // ===== TipTap 编辑器工具栏文案 =====
  'editor.bold': 'Bold (Ctrl+B)',
  'editor.bulletList': 'Bulleted list',
  'editor.codeBlock': 'Code block',
  'editor.horizontalRule': 'Horizontal rule',
  'editor.italic': 'Italic (Ctrl+I)',
  'editor.linkPlaceholder': 'Enter URL...',
  'editor.list': 'List',
  'editor.orderedList': 'Numbered list',
  'editor.paragraph': 'Body text',
  'editor.redo': 'Redo',
  'editor.strike': 'Strikethrough',
  'editor.table': 'Insert 3×3 table',
  'editor.underline': 'Underline (Ctrl+U)',
  'editor.undo': 'Undo',

  // ===== TipTap 编辑器主体与提及菜单文案 =====
  'editor.exceedMaxLength': 'Content exceeds the {max}-character limit',
  'editor.mentionEmpty': 'No matching users',
  'editor.placeholder': 'Enter content...',

  // ===== ThemeEditor / ImageEditor / DiffViewer / IconPicker / ContextHelp / Stepper 界面与无障碍文案 =====
  'contextHelp.closeAriaLabel': 'Close help',
  'contextHelp.detail': 'Details',
  'contextHelp.more': 'Learn more',
  'diffViewer.ariaLabel': 'Text diff',
  'diffViewer.expandLines': 'Expand {count} lines',
  'diffViewer.newVersion': 'New version',
  'diffViewer.oldVersion': 'Old version',
  'iconPicker.ariaLabel': 'Icon picker',
  'iconPicker.placeholder': 'Select an icon',
  'iconPicker.searchPlaceholder': 'Search icons...',
  'imageEditor.ariaLabel': 'Image crop editor',
  'imageEditor.loadHint': 'Load an image first',
  'imageEditor.preview': 'Preview',
  'imageEditor.previewAlt': 'Crop preview',
  'imageEditor.title': 'Crop image',
  'stepper.ariaLabel': 'Step wizard',
  'stepper.finish': 'Finish',
  'stepper.next': 'Next step',
  'stepper.prev': 'Previous step',
  'themeEditor.title': 'Theme editor',

  // ===== ThemeEditor token 标签 =====
  'themeEditor.background': 'Background color',
  'themeEditor.bodySize': 'Body font size',
  'themeEditor.destructive': 'Danger color',
  'themeEditor.foreground': 'Text color',
  'themeEditor.lowShadow': 'Low shadow',
  'themeEditor.primary': 'Primary color',
  'themeEditor.radius': 'Base radius',
  'themeEditor.success': 'Success color',

} as const satisfies Record<string, string>;

export default enUS;
