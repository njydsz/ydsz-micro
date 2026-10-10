/**
 * ydsz-ui 元件內建繁體中文文案（zh-TW）。
 *
 * 與 zh-CN.ts 保持鍵名結構嚴格一致；{placeholder} 插值同義。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\zh-TW.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 繁體中文訊息表 */
export const zhTW = {
  // ===== 通用 =====
  'common.confirm': '確認',
  'common.cancel': '取消',
  'common.loading': '載入中...',
  'common.search': '搜尋',
  'common.reset': '重置',
  'common.submit': '送出',
  'common.close': '關閉',
  'common.more': '更多',
  'common.expand': '展開',
  'common.collapse': '收合',
  'common.copy': '複製',
  'common.copied': '已複製',
  'common.delete': '刪除',
  'common.edit': '編輯',
  'common.add': '新增',
  'common.save': '儲存',
  'common.refresh': '重新整理',

  // ===== 表格 =====
  'table.empty': '暫無資料',
  'table.loading': '載入中...',
  'table.total': '共 {count} 筆',
  'table.page': '第 {page} 頁',
  'table.filter.confirm': '篩選',
  'table.filter.reset': '重置',
  'table.sort.asc': '升序',
  'table.sort.desc': '降序',
  'table.selectAll': '全選',
  'table.selectRow': '選取此列',
  'table.cancelSelect': '取消選取',
  'table.expandedRow': '展開列',
  'table.collapseRow': '收合列',
  'table.columnSetting': '欄位設定',

  // ===== 表單 =====
  'form.validating': '驗證中...',
  'form.submitting': '送出中...',
  'form.required': '此項為必填',
  'form.invalid': '格式不正確',
  'form.passwordMismatch': '兩次輸入的密碼不一致',
  'form.validateSuccess': '驗證通過',
  'form.validateFailed': '驗證失敗，請檢查輸入內容',

  // ===== 對話框 =====
  'dialog.close': '關閉',
  'dialog.confirm': '確認',
  'dialog.cancel': '取消',
  'dialog.deleteConfirm': '確認刪除？',
  'dialog.deleteWarning': '此操作不可復原',

  // ===== 上傳 =====
  'upload.drag': '點擊或拖曳檔案到此處上傳',
  'upload.dragging': '放開檔案開始上傳',
  'upload.error': '上傳失敗',
  'upload.success': '上傳成功',
  'upload.preview': '預覽',
  'upload.remove': '移除',
  'upload.retry': '重試',
  'upload.maxSize': '檔案大小超過限制',
  'upload.maxCount': '檔案數量超過限制',
  'upload.invalidFormat': '檔案格式不支援',

  // ===== 分頁 =====
  'pagination.page': '頁',
  'pagination.total': '共 {count} 筆',
  'pagination.size': '筆/頁',
  'pagination.jumpTo': '跳至',
  'pagination.prev': '上一頁',
  'pagination.next': '下一頁',
  'pagination.first': '首頁',
  'pagination.last': '末頁',

  // ===== 日期選擇器 =====
  'datepicker.placeholder': '選擇日期',
  'datepicker.startPlaceholder': '開始日期',
  'datepicker.endPlaceholder': '結束日期',
  'datepicker.today': '今天',
  'datepicker.yesterday': '昨天',
  'datepicker.thisWeek': '本週',
  'datepicker.thisMonth': '本月',
  'datepicker.thisYear': '今年',
  'datepicker.clear': '清除',
  'datepicker.confirm': '確認',
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

  // ===== 選擇器 =====
  'select.placeholder': '請選擇',
  'select.search': '搜尋選項',
  'select.empty': '無符合的選項',
  'select.loading': '載入中...',
  'select.selectAll': '全選',
  'select.clear': '清除',
  'create.label': '建立 "{value}"',

  // ===== 樹狀 =====
  'tree.empty': '暫無資料',
  'tree.loading': '載入中...',
  'tree.expandAll': '展開全部',
  'tree.collapseAll': '收合全部',
  'tree.checkedAll': '全選',
  'tree.uncheckedAll': '取消全選',

  // ===== 通知 =====
  'message.success': '操作成功',
  'message.error': '操作失敗',
  'message.warning': '警告',
  'message.info': '提示',
  'notification.title': '通知',
  'notification.empty': '暫無通知',
  'notification.markAllRead': '全部標為已讀',
  'notification.viewAll': '檢視全部',

  // ===== 空狀態 =====
  'empty.default': '暫無資料',
  'empty.search': '未找到符合的結果',
  'empty.networkError': '網路錯誤',
  'empty.retry': '點擊重試',
} as const satisfies Record<string, string>;

export default zhTW;
