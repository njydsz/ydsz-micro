/**
 * 树形选择组件的出口，并透出 FlattenedItem 类型。
 *
 * 该类型必须导出：组件对外派发的 select / expand 等事件载荷是扁平化后的行对象，
 * 调用方若拿不到这个类型就无法为事件处理器标注类型。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tree\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZTree } from './tree.vue';
export type { FlattenedItem } from 'radix-vue';
