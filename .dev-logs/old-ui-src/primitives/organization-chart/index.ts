/**
 * OrganizationChart 组织架构图组件入口。
 *
 * <p>对标 PrimeVue OrganizationChart。
 *
 * <p>特性：
 * <ul>
 *   <li>可折叠的树形结构（root / branch / leaf）</li>
 *   <li>单选/多选模式</li>
 *   <li>水平 / 垂直布局切换</li>
 *   <li>自定义节点模板</li>
 *   <li>完整的键盘导航与 ARIA 支持</li>
 * </ul>
 *
 * <p>典型用法：
 * <pre>
 *   &lt;YdOrganizationChart
 *     :root="orgData"
 *     selection-mode="single"
 *     @node-select="onSelect"
 *   /&gt;
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\organization-chart\index.ts
 * @author ydsz-team
 * @since 26.09.24
 */
export { useOrganizationChart } from './use-organization-chart';
export { default as YdOrganizationChart } from './YdOrganizationChart.vue';
export { default as OrgNode } from './OrgNode.vue';
export {
  isBranchNode,
  resolveNodeType,
} from './use-organization-chart';
export type {
  OrgChartOptions,
  OrgNode,
  OrgNodeKey,
  UseOrganizationChartReturn,
} from './use-organization-chart';
