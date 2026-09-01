/**
 * 按钮族的出口：导出普通按钮、图标按钮、按钮组与可勾选按钮组。
 *
 * 四种形态共用同一套 variant / size 配置，因此一并导出，便于按需引入而不必
 * 为每种按钮各开一个子路径。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\button\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export type * from './button';
export { default as YDSZButtonGroup } from './button-group.vue';
export { default as YDSZButton } from './button.vue';
export { default as YDSZCheckButtonGroup } from './check-button-group.vue';
export { default as YDSZIconButton } from './icon-button.vue';

