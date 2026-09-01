/**
 * Button 原子组件的出口：导出组件本体、变体定义与类型。
 *
 * 变体（button）与类型（types）分开导出，使只想复用变体类名、不渲染组件的场景
 * （如给原生元素套按钮样式）不必引入组件实现。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\button\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './button';

export { default as Button } from './Button.vue';

export type * from './types';
