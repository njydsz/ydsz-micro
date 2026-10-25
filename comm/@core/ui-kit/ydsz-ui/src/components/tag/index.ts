/**
 * 标签组件 barrel —— 含基础 YdTag + 可选封装 YdTagCheckable。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdTag } from './YdTag.vue';
export { default as YdTagCheckable } from './YdTagCheckable.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as ydTag } from './tag.vue';
export type { TagProps, TagEmits, TagVariant, TagSize } from './tag-types';
