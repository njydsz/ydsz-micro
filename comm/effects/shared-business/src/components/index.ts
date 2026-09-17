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
export { default as YdAsyncState } from './YdAsyncState.vue';

// —— 统一空状态组件 ——
export { default as YdEmptyState } from './YdCommonEmptyState.vue';

// —— 统一错误状态组件 ——
export { default as YdErrorState } from './YdErrorState.vue';

// —— 状态徽章组件 — 统一的项目/任务/审批状态展示 ——
export { default as YdStatusBadge } from './YdBizStatusBadge.vue';

// —— 用户头像组件 — 含在线状态、角色标签 ——
export { default as YdUserAvatar } from './YdUserAvatar.vue';

// —— 字典选择器组件 — 从全局字典缓存获取数据 ——
export { default as YdDictSelect } from './YdDictSelect.vue';

// —— 字典标签组件 — 字典值渲染为彩色标签（表格列常用） ——
export { default as YdDictTag } from './YdDictTag.vue';

// —— 文件类型图标组件 ——
export { default as YdFileIcon } from './YdFileIcon.vue';

// —— Excel 导出按钮组件 — 声明式导出 ——
export { default as YdExcelExportButton } from './YdExcelExportButton.vue';

// —— Excel 导入按钮组件 — 声明式导入 ——
export { default as YdExcelImportButton } from './YdExcelImportButton.vue';

// —— 键盘快捷键帮助面板 ——
export { default as YdKeyboardHelp } from './YdKeyboardHelp.vue';

// —— 大数据量下拉选择器 ——
export { default as YdVirtualSelect } from './YdVirtualSelect.vue';

// —— 通用虚拟列表 ——
export { default as YdVirtualList } from './YdVirtualList.vue';

// —— 用户操作引导组件 ——
export { default as YdAppTour } from './YdAppTour.vue';

// —— 审批历史时间轴组件 ——
export { default as YdApprovalTimeline } from './YdApprovalTimeline.vue';
export type { ApprovalRecord } from './YdApprovalTimeline.vue';

// —— 二次身份验证弹窗组件 — 程序化弹窗，安全约束完善 ——
export { default as YdSecondaryAuthModal } from './secondary-auth-modal/YdSecondaryAuthModal.vue';
