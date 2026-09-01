/**
 * ECharts 插件的统一导出入口。
 *
 * 提供按需注册的 echarts 命名空间（含组件注册）、
 * 响应式主题适配的组合式函数（useEcharts）以及 UI 包装组件（EchartsUI）。
 *
 * @path comm\effects\plugins\src\echarts\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './echarts';
export { default as EchartsUI } from './echarts-ui.vue';
export * from './use-echarts';
