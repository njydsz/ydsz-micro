/**
 * 描述列表组件出口：YdDescriptions 容器 + YdDescriptionsItem 字段项。
 *
 * 替代 EP 的 `ElDescriptions` / `ElDescriptionsItem`，
 * 基于 CSS Grid 实现列布局与 span 合并，无 JS 运行时依赖。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\descriptions\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdDescriptions } from './YdDescriptions.vue';
export { default as YdDescriptionsItem } from './YdDescriptionsItem.vue';
export {
  DESCRIPTIONS_BORDER,
  DESCRIPTIONS_COLUMN,
  DESCRIPTIONS_SIZE,
  type DescriptionsSize,
} from './constants';
