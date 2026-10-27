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
  'table.editCell': '编辑单元格',
  'table.sortHint': '点击排序，Shift+点击追加多列排序',
  'table.resizeColumn': '拖拽调整列宽',
  'table.dragColumn': '拖拽调整列顺序',

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

  // ===== Drawer =====
  'drawer.ariaLabel': '抽屉',
  'drawer.close': '关闭',
  'drawer.closeAriaLabel': '关闭抽屉',
  'drawer.confirm': '确认',
  'drawer.cancel': '取消',

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
  'datepicker.openCalendar': '打开日历',
  'datepicker.previousMonth': '上个月',
  'datepicker.nextMonth': '下个月',
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
  'select.removeTag': '移除',
  'create.label': '创建 "{value}"',

  // ===== Tree =====
  'tree.empty': '暂无数据',
  'tree.loading': '加载中...',
  'tree.expandAll': '展开全部',
  'tree.collapseAll': '收起全部',
  'tree.checkedAll': '全选',
  'tree.uncheckedAll': '取消全选',
  'tree.search': '搜索节点...',
  'tree.clearSearch': '清空搜索',
  'tree.searchResults': '搜索结果',

  // ===== Notification / Message =====
  'message.success': '操作成功',
  'message.error': '操作失败',
  'message.warning': '警告',
  'message.info': '提示',
  'notification.title': '通知',
  'notification.empty': '暂无通知',
  'notification.markAllRead': '全部标为已读',
  'notification.viewAll': '查看全部',
  'notification.closeAriaLabel': '关闭通知',

  // ===== Toast =====
  'toast.region': '通知',

  // ===== Empty / Result =====
  'empty.default': '暂无数据',
  'empty.search': '未找到匹配结果',
  'empty.networkError': '网络错误',
  'empty.retry': '点击重试',
  'empty.created': '开始创建',
  'empty.error': '加载出错',
  'empty.no-data': '暂无数据',
  'empty.no-permission': '暂无权限',
  'empty.no-result': '未找到匹配结果',

  // ===== AutoComplete =====
  'autoComplete.placeholder': '请输入关键词',
  'autoComplete.emptyText': '暂无匹配项',
  'autoComplete.loadingText': '加载中...',
  'autoComplete.clearAriaLabel': '清空输入',

  // ===== Upload / FileUpload =====
  'upload.clickToUpload': '点击上传',
  'upload.dragTipPrefix': '将文件拖到此处，或',
  'fileUpload.clickToUpload': '点击或拖拽上传',
  'fileUpload.dragAndDrop': '拖拽文件到此区域',
  'fileUpload.fileSize': '大小',

  // ===== OrderList =====
  'orderList.moveToTop': '移到顶部',
  'orderList.moveUp': '上移',
  'orderList.moveDown': '下移',
  'orderList.moveToBottom': '移到底部',
  'orderList.filterPlaceholder': '搜索',

  // ===== PickList =====
  'pickList.sourceLabel': '源列表',
  'pickList.targetLabel': '目标列表',
  'pickList.moveToTarget': '移动到目标',
  'pickList.moveToSource': '移回源列表',
  'pickList.moveAllToTarget': '全部移动到目标',
  'pickList.moveAllToSource': '全部移回源列表',
  'pickList.filterPlaceholder': '搜索',

  // ===== QrCode / SplitButton =====
  'qrCode.download': '下载二维码',
  'splitButton.toggleDropdown': '展开更多操作',
  'orgChart.search': '搜索 {field}...',
  // ===== Mention / PinInput / Cascader / Popconfirm / Input 无障碍文案 =====
  'cascader.ariaLabel': '级联选择器',
  'cascader.searchPlaceholder': '搜索...',
  'common.clearAriaLabel': '清空输入',
  'mention.ariaLabel': '提及输入框',
  'mention.optionsAriaLabel': '提及候选',
  'mention.placeholder': '输入 @ 触发提及',
  'pinInput.ariaLabel': '验证码输入',
  'pinInput.groupAriaLabel': '验证码数字输入框',
  'pinInput.itemAriaLabel': '第 {index} 位验证码',
  'pinInput.sendAriaLabel': '发送验证码',
  'pinInput.sendingAriaLabel': '正在发送验证码',
  'popconfirm.defaultTitle': '确认操作？',

  // ===== ColorPicker / InputTags / ImagePreview 无障碍与操作文案 =====
  'colorPicker.ariaLabel': '颜色选择器',
  'colorPicker.clear': '清除颜色',
  'colorPicker.custom': '自定义',
  'colorPicker.presets': '预设',
  'colorPicker.saturationAriaLabel': '取色器',
  'colorPicker.unselected': '未选择',
  'image.closeAriaLabel': '关闭预览',
  'image.itemAriaLabel': '第 {index} 张',
  'image.nextAriaLabel': '下一张',
  'image.prevAriaLabel': '上一张',
  'image.previewAlt': '预览图 {index}',
  'image.previewAriaLabel': '图片预览',
  'image.switchAriaLabel': '图片切换',
  'inputTags.ariaLabel': '标签输入（{count} 个标签）',
  'inputTags.placeholder': '输入标签',
  'inputTags.removeAriaLabel': '删除标签 {tag}',
  'inputTags.tagAriaLabel': '标签：{tag}',

  // ===== TimePicker / RangePicker / Calendar / Pagination 无障碍与操作文案 =====
  'calendar.monthOption': '{month}月',
  'calendar.selectMonthAriaLabel': '选择月份',
  'calendar.selectYearAriaLabel': '选择年份',
  'calendar.yearOption': '{year}年',
  'datepicker.yearMonth': '{year}年{month}月',
  'pagination.sizeOption': '{size} 条/页',
  'rangePicker.ariaLabel': '日期范围选择器',
  'rangePicker.endTimePlaceholder': '结束时间',
  'rangePicker.startTimePlaceholder': '开始时间',
  'rangePicker.to': '至',
  'timepicker.ariaLabel': '时间选择器',
  'timepicker.clearAriaLabel': '清除时间',
  'timepicker.hourAriaLabel': '小时',
  'timepicker.meridiemAriaLabel': '上午/下午',
  'timepicker.minuteAriaLabel': '分钟',
  'timepicker.placeholder': '选择时间',
  'timepicker.secondAriaLabel': '秒',

  // ===== ProTable 搜索表单与操作列文案 =====
  'proTable.actionColumn': '操作',
  'proTable.create': '新建',
  'proTable.searchField': '请输入{label}',
  'proTable.selectField': '请选择{label}',

  // ===== TipTap 编辑器工具栏文案 =====
  'editor.bold': '加粗 (Ctrl+B)',
  'editor.bulletList': '无序列表',
  'editor.codeBlock': '代码块',
  'editor.horizontalRule': '水平线',
  'editor.italic': '斜体 (Ctrl+I)',
  'editor.linkPlaceholder': '输入 URL...',
  'editor.list': '列表',
  'editor.orderedList': '有序列表',
  'editor.paragraph': '正文',
  'editor.redo': '重做',
  'editor.strike': '删除线',
  'editor.table': '插入 3x3 表格',
  'editor.underline': '下划线 (Ctrl+U)',
  'editor.undo': '撤销',

  // ===== TipTap 编辑器主体与提及菜单文案 =====
  'editor.exceedMaxLength': '内容已超过最大字符数限制（{max}）',
  'editor.mentionEmpty': '无匹配用户',
  'editor.placeholder': '请输入内容...',

  // ===== ThemeEditor / ImageEditor / DiffViewer / IconPicker / ContextHelp / Stepper 界面与无障碍文案 =====
  'contextHelp.closeAriaLabel': '关闭帮助',
  'contextHelp.detail': '详情',
  'contextHelp.more': '了解更多',
  'diffViewer.ariaLabel': '文本差异对比',
  'diffViewer.expandLines': '展开 {count} 行',
  'diffViewer.newVersion': '新版本',
  'diffViewer.oldVersion': '旧版本',
  'iconPicker.ariaLabel': '图标选择器',
  'iconPicker.placeholder': '选择图标',
  'iconPicker.searchPlaceholder': '搜索图标...',
  'imageEditor.ariaLabel': '图片裁剪编辑',
  'imageEditor.loadHint': '请加载图片',
  'imageEditor.preview': '预览',
  'imageEditor.previewAlt': '裁剪预览',
  'imageEditor.title': '图片裁剪',
  'stepper.ariaLabel': '步骤向导',
  'stepper.finish': '完成',
  'stepper.next': '下一步',
  'stepper.prev': '上一步',
  'themeEditor.title': '主题编辑器',

  // ===== ThemeEditor token 标签 =====
  'themeEditor.background': '背景色',
  'themeEditor.bodySize': '正文字号',
  'themeEditor.destructive': '危险色',
  'themeEditor.foreground': '文字色',
  'themeEditor.lowShadow': '低阴影',
  'themeEditor.primary': '主色',
  'themeEditor.radius': '基础圆角',
  'themeEditor.success': '成功色',

} as const satisfies Record<string, string>;

export default zhCN;
