/**
 * ydsz-ui 组件内置中文文案（zh-CN）。
 *
 * 按组件命名空间分区：table、form、dialog、upload、pagination、
 * datepicker、select、tree、common 等。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\zh-CN.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 中文文案表 */
export const zhCN = {
  // ===== 通用 =====
  'common.confirm': '确认',
  'common.cancel': '取消',
  'common.loading': '加载中...',
  'common.search': '搜索',
  'common.reset': '重置',
  'common.submit': '提交',
  'common.close': '关闭',
  'common.more': '更多',
  'common.expand': '展开',
  'common.collapse': '收起',
  'common.copy': '复制',
  'common.copied': '已复制',
  'common.delete': '删除',
  'common.edit': '编辑',
  'common.add': '新增',
  'common.save': '保存',
  'common.refresh': '刷新',

  // ===== Table =====
  'table.empty': '暂无数据',
  'table.loading': '加载中...',
  'table.total': '共 {count} 条',
  'table.page': '第 {page} 页',
  'table.filter.confirm': '筛选',
  'table.filter.reset': '重置',
  'table.sort.asc': '升序',
  'table.sort.desc': '降序',
  'table.selectAll': '全选',
  'table.selectRow': '选择此行',
  'table.cancelSelect': '取消选择',
  'table.expandedRow': '展开行',
  'table.collapseRow': '收起行',
  'table.columnSetting': '列设置',

  // ===== Form =====
  'form.validating': '校验中...',
  'form.submitting': '提交中...',
  'form.required': '此项为必填项',
  'form.invalid': '格式不正确',
  'form.passwordMismatch': '两次输入的密码不一致',
  'form.validateSuccess': '校验通过',
  'form.validateFailed': '校验失败，请检查输入',

  // ===== Dialog / Sheet =====
  'dialog.close': '关闭',
  'dialog.confirm': '确认',
  'dialog.cancel': '取消',
  'dialog.deleteConfirm': '确认删除？',
  'dialog.deleteWarning': '此操作不可撤销',

  // ===== Upload =====
  'upload.drag': '点击或拖拽文件到此区域上传',
  'upload.dragging': '释放文件开始上传',
  'upload.error': '上传失败',
  'upload.success': '上传成功',
  'upload.preview': '预览',
  'upload.remove': '移除',
  'upload.retry': '重试',
  'upload.maxSize': '文件大小超过限制',
  'upload.maxCount': '文件数量超过限制',
  'upload.invalidFormat': '文件格式不支持',

  // ===== Pagination =====
  'pagination.page': '页',
  'pagination.total': '共 {count} 条',
  'pagination.size': '条/页',
  'pagination.jumpTo': '跳至',
  'pagination.prev': '上一页',
  'pagination.next': '下一页',
  'pagination.first': '首页',
  'pagination.last': '末页',

  // ===== DatePicker =====
  'datepicker.placeholder': '选择日期',
  'datepicker.startPlaceholder': '开始日期',
  'datepicker.endPlaceholder': '结束日期',
  'datepicker.today': '今天',
  'datepicker.yesterday': '昨天',
  'datepicker.thisWeek': '本周',
  'datepicker.thisMonth': '本月',
  'datepicker.thisYear': '今年',
  'datepicker.clear': '清除',
  'datepicker.confirm': '确认',
  'datepicker.mon': '一',
  'datepicker.tue': '二',
  'datepicker.wed': '三',
  'datepicker.thu': '四',
  'datepicker.fri': '五',
  'datepicker.sat': '六',
  'datepicker.sun': '日',
  'datepicker.jan': '1月',
  'datepicker.feb': '2月',
  'datepicker.mar': '3月',
  'datepicker.apr': '4月',
  'datepicker.may': '5月',
  'datepicker.jun': '6月',
  'datepicker.jul': '7月',
  'datepicker.aug': '8月',
  'datepicker.sep': '9月',
  'datepicker.oct': '10月',
  'datepicker.nov': '11月',
  'datepicker.dec': '12月',

  // ===== Select =====
  'select.placeholder': '请选择',
  'select.search': '搜索选项',
  'select.empty': '无匹配选项',
  'select.loading': '加载中...',
  'select.selectAll': '全选',
  'select.clear': '清空',
  'create.label': '创建 "{value}"',

  // ===== Tree =====
  'tree.empty': '暂无数据',
  'tree.loading': '加载中...',
  'tree.expandAll': '展开全部',
  'tree.collapseAll': '收起全部',
  'tree.checkedAll': '全选',
  'tree.uncheckedAll': '取消全选',

  // ===== Notification / Message =====
  'message.success': '操作成功',
  'message.error': '操作失败',
  'message.warning': '警告',
  'message.info': '提示',
  'notification.title': '通知',
  'notification.empty': '暂无通知',
  'notification.markAllRead': '全部标为已读',
  'notification.viewAll': '查看全部',

  // ===== Empty / Result =====
  'empty.default': '暂无数据',
  'empty.search': '未找到匹配结果',
  'empty.networkError': '网络错误',
  'empty.retry': '点击重试',
} as const satisfies Record<string, string>;

export default zhCN;
