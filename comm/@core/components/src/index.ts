/**
 * comm/@core/components 统一导出入口。
 *
 * <p>聚合所有 @core/components 下的 self-contained UI 组件。
 * 各组件通过 <code>index.vue</code> 单文件或 <code>src/onboarding-tour.vue</code> 形式组织，
 * 由本文件统一暴露，外部通过 <code>import { OnboardingTour } from '@ydsz-core/components'</code> 引入。
 *
 * @path comm\@core\components\src\index.ts
 * @author ydsz-team
 * @since 27.01.04
 */

export { default as OnboardingTour } from './onboarding-tour.vue';
export type { TourStep, TourPopoverPosition } from './onboarding-tour.vue';
