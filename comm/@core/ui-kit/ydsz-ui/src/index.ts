/**
 * ydsz-ui 包的总出口：聚合 components（组合式封装）与 primitives（原子组件）两个来源。
 *
 * 额外直接透出 ydsz-vue 的 createContext / Slot / VisuallyHidden，
 * 是为了让上层业务不必为了写一个新的 shadcn 风格组件而再去直接依赖底层包 ——
 * 这三个工具是自定义组件时最常用的，统一从这里取可以保证版本与本包一致。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\index.ts
 * @author ydsz-team
 * @since 26.09.17
 */
export * from './components';
export * from './composables';
export * from './headless';
export * from './locale';
export * from './primitives';

export { createContext, Slot, VisuallyHidden } from '@ydsz-core/ydsz-vue';
