/**
 * 单选组容器与单选项的出口。
 *
 * 选中态由 radix 通过 data-state 管理，组件不接收 v-model，
 * 因此自定义选项外观时必须沿用 data-state 选择器，不要另建状态。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\radio-group\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as RadioGroup } from './RadioGroup.vue';
export { default as RadioGroupItem } from './RadioGroupItem.vue';
