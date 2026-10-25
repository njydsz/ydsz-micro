/**
 * ydsz-ui ข้อความภาษาไทยในตัวของคอมโพเนนต์（th-TH）。
 *
 * โครงสร้างคีย์ตรงกับ zh-CN.ts อย่างเคร่งครัด;
 * รองรับตัวแปลง {placeholder}
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\th-TH.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** ตารางข้อความภาษาไทย —— 泰语 */
export const thTH = {
  // ===== ทั่วไป =====
  'common.confirm': 'ยืนยัน',
  'common.cancel': 'ยกเลิก',
  'common.loading': 'กำลังโหลด...',
  'common.search': 'ค้นหา',
  'common.reset': 'รีเซ็ต',
  'common.submit': 'ส่ง',
  'common.close': 'ปิด',
  'common.more': 'เพิ่มเติม',
  'common.expand': 'ขยาย',
  'common.collapse': 'ยุบ',
  'common.copy': 'คัดลอก',
  'common.copied': 'คัดลอกแล้ว',
  'common.delete': 'ลบ',
  'common.edit': 'แก้ไข',
  'common.add': 'เพิ่ม',
  'common.save': 'บันทึก',
  'common.refresh': 'รีเฟรช',

  // ===== ตาราง =====
  'table.empty': 'ไม่มีข้อมูล',
  'table.loading': 'กำลังโหลด...',
  'table.total': '{count} รายการ',
  'table.page': 'หน้า {page}',
  'table.filter.confirm': 'กรอง',
  'table.filter.reset': 'รีเซ็ต',
  'table.sort.asc': 'จากน้อยไปมาก',
  'table.sort.desc': 'จากมากไปน้อย',
  'table.selectAll': 'เลือกทั้งหมด',
  'table.selectRow': 'เลือกแถวนี้',
  'table.cancelSelect': 'ยกเลิกการเลือก',
  'table.expandedRow': 'ขยายแถว',
  'table.collapseRow': 'ยุบแถว',
  'table.columnSetting': 'ตั้งค่าคอลัมน์',

  // ===== ฟอร์ม =====
  'form.validating': 'กำลังตรวจสอบ...',
  'form.submitting': 'กำลังส่ง...',
  'form.required': 'จำเป็นต้องกรอก',
  'form.invalid': 'รูปแบบไม่ถูกต้อง',
  'form.passwordMismatch': 'รหัสผ่านไม่ตรงกัน',
  'form.validateSuccess': 'ผ่านการตรวจสอบ',
  'form.validateFailed': 'การตรวจสอบล้มเหลว กรุณาตรวจสอบข้อมูล',

  // ===== กล่องโต้ตอบ =====
  'dialog.close': 'ปิด',
  'dialog.confirm': 'ยืนยัน',
  'dialog.cancel': 'ยกเลิก',
  'dialog.deleteConfirm': 'ยืนยันการลบ?',
  'dialog.deleteWarning': 'การดำเนินการนี้ไม่สามารถยกเลิกได้',

  // ===== อัปโหลด =====
  'upload.drag': 'คลิกหรือลากไฟล์มาที่นี่เพื่ออัปโหลด',
  'upload.dragging': 'ปล่อยเพื่ออัปโหลด',
  'upload.error': 'อัปโหลดล้มเหลว',
  'upload.success': 'อัปโหลดสำเร็จ',
  'upload.preview': 'ดูตัวอย่าง',
  'upload.remove': 'ลบ',
  'upload.retry': 'ลองใหม่',
  'upload.maxSize': 'ขนาดไฟล์เกินขีดจำกัด',
  'upload.maxCount': 'จำนวนไฟล์เกินขีดจำกัด',
  'upload.invalidFormat': 'รูปแบบไฟล์ไม่รองรับ',

  // ===== การแบ่งหน้า =====
  'pagination.page': '',
  'pagination.total': 'ทั้งหมด {count} รายการ',
  'pagination.size': '/ หน้า',
  'pagination.jumpTo': 'ไปที่',
  'pagination.prev': 'ก่อนหน้า',
  'pagination.next': 'ถัดไป',
  'pagination.first': 'แรก',
  'pagination.last': 'สุดท้าย',

  // ===== เลือกวันที่ =====
  'datepicker.placeholder': 'เลือกวันที่',
  'datepicker.startPlaceholder': 'วันที่เริ่มต้น',
  'datepicker.endPlaceholder': 'วันที่สิ้นสุด',
  'datepicker.today': 'วันนี้',
  'datepicker.yesterday': 'เมื่อวาน',
  'datepicker.thisWeek': 'สัปดาห์นี้',
  'datepicker.thisMonth': 'เดือนนี้',
  'datepicker.thisYear': 'ปีนี้',
  'datepicker.clear': 'ลบ',
  'datepicker.confirm': 'ยืนยัน',
  'datepicker.mon': 'จ.',
  'datepicker.tue': 'อ.',
  'datepicker.wed': 'พ.',
  'datepicker.thu': 'พฤ.',
  'datepicker.fri': 'ศ.',
  'datepicker.sat': 'ส.',
  'datepicker.sun': 'อา.',
  'datepicker.jan': 'ม.ค.',
  'datepicker.feb': 'ก.พ.',
  'datepicker.mar': 'มี.ค.',
  'datepicker.apr': 'เม.ย.',
  'datepicker.may': 'พ.ค.',
  'datepicker.jun': 'มิ.ย.',
  'datepicker.jul': 'ก.ค.',
  'datepicker.aug': 'ส.ค.',
  'datepicker.sep': 'ก.ย.',
  'datepicker.oct': 'ต.ค.',
  'datepicker.nov': 'พ.ย.',
  'datepicker.dec': 'ธ.ค.',

  // ===== ตัวเลือก =====
  'select.placeholder': 'กรุณาเลือก',
  'select.search': 'ค้นหาตัวเลือก',
  'select.empty': 'ไม่พบตัวเลือกที่ตรงกัน',
  'select.loading': 'กำลังโหลด...',
  'select.selectAll': 'เลือกทั้งหมด',
  'select.clear': 'ล้าง',
  'select.removeTag': 'ลบ',
  'create.label': 'สร้าง "{value}"',

  // ===== ต้นไม้ =====
  'tree.empty': 'ไม่มีข้อมูล',
  'tree.loading': 'กำลังโหลด...',
  'tree.expandAll': 'ขยายทั้งหมด',
  'tree.collapseAll': 'ยุบทั้งหมด',
  'tree.checkedAll': 'เลือกทั้งหมด',
  'tree.uncheckedAll': 'ยกเลิกการเลือกทั้งหมด',

  // ===== การแจ้งเตือน =====
  'message.success': 'สำเร็จ',
  'message.error': 'ข้อผิดพลาด',
  'message.warning': 'คำเตือน',
  'message.info': 'ข้อมูล',
  'notification.title': 'การแจ้งเตือน',
  'notification.empty': 'ไม่มีการแจ้งเตือน',
  'notification.markAllRead': 'ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว',
  'notification.viewAll': 'ดูทั้งหมด',
  'notification.closeAriaLabel': 'ปิดการแจ้งเตือน',

  // ===== Toast =====
  'toast.region': 'การแจ้งเตือน',

  // ===== สถานะว่างเปล่า =====
  'empty.default': 'ไม่มีข้อมูล',
  'empty.search': 'ไม่พบผลลัพธ์',
  'empty.networkError': 'ข้อผิดพลาดเครือข่าย',
  'empty.retry': 'คลิกเพื่อลองใหม่',
  'empty.created': 'เริ่มสร้าง',
  'empty.error': 'โหลดไม่สำเร็จ',
  'empty.no-data': 'ไม่มีข้อมูล',
  'empty.no-permission': 'ไม่มีสิทธิ์',
  'empty.no-result': 'ไม่พบผลลัพธ์ที่ตรงกัน',

  // ===== ธีม =====
  'theme.light': 'สว่าง',
  'theme.dark': 'มืด',
  'theme.system': 'ระบบ',

  // ===== ภาษา =====
  'locale.switchLanguage': 'เปลี่ยนภาษา',
  'locale.currentLanguage': 'ภาษาปัจจุบัน',
} as const satisfies Record<string, string>;

export default thTH;
