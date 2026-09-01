/**
 * 标签栏右侧工具按钮的出口：溢出菜单（TabsToolMore）与全屏切换（TabsToolScreen）。
 *
 * 两个工具都是纯受控组件，状态全部由父级持有 ——
 * 是否全屏、溢出菜单里有什么属于页面级决策，组件不应自行保存。
 *
 * @path comm\@core\ui-kit\tabs-ui\src\components\widgets\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as TabsToolMore } from './tool-more.vue';
export { default as TabsToolScreen } from './tool-screen.vue';
