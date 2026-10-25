/**
 * 头像组件的出口：以 YdAvatarSmart 之名导出，与其它组件保持统一前缀。
 *
 * 统一加 Yd 前缀是为了避免与业务侧、第三方库里的同名 YdAvatarSmart 在模板中冲突，
 * 批量引入时能一眼区分来源。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\avatar\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdAvatarSmart } from './YdAvatarSmart.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export * from './avatar';
export { default as YdAvatar } from './YdAvatar.vue';
export { default as YdAvatarFallback } from './YdAvatarFallback.vue';
export { default as YdAvatarImage } from './YdAvatarImage.vue';
export { default as ydAvatar } from './avatar.vue';
export type { AvatarProps } from './avatar-types';

// 兼容旧引用名（消费方仍以 *Base 命名引用原子组件）
export { default as YdAvatarBase } from './YdAvatar.vue';
export { default as YdAvatarFallbackBase } from './YdAvatarFallback.vue';
export { default as YdAvatarImageBase } from './YdAvatarImage.vue';
