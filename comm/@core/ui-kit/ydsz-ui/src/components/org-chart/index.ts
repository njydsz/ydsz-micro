/**
 * 组织架构图组件出口：YdOrgChart。
 *
 * <p>类型与组件一起导出，便于业务侧直接使用 OrgChartNode、OrgChartProps 等类型。
 *
 * @deprecated 推荐使用 {@link organization-chart} 下的 YdOrganizationChart，
 *   提供composable API (useOrganizationChart) 和 PrimeVue 兼容的事件命名。
 *   YdOrgChart 保留仅作兼容，新代码请使用 YdOrganizationChart。
 * @path comm\@core\ui-kit\ydsz-ui\src\components\org-chart\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdOrgChart } from './YdOrgChart.vue';

export type { OrgChartNode, OrgChartProps, OrgChartEmits } from './org-chart-types';
