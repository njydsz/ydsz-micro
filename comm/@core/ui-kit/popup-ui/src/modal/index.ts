/**
 * 弹窗子模块的类型出口：对外只暴露 modal.ts 中的类型契约。
 *
 * 与抽屉保持一致的结构，组件与 API 统一由上层导出，避免重复引入路径。
 *
 * @path comm\@core\ui-kit\popup-ui\src\modal\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export type * from './modal';
export { default as YdModal } from './YdModal.vue';
export { setDefaultYdModalProps, useYdModal } from './use-modal';
