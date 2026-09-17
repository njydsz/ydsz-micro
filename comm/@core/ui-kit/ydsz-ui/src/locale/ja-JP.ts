/**
 * ydsz-ui 组件内置日文文案（ja-JP）。
 *
 * 与 zh-CN.ts / en-US.ts 保持键名一一对应。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\ja-JP.ts
 * @author ydsz-team
 * @since 5.6.0
 */

/** 日本語メッセージテーブル */
export const jaJP = {
  // ===== 共通 =====
  'common.confirm': '確認',
  'common.cancel': 'キャンセル',
  'common.loading': '読み込み中...',
  'common.search': '検索',
  'common.reset': 'リセット',
  'common.submit': '送信',
  'common.close': '閉じる',
  'common.more': 'もっと見る',
  'common.expand': '展開',
  'common.collapse': '折りたたむ',
  'common.copy': 'コピー',
  'common.copied': 'コピーしました',
  'common.delete': '削除',
  'common.edit': '編集',
  'common.add': '追加',
  'common.save': '保存',
  'common.refresh': '更新',

  // ===== テーブル =====
  'table.empty': 'データがありません',
  'table.loading': '読み込み中...',
  'table.total': '{count}件',
  'table.page': '{page}ページ',
  'table.filter.confirm': '絞り込み',
  'table.filter.reset': 'リセット',
  'table.sort.asc': '昇順',
  'table.sort.desc': '降順',
  'table.selectAll': 'すべて選択',
  'table.selectRow': 'この行を選択',
  'table.cancelSelect': '選択解除',
  'table.expandedRow': '行を展開',
  'table.collapseRow': '行を折りたたむ',
  'table.columnSetting': '列設定',

  // ===== フォーム =====
  'form.validating': '検証中...',
  'form.submitting': '送信中...',
  'form.required': 'この項目は必須です',
  'form.invalid': '形式が正しくありません',
  'form.passwordMismatch': 'パスワードが一致しません',
  'form.validateSuccess': '検証に成功しました',
  'form.validateFailed': '検証に失敗しました。入力内容を確認してください',

  // ===== ダイアログ =====
  'dialog.close': '閉じる',
  'dialog.confirm': '確認',
  'dialog.cancel': 'キャンセル',
  'dialog.deleteConfirm': '削除してもよろしいですか？',
  'dialog.deleteWarning': 'この操作は取り消せません',

  // ===== アップロード =====
  'upload.drag': 'クリックまたはドラッグしてファイルをアップロード',
  'upload.dragging': 'ドロップしてアップロード',
  'upload.error': 'アップロードに失敗しました',
  'upload.success': 'アップロード完了',
  'upload.preview': 'プレビュー',
  'upload.remove': '削除',
  'upload.retry': '再試行',
  'upload.maxSize': 'ファイルサイズが制限を超えています',
  'upload.maxCount': 'ファイル数が制限を超えています',
  'upload.invalidFormat': 'サポートされていないファイル形式です',

  // ===== ページネーション =====
  'pagination.page': 'ページ',
  'pagination.total': '合計{count}件',
  'pagination.size': '件/ページ',
  'pagination.jumpTo': '移動',
  'pagination.prev': '前へ',
  'pagination.next': '次へ',
  'pagination.first': '最初',
  'pagination.last': '最後',

  // ===== 日付ピッカー =====
  'datepicker.placeholder': '日付を選択',
  'datepicker.startPlaceholder': '開始日',
  'datepicker.endPlaceholder': '終了日',
  'datepicker.today': '今日',
  'datepicker.yesterday': '昨日',
  'datepicker.thisWeek': '今週',
  'datepicker.thisMonth': '今月',
  'datepicker.thisYear': '今年',
  'datepicker.clear': 'クリア',
  'datepicker.confirm': '確認',
  'datepicker.mon': '月',
  'datepicker.tue': '火',
  'datepicker.wed': '水',
  'datepicker.thu': '木',
  'datepicker.fri': '金',
  'datepicker.sat': '土',
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

  // ===== セレクト =====
  'select.placeholder': '選択してください',
  'select.search': 'オプションを検索',
  'select.empty': '一致するオプションがありません',
  'select.loading': '読み込み中...',
  'select.selectAll': 'すべて選択',
  'select.clear': 'クリア',
  'create.label': '"{value}" を作成',

  // ===== ツリー =====
  'tree.empty': 'データがありません',
  'tree.loading': '読み込み中...',
  'tree.expandAll': 'すべて展開',
  'tree.collapseAll': 'すべて折りたたむ',
  'tree.checkedAll': 'すべて選択',
  'tree.uncheckedAll': 'すべて解除',

  // ===== 通知 =====
  'message.success': '成功',
  'message.error': 'エラー',
  'message.warning': '警告',
  'message.info': 'お知らせ',
  'notification.title': '通知',
  'notification.empty': '通知はありません',
  'notification.markAllRead': 'すべて既読にする',
  'notification.viewAll': 'すべて表示',

  // ===== 空状態 =====
  'empty.default': 'データがありません',
  'empty.search': '一致する結果がありません',
  'empty.networkError': 'ネットワークエラー',
  'empty.retry': 'クリックして再試行',
} as const satisfies Record<string, string>;

export default jaJP;
