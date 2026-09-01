/**
 * Pinia Store 统一导出入口，聚合状态管理 Store、初始化函数及 Pinia 原始 API。
 *
 * @path comm\stores\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './modules';
export * from './setup';
export { defineStore, storeToRefs } from 'pinia';
