/**
 * 分段控制器的数据契约：label 负责展示、value 作为选中值，与 YdTabs 的 value 语义一致。
 *
 * 刻意沿用 YdTabs 的取值语义，同一份数组可以直接喂给 segmented 与 YdTabs，
 * 在两种交互形态之间切换时无需做数据结构转换。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\segmented\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */
interface SegmentedItem {
  label: string;
  value: string;
}

export type { SegmentedItem };
