/**
 * YdTour（漫游引导）组件入口。
 *
 * 对标 EP Tour / ANT Tour 的完整多步引导能力，包含：
 * - YdTour 主控制器
 * - YdTourMask 遮罩 + spotlight
 * - YdTourStep 单步面板
 *
 * @module primitives/tour
 * @author ydsz-team
 * @since 1.0.0 (26.10.10 扩展为完整 Tour)
 */

export { default as YdTour } from './YdTour.vue';

export type {
  TourStep,
  YdTourProps,
  YdTourEmits,
  PopoverPlacement,
  TourPopoverStyle,
} from './tour-types';
