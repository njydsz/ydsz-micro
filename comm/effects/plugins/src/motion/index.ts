/**
 * 入场动画（@vueuse/motion）的统一导出入口。
 *
 * 提供 Motion / MotionGroup 组件与 MotionDirective 指令，
 * 并内置 26 种预设动画名称常量（MotionPresets）。
 *
 * @path comm\effects\plugins\src\motion\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './types';

export {
  MotionComponent as Motion,
  MotionDirective,
  MotionGroupComponent as MotionGroup,
  MotionPlugin,
} from '@vueuse/motion';
