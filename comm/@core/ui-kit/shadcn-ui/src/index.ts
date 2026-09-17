/**
 * shadcn-ui 包的总出口：聚合 components（组合式封装）与 ui（原子组件）两个来源。
 *
 * 额外直接透出 radix-vue 的 createContext / Slot / VisuallyHidden，
 * 是为了让上层业务不必为了写一个新的 shadcn 风格组件而再去依赖 radix-vue ——
 * 这三个工具是自定义组件时最常用的，统一从这里取可以保证版本与本包一致。
 *
 * 新增 composables:
 *  - useIdleHydrate / useSimpleIdleHydrate：空闲期延迟挂载
 *  - useChunkUpload：分片上传 + 秒传 + 断点续传
 *  - useVirtualList：虚拟列表（基于 scroll 位置计算可见区间）
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\index.ts
 * @author ydsz-team
 * @since 26.09.17
 */
export * from './components';
export * from './composables';
export * from './headless';
export * from './primitives';
export { createContext, Slot, VisuallyHidden } from 'radix-vue';
