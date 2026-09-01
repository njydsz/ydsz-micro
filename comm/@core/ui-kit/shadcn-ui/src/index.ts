/**
 * shadcn-ui 包的总出口：聚合 components（组合式封装）与 ui（原子组件）两个来源。
 *
 * 额外直接透出 radix-vue 的 createContext / Slot / VisuallyHidden，
 * 是为了让上层业务不必为了写一个新的 shadcn 风格组件而再去依赖 radix-vue ——
 * 这三个工具是自定义组件时最常用的，统一从这里取可以保证版本与本包一致。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './components';
export * from './ui';
export { createContext, Slot, VisuallyHidden } from 'radix-vue';
