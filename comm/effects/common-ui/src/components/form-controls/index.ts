/**
 * 表单控件适配层 —— shadcn-ui 原子件与 form-ui 注册表之间的 modelValue 桥。
 *
 * 背景：radix 系原子件沿用 v-model:checked 等根约定，而 form-ui 注册表
 * 统一以 modelValue 绑定（COMPONENT_BIND_EVENT_MAP 仅对个别键特判）。
 * 本目录把「值桥接 + options 驱动 + 组合装配」封装为开箱即用的表单控件，
 * 供 main 与 shared-business 两处组件注册表共用，避免双份实现。
 *
 * 命名约定：文件 kebab-case（业务层 §4.4），导出名 Form* 前缀。
 *
 * @path comm\effects\common-ui\src\components\form-controls\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as FormCheckbox } from './form-checkbox.vue';
export { default as FormCheckboxGroup } from './form-checkbox-group.vue';
export { default as FormInputNumber } from './form-input-number.vue';
export { default as FormRadioGroup } from './form-radio-group.vue';
export { default as FormSpace } from './form-space.vue';
export { default as FormSwitch } from './form-switch.vue';
export { default as FormTimePicker } from './form-time-picker.vue';
export { default as FormTreeSelect } from './form-tree-select.vue';
export { default as FormUpload } from './form-upload.vue';
