/**
 * ydsz-ui Thành phần văn bản tiếng Việt tích hợp（vi-VN）。
 *
 * Cấu trúc khóa khớp chặt chẽ với zh-CN.ts;
 * hỗ trợ {placeholder}.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\vi-VN.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Bảng tin nhắn tiếng Việt —— 越南语 */
export const viVN = {
  // ===== Chung =====
  'common.confirm': 'Xác nhận',
  'common.cancel': 'Hủy',
  'common.loading': 'Đang tải...',
  'common.search': 'Tìm kiếm',
  'common.reset': 'Đặt lại',
  'common.submit': 'Gửi',
  'common.close': 'Đóng',
  'common.more': 'Thêm',
  'common.expand': 'Mở rộng',
  'common.collapse': 'Thu gọn',
  'common.copy': 'Sao chép',
  'common.copied': 'Đã sao chép',
  'common.delete': 'Xóa',
  'common.edit': 'Sửa',
  'common.add': 'Thêm',
  'common.save': 'Lưu',
  'common.refresh': 'Làm mới',

  // ===== Bảng =====
  'table.empty': 'Không có dữ liệu',
  'table.loading': 'Đang tải...',
  'table.total': '{count} bản ghi',
  'table.page': 'Trang {page}',
  'table.filter.confirm': 'Lọc',
  'table.filter.reset': 'Đặt lại',
  'table.sort.asc': 'Tăng dần',
  'table.sort.desc': 'Giảm dần',
  'table.selectAll': 'Chọn tất cả',
  'table.selectRow': 'Chọn dòng này',
  'table.cancelSelect': 'Hủy chọn',
  'table.expandedRow': 'Mở rộng dòng',
  'table.collapseRow': 'Thu gọn dòng',
  'table.columnSetting': 'Cài đặt cột',

  // ===== Biểu mẫu =====
  'form.validating': 'Đang xác thực...',
  'form.submitting': 'Đang gửi...',
  'form.required': 'Trường này là bắt buộc',
  'form.invalid': 'Định dạng không hợp lệ',
  'form.passwordMismatch': 'Mật khẩu không khớp',
  'form.validateSuccess': 'Xác thực thành công',
  'form.validateFailed': 'Xác thực thất bại, vui lòng kiểm tra đầu vào',

  // ===== Hộp thoại =====
  'dialog.close': 'Đóng',
  'dialog.confirm': 'Xác nhận',
  'dialog.cancel': 'Hủy',
  'dialog.deleteConfirm': 'Xác nhận xóa?',
  'dialog.deleteWarning': 'Hành động này không thể hoàn tác',

  // ===== Tải lên =====
  'upload.drag': 'Nhấp hoặc kéo tệp vào khu vực này để tải lên',
  'upload.dragging': 'Thả để tải lên',
  'upload.error': 'Tải lên thất bại',
  'upload.success': 'Tải lên thành công',
  'upload.preview': 'Xem trước',
  'upload.remove': 'Xóa',
  'upload.retry': 'Thử lại',
  'upload.maxSize': 'Kích thước tệp vượt quá giới hạn',
  'upload.maxCount': 'Số lượng tệp vượt quá giới hạn',
  'upload.invalidFormat': 'Định dạng tệp không được hỗ trợ',

  // ===== Phân trang =====
  'pagination.page': '',
  'pagination.total': 'Tổng {count} bản ghi',
  'pagination.size': '/ trang',
  'pagination.jumpTo': 'Đi đến',
  'pagination.prev': 'Trước',
  'pagination.next': 'Tiếp',
  'pagination.first': 'Đầu',
  'pagination.last': 'Cuối',

  // ===== Chọn ngày =====
  'datepicker.placeholder': 'Chọn ngày',
  'datepicker.startPlaceholder': 'Ngày bắt đầu',
  'datepicker.endPlaceholder': 'Ngày kết thúc',
  'datepicker.today': 'Hôm nay',
  'datepicker.yesterday': 'Hôm qua',
  'datepicker.thisWeek': 'Tuần này',
  'datepicker.thisMonth': 'Tháng này',
  'datepicker.thisYear': 'Năm nay',
  'datepicker.clear': 'Xóa',
  'datepicker.confirm': 'Xác nhận',
  'datepicker.mon': 'T2',
  'datepicker.tue': 'T3',
  'datepicker.wed': 'T4',
  'datepicker.thu': 'T5',
  'datepicker.fri': 'T6',
  'datepicker.sat': 'T7',
  'datepicker.sun': 'CN',
  'datepicker.jan': 'Thg 1',
  'datepicker.feb': 'Thg 2',
  'datepicker.mar': 'Thg 3',
  'datepicker.apr': 'Thg 4',
  'datepicker.may': 'Thg 5',
  'datepicker.jun': 'Thg 6',
  'datepicker.jul': 'Thg 7',
  'datepicker.aug': 'Thg 8',
  'datepicker.sep': 'Thg 9',
  'datepicker.oct': 'Thg 10',
  'datepicker.nov': 'Thg 11',
  'datepicker.dec': 'Thg 12',

  // ===== Chọn =====
  'select.placeholder': 'Vui lòng chọn',
  'select.search': 'Tìm kiếm tùy chọn',
  'select.empty': 'Không có tùy chọn phù hợp',
  'select.loading': 'Đang tải...',
  'select.selectAll': 'Chọn tất cả',
  'select.clear': 'Xóa',
  'create.label': 'Tạo "{value}"',

  // ===== Cây =====
  'tree.empty': 'Không có dữ liệu',
  'tree.loading': 'Đang tải...',
  'tree.expandAll': 'Mở rộng tất cả',
  'tree.collapseAll': 'Thu gọn tất cả',
  'tree.checkedAll': 'Chọn tất cả',
  'tree.uncheckedAll': 'Bỏ chọn tất cả',

  // ===== Thông báo =====
  'message.success': 'Thành công',
  'message.error': 'Lỗi',
  'message.warning': 'Cảnh báo',
  'message.info': 'Thông tin',
  'notification.title': 'Thông báo',
  'notification.empty': 'Không có thông báo',
  'notification.markAllRead': 'Đánh dấu tất cả là đã đọc',
  'notification.viewAll': 'Xem tất cả',

  // ===== Trạng thái trống =====
  'empty.default': 'Không có dữ liệu',
  'empty.search': 'Không tìm thấy kết quả',
  'empty.networkError': 'Lỗi mạng',
  'empty.retry': 'Nhấp để thử lại',
  'empty.created': 'Bắt đầu tạo',
  'empty.error': 'Tải thất bại',
  'empty.no-data': 'Không có dữ liệu',
  'empty.no-permission': 'Không có quyền',
  'empty.no-result': 'Không tìm thấy kết quả phù hợp',

  // ===== Chủ đề =====
  'theme.light': 'Sáng',
  'theme.dark': 'Tối',
  'theme.system': 'Hệ thống',

  // ===== Ngôn ngữ =====
  'locale.switchLanguage': 'Chuyển ngôn ngữ',
  'locale.currentLanguage': 'Ngôn ngữ hiện tại',
} as const satisfies Record<string, string>;

export default viVN;
