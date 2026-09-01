/**
 * 全局状态组合式函数的统一导出入口。
 *
 * 为子应用提供 Vue 组合式 API 以响应式访问微前端全局状态，
 * 屏蔽底层内核差异（qiankun / micro-kernel），保持使用方式一致。
 *
 * @path comm\effects\micro-runtime\src\composable\index.ts
 * @author ydsz-team
 * @since 3.0.0
 */
export * from './use-global-state';
