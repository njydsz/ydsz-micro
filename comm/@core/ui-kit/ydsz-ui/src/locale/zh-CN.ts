/**
 * ydsz-ui 组件内置中文文案。
 *
 * 包含组件内部硬编码的简短字符串（空状态、加载态、校验态等）。
 * 业务方可通过 ConfigProvider 的 locale 属性覆盖任意字段。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\zh-CN.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 中文文案表 */
export const zhCN: Record<string, string> = {
  // YdTable
  'table.empty': '暂无数据',
  'table.loading': '加载中...',
  // YdFormMessage / YdForm
  'form.validating': '校验中...',
  'form.submitting': '提交中...',
  // YdSheet / YdDialog
  'dialog.close': '关闭',
  // useTheme
  'theme.toggle': '切换主题',
  // YdConfigProvider（通用）
  'common.confirm': '确认',
  'common.cancel': '取消',
  'common.loading': '加载中...',
};

export default zhCN;
