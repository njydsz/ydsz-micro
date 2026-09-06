/**
 * 组件统一导出入口。
 *
 * <p>集中导出 generator-web 业务组件，供视图层统一 import。
 *
 * @path apps/generator-web/src/components/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { default as CodeDiffViewer } from './code-diff-viewer/index.vue';
export type { DiffLine } from './code-diff-viewer/index.vue';
export { diffLines } from './code-diff-viewer/index.vue';
