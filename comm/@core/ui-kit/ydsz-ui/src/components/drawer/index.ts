/**
 * YdDrawer 侧滑抽屉组件出口。
 *
 * <p>提供两种调用方式：
 * <ul>
 *   <li>声明式：通过 v-model:open 双向绑定</li>
 *   <li>命令式：通过 useDrawer().drawer.open(options)</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdDrawer } from './YdDrawer.vue';
export { default as YdDrawerContainer } from './YdDrawerContainer.vue';
export { useDrawer } from './use-drawer';

export type {
  DrawerApi,
  DrawerCloseReason,
  DrawerEntry,
  DrawerInstance,
  DrawerOptions,
  DrawerPosition,
  DrawerPt,
  DrawerPt as YdDrawerPt,
  YdDrawerEmits,
  YdDrawerProps,
} from './types';
