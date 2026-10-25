/**
 * YdTour（漫游引导）组件入口。
 *
 * 对标 EP Tour / ANT Tour 的完整多步引导能力，公开出口为：
 * - YdTour 主控制器
 * - YdTourStep 单步内容面板
 *
 * YdTourMask 只由 YdTour 内部组合，不对外导出。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tour\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { default as YdTour } from './YdTour.vue';
export { default as YdTourStep } from './YdTourStep.vue';

export type {
  PopoverPlacement,
  TourPopoverStyle,
  TourStep,
  YdTourEmits,
  YdTourProps,
} from './tour-types';
