/**
 * 组件统一导出（barrel file）
 *
 * @path comm\effects\shared-business\src\components\index.ts
 * @author ydsz-team
 * @since 1.2.0
 *
 * @remarks
 * 所有共享业务组件的单一对外入口。
 * 子应用推荐从此路径导入，保持 import 语句稳定。
 */

// —— 异步状态容器（loading/error/empty/data 自动切换） ——
export { default as AsyncState } from './async-state.vue';

// —— 统一空状态组件 ——
export { default as EmptyState } from './empty-state.vue';

// —— 统一错误状态组件 ——
export { default as ErrorState } from './error-state.vue';

// —— 状态徽章组件 — 统一的项目/任务/审批状态展示 ——
export { default as StatusBadge } from './status-badge.vue';

// —— 用户头像组件 — 含在线状态、角色标签 ——
export { default as UserAvatar } from './user-avatar.vue';

// —— 字典选择器组件 — 从全局字典缓存获取数据 ——
export { default as DictSelect } from './dict-select.vue';

// —— 字典标签组件 — 字典值渲染为彩色标签（表格列常用） ——
export { default as DictTag } from './dict-tag.vue';

// —— 文件类型图标组件 ——
export { default as FileIcon } from './file-icon.vue';

// —— Excel 导出按钮组件 — 声明式导出 ——
export { default as ExcelExportButton } from './excel-export-button.vue';

// —— Excel 导入按钮组件 — 声明式导入 ——
export { default as ExcelImportButton } from './excel-import-button.vue';

// —— 键盘快捷键帮助面板 ——
export { default as KeyboardHelp } from './keyboard-help.vue';

// —— 大数据量下拉选择器 ——
export { default as VirtualSelect } from './virtual-select.vue';

// —— 通用虚拟列表 ——
export { default as VirtualList } from './virtual-list.vue';

// —— 用户操作引导组件 ——
export { default as AppTour } from './app-tour.vue';

// —— 审批历史时间轴组件 ——
export { default as ApprovalTimeline } from './approval-timeline.vue';
export type { ApprovalRecord } from './approval-timeline.vue';

// —— 审计日志表格组件 ——
export { default as AuditLogTable } from './audit-log-table.vue';

// —— 二次身份验证弹窗组件 — 程序化弹窗，安全约束完善 ——
export { default as SecondaryAuthModal } from './secondary-auth-modal/index.vue';
