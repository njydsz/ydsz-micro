/**
 * 验证码输入四件套的出口：容器、分组、单格与分隔符。
 *
 * 分隔符单独导出，是为了支持 3-3、4-4 这类分组呈现；
 * 它不能放进分组内部，否则会打乱 radix 的索引计算。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\pin-input\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as PinInput } from './PinInput.vue';
export { default as PinInputGroup } from './PinInputGroup.vue';
export { default as PinInputInput } from './PinInputInput.vue';
export { default as PinInputSeparator } from './PinInputSeparator.vue';
