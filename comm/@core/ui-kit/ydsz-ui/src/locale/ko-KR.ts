/**
 * ydsz-ui 컴포넌트 내장 한국어 文案（ko-KR）。
 *
 * zh-CN.ts 와 키 구조를 엄격하게 일치시킬 것.
 * {placeholder} 보간 지원.
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\ko-KR.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 한국어 메시지 테이블 —— 韩语 */
export const koKR = {
  // ===== 공통 =====
  'common.confirm': '확인',
  'common.cancel': '취소',
  'common.loading': '로딩 중...',
  'common.search': '검색',
  'common.reset': '초기화',
  'common.submit': '제출',
  'common.close': '닫기',
  'common.more': '더보기',
  'common.expand': '펼치기',
  'common.collapse': '접기',
  'common.copy': '복사',
  'common.copied': '복사됨',
  'common.delete': '삭제',
  'common.edit': '편집',
  'common.add': '추가',
  'common.save': '저장',
  'common.refresh': '새로고침',

  // ===== 테이블 =====
  'table.empty': '데이터 없음',
  'table.loading': '로딩 중...',
  'table.total': '총 {count}건',
  'table.page': '{page}페이지',
  'table.filter.confirm': '필터',
  'table.filter.reset': '초기화',
  'table.sort.asc': '오름차순',
  'table.sort.desc': '내림차순',
  'table.selectAll': '전체 선택',
  'table.selectRow': '이 행 선택',
  'table.cancelSelect': '선택 취소',
  'table.expandedRow': '행 펼치기',
  'table.collapseRow': '행 접기',
  'table.columnSetting': '열 설정',

  // ===== 폼 =====
  'form.validating': '검증 중...',
  'form.submitting': '제출 중...',
  'form.required': '필수 입력 항목입니다',
  'form.invalid': '형식이 올바르지 않습니다',
  'form.passwordMismatch': '비밀번호가 일치하지 않습니다',
  'form.validateSuccess': '검증 통과',
  'form.validateFailed': '검증 실패, 입력 내용을 확인하세요',

  // ===== 대화상자 =====
  'dialog.close': '닫기',
  'dialog.confirm': '확인',
  'dialog.cancel': '취소',
  'dialog.deleteConfirm': '삭제하시겠습니까?',
  'dialog.deleteWarning': '이 작업은 실행 취소할 수 없습니다',

  // ===== 업로드 =====
  'upload.drag': '클릭하거나 파일을 여기로 드래그하여 업로드',
  'upload.dragging': '파일을 놓아 업로드',
  'upload.error': '업로드 실패',
  'upload.success': '업로드 성공',
  'upload.preview': '미리보기',
  'upload.remove': '제거',
  'upload.retry': '다시 시도',
  'upload.maxSize': '파일 크기 제한 초과',
  'upload.maxCount': '파일 수 제한 초과',
  'upload.invalidFormat': '지원되지 않는 파일 형식',

  // ===== 페이지네이션 =====
  'pagination.page': '페이지',
  'pagination.total': '총 {count}건',
  'pagination.size': '/페이지',
  'pagination.jumpTo': '이동',
  'pagination.prev': '이전',
  'pagination.next': '다음',
  'pagination.first': '처음',
  'pagination.last': '마지막',

  // ===== 날짜 선택기 =====
  'datepicker.placeholder': '날짜 선택',
  'datepicker.startPlaceholder': '시작일',
  'datepicker.endPlaceholder': '종료일',
  'datepicker.today': '오늘',
  'datepicker.yesterday': '어제',
  'datepicker.thisWeek': '이번 주',
  'datepicker.thisMonth': '이번 달',
  'datepicker.thisYear': '올해',
  'datepicker.clear': '지우기',
  'datepicker.confirm': '확인',
  'datepicker.mon': '월',
  'datepicker.tue': '화',
  'datepicker.wed': '수',
  'datepicker.thu': '목',
  'datepicker.fri': '금',
  'datepicker.sat': '토',
  'datepicker.sun': '일',
  'datepicker.jan': '1월',
  'datepicker.feb': '2월',
  'datepicker.mar': '3월',
  'datepicker.apr': '4월',
  'datepicker.may': '5월',
  'datepicker.jun': '6월',
  'datepicker.jul': '7월',
  'datepicker.aug': '8월',
  'datepicker.sep': '9월',
  'datepicker.oct': '10월',
  'datepicker.nov': '11월',
  'datepicker.dec': '12월',

  // ===== 선택기 =====
  'select.placeholder': '선택해 주세요',
  'select.search': '옵션 검색',
  'select.empty': '일치하는 옵션 없음',
  'select.loading': '로딩 중...',
  'select.selectAll': '전체 선택',
  'select.clear': '비우기',
  'select.removeTag': '제거',
  'create.label': '"{value}" 만들기',

  // ===== 트리 =====
  'tree.empty': '데이터 없음',
  'tree.loading': '로딩 중...',
  'tree.expandAll': '모두 펼치기',
  'tree.collapseAll': '모두 접기',
  'tree.checkedAll': '모두 선택',
  'tree.uncheckedAll': '선택 해제',

  // ===== 알림 =====
  'message.success': '성공',
  'message.error': '오류',
  'message.warning': '경고',
  'message.info': '정보',
  'notification.title': '알림',
  'notification.empty': '알림 없음',
  'notification.markAllRead': '모두 읽음으로 표시',
  'notification.viewAll': '모두 보기',
  'notification.closeAriaLabel': '알림 닫기',

  // ===== Toast =====
  'toast.region': '알림',

  // ===== 빈 상태 =====
  'empty.default': '데이터 없음',
  'empty.search': '일치하는 결과 없음',
  'empty.networkError': '네트워크 오류',
  'empty.retry': '클릭하여 다시 시도',
  'empty.created': '만들기 시작',
  'empty.error': '로딩 실패',
  'empty.no-data': '데이터 없음',
  'empty.no-permission': '권한 없음',
  'empty.no-result': '일치하는 결과 없음',

  // ===== 테마 =====
  'theme.light': '밝은',
  'theme.dark': '어두운',
  'theme.system': '시스템',

  // ===== 로케일 =====
  'locale.switchLanguage': '언어 전환',
  'locale.currentLanguage': '현재 언어',
} as const satisfies Record<string, string>;

export default koKR;
