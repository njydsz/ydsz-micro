/**
 * 组件类型枚举（注册 Element Plus 组件到全局）。
 *
 * @path apps/generator-web/src/adapter/component/component-type.ts
 * @since 1.0.0
 */
export interface ComponentType {
  // Element Plus 基础组件
  ElInput: typeof import('element-plus')['ElInput'];
  ElInputNumber: typeof import('element-plus')['ElInputNumber'];
  ElSelect: typeof import('element-plus')['ElSelect'];
  ElOption: typeof import('element-plus')['ElOption'];
  ElSwitch: typeof import('element-plus')['ElSwitch'];
  ElDatePicker: typeof import('element-plus')['ElDatePicker'];
  ElTreeSelect: typeof import('element-plus')['ElTreeSelect'];
  ElCheckbox: typeof import('element-plus')['ElCheckbox'];
  ElRadioGroup: typeof import('element-plus')['ElRadioGroup'];
  El Radio: typeof import('element-plus')['ElRadio'];
  ElCascader: typeof import('element-plus')['ElCascader'];
  ElSlider: typeof import('element-plus')['ElSlider'];
  ElRate: typeof import('element-plus')['ElRate'];
  ElColorPicker: typeof import('element-plus')['ElColorPicker'];
}
