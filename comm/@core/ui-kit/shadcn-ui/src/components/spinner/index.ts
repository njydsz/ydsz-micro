/**
 * 加载指示器的出口：同时给出 YDSZSpinner（整块遮罩 + 背景模糊）与 YDSZLoading（带文案）。
 *
 * 两者共用同一套最短展示时长策略，差别只在呈现层；
 * 一并导出是为了让调用方按遮挡范围选择，而不是靠传参切换形态。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\spinner\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZLoading } from './loading.vue';
export { default as YDSZSpinner } from './spinner.vue';
