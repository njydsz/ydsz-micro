/**
 * LoadingBar 顶部加载进度条组件出口。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\loading-bar\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdLoadingBar } from './YdLoadingBar.vue';
export {
  useLoadingBar,
  loadingBar,
  configureLoadingBar,
  startLoadingBar,
  setLoadingBarProgress,
  finishLoadingBar,
} from './use-loading-bar';
export type * from './types';
