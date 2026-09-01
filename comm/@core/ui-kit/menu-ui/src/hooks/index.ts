/**
 * 菜单相关组合式函数的出口：上下文读写（use-menu-context）与层级/样式推导（use-menu）。
 *
 * use-menu-scroll 不在此导出 —— 它是布局侧的可选能力，
 * 默认不随菜单一起引入，由需要自动滚动到激活项的场景按需取用。
 *
 * @path comm\@core\ui-kit\menu-ui\src\hooks\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './use-menu';
export * from './use-menu-context';
