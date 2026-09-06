/**
 * 组件类型声明（全局组件类型映射）。
 *
 * @path apps/generator-web/src/adapter/component/component-type.ts
 * @since 1.0.0
 */
export interface ComponentType {
  /** Element Plus 组件占位符（实际类型由 registerElementPlusComponents 内部定义） */
  [key: string]: unknown;
}
