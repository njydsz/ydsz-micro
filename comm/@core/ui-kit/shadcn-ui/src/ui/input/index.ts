/**
 * 输入框组件的出口。
 *
 * 单独成目录而非与 Textarea 合并，是因为两者的值语义不同
 * （单行文本 vs 多行文本），合并会引入不必要的类型分支。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\input\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Input } from './Input.vue';
