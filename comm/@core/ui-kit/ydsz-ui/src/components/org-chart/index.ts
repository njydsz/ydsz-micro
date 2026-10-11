/**
 * 组织架构图组件出口：YdOrgChart。
 *
 * 类型与组件一起导出，便于业务侧直接使用 OrgChartNode、OrgChartProps 等类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\org-chart\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdOrgChart } from './YdOrgChart.vue';

export type { OrgChartNode, OrgChartProps, OrgChartEmits } from './org-chart-types';
