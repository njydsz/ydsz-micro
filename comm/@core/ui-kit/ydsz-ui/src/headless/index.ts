/**
 * ydsz-ui 纯逻辑层：Headless Composables
 *
 * 此目录下的 composable 只负责业务状态与交互逻辑——不持有任何 class、不渲染任何 DOM。
 * 上层 styled 组件（src/ui/*）消费这些 composable，注入样式 class 与模板骨架。
 *
 * 目录结构约定：
 *  - use-{component}-headless.ts：单个组件的状态管理；
 *  - use-{component}-keyboard.ts：键盘导航逻辑（多方向、多选等）。
 *
 * 何时抽 headless：
 *  - 同一个逻辑需要在 ≥2 个 styled 组件间复用；
 *  - 逻辑复杂度足够高（>300 行），单独提取利于单元测试覆盖率。
 *
 * 何时不抽：
 *  - 逻辑与样式天生绑定（如 YdDialog 的焦点陷阱动画）——此时 radix-vue 本身就是 headless 层。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\headless\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { useSelectHeadless } from './use-select-headless';
export type {
  SelectHeadlessHandle,
  UseSelectHeadlessOptions,
} from './use-select-headless';

export { useTreeDrag } from './use-tree-drag';
export type {
  TreeDragState,
  TreeDropPosition,
  UseTreeDragOptions,
} from './use-tree-drag';

export { useTreeHeadless } from './use-tree-headless';
export type {
  TreeHeadlessHandle,
  TreeNodeLike,
  UseTreeHeadlessOptions,
} from './use-tree-headless';
