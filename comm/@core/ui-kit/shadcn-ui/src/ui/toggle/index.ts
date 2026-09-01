/**
 * 切换按钮组件与其 cva 变体的出口。
 *
 * 变体必须一并导出：ToggleGroup 通过 provide 把 variant / size 下发给组内项，
 * 调用方需要引用同一份变体类型才能拿到正确的取值联合。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\toggle\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './toggle';
export { default as Toggle } from './Toggle.vue';
