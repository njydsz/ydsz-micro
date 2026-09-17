/**
 * 头像三件套（容器 / 图片 / 兜底）与 cva 变体的出口。
 *
 * 变体与组件分开导出，是为了让「只想复用头像尺寸类名」的场景
 * （例如给一个非 YdAvatarBase 的元素套同样的圆形和尺寸）不必引入组件实现。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\avatar\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './avatar';
export { default as YdAvatarBase } from './YdAvatarBase.vue';
export { default as YdAvatarFallbackBase } from './YdAvatarFallbackBase.vue';
export { default as YdAvatarImageBase } from './YdAvatarImageBase.vue';
