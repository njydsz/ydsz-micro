/**
 * YdConfigProvider 全局配置出口。
 *
 * <p>包含：
 * <ul>
 *   <li>YdConfigProvider.vue —— Vue 组件：包裹应用根节点，注入主题 / 密度 / locale / 渲染器等全局上下文</li>
 *   <li>useConfigProvider —— composable：下游组件读取注入的全局配置</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { CONFIG_INJECTION_KEY, default as YdConfigProvider } from './YdConfigProvider.vue';
export type { ConfigContext } from './YdConfigProvider.vue';

export { useConfigProvider } from './useConfigProvider';
