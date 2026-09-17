/**
 * 回到顶部组件的出口：导出 YdBackTop。
 *
 * 仅透出组件本体；props 类型与滚动逻辑分别留在 backtop.ts 与 use-backtop.ts，
 * 需要自定义容器或自绘按钮时可单独引入后者。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\back-top\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdBackTop } from './YdBackTop.vue';

