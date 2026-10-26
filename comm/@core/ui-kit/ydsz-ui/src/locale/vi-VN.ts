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
  'table.editCell': 'Sửa ô',
  'table.sortHint': 'Nhấp để sắp xếp, Shift+nhấp để thêm sắp xếp nhiều cột',
  'table.resizeColumn': 'Kéo để đổi kích thước cột',
  'table.dragColumn': 'Kéo để sắp xếp lại cột',

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
  'upload.clickToUpload': 'Nhấp để tải lên',
  'upload.dragTipPrefix': 'Kéo tệp vào đây, hoặc ',

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
  'datepicker.openCalendar': 'Mở lịch',
  'datepicker.previousMonth': 'Tháng trước',
  'datepicker.nextMonth': 'Tháng sau',

  // ===== Chọn =====
  'select.placeholder': 'Vui lòng chọn',
  'select.search': 'Tìm kiếm tùy chọn',
  'select.empty': 'Không có tùy chọn phù hợp',
  'select.loading': 'Đang tải...',
  'select.selectAll': 'Chọn tất cả',
  'select.clear': 'Xóa',
  'select.removeTag': 'Xóa',
  'create.label': 'Tạo "{value}"',

  // ===== Cây =====
  'tree.empty': 'Không có dữ liệu',
  'tree.loading': 'Đang tải...',
  'tree.expandAll': 'Mở rộng tất cả',
  'tree.collapseAll': 'Thu gọn tất cả',
  'tree.checkedAll': 'Chọn tất cả',
  'tree.uncheckedAll': 'Bỏ chọn tất cả',
  'tree.search': 'Tìm kiếm nút...',
  'tree.clearSearch': 'Xóa tìm kiếm',
  'tree.searchResults': 'Kết quả tìm kiếm',

  // ===== Thông báo =====
  'message.success': 'Thành công',
  'message.error': 'Lỗi',
  'message.warning': 'Cảnh báo',
  'message.info': 'Thông tin',
  'notification.title': 'Thông báo',
  'notification.empty': 'Không có thông báo',
  'notification.markAllRead': 'Đánh dấu tất cả là đã đọc',
  'notification.viewAll': 'Xem tất cả',
  'notification.closeAriaLabel': 'Đóng thông báo',

  // ===== Toast =====
  'toast.region': 'Thông báo',

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

  // ===== Ngôn ngữ =====
  'drawer.ariaLabel': 'Ngăn kéo',
  'drawer.close': 'Đóng',
  'drawer.closeAriaLabel': 'Đóng ngăn kéo',
  'drawer.confirm': 'Xác nhận',
  'drawer.cancel': 'Hủy',
  'autoComplete.placeholder': 'Nhập từ khóa',
  'autoComplete.emptyText': 'Không có mục trùng khớp',
  'autoComplete.loadingText': 'Đang tải...',
  'autoComplete.clearAriaLabel': 'Xóa nhập liệu',
  'fileUpload.clickToUpload': 'Nhấp hoặc kéo để tải lên',
  'fileUpload.dragAndDrop': 'Kéo tệp vào khu vực này',
  'fileUpload.fileSize': 'Kích thước',
  'orderList.moveToTop': 'Chuyển lên đầu',
  'orderList.moveUp': 'Di chuyển lên',
  'orderList.moveDown': 'Di chuyển xuống',
  'orderList.moveToBottom': 'Chuyển xuống cuối',
  'orderList.filterPlaceholder': 'Tìm kiếm',
  'pickList.sourceLabel': 'Danh sách nguồn',
  'pickList.targetLabel': 'Danh sách đích',
  'pickList.moveToTarget': 'Chuyển sang đích',
  'pickList.moveToSource': 'Chuyển về nguồn',
  'pickList.moveAllToTarget': 'Chuyển tất cả sang đích',
  'pickList.moveAllToSource': 'Chuyển tất cả về nguồn',
  'pickList.filterPlaceholder': 'Tìm kiếm',
  'qrCode.download': 'Tải mã QR',
  'splitButton.toggleDropdown': 'Bật hoặc tắt trình đơn thả xuống',
  'orgChart.search': 'Tìm {field}...',
} as const satisfies Record<string, string>;

export default viVN;
