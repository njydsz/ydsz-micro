/**
 * 验证码输入的出口：以 YDSZPinInput 导出 input.vue，并透出 props 类型。
 *
 * 文件名沿用 input.vue 而非 pin-input.vue，导出时再统一命名，
 * 以保持本目录内组件的命名一致性。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\pin-input\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZPinInput } from './input.vue';

export type * from './types';

