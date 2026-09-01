/**
 * 全局搜索的出口：面板组件、搜索逻辑、模块元数据与全部结果类型。
 *
 * 模块图标与名称映射（MODULE_ICONS / MODULE_LABELS）一并导出，
 * 是为了让搜索结果之外的位置（如收藏、最近访问）复用同一套模块呈现；
 * 结果类型必须导出，否则调用方无法为自定义结果渲染器标注入参类型。
 *
 * @path comm/@core/ui-kit/shadcn-ui/src/components/search/index.ts
 * @author ydsz-team
 * @since 4.1.0 (P2-13)
 */

export { default as GlobalSearchPanel } from './global-search-panel.vue';
export { useGlobalSearch } from './use-global-search';
export {
  MODULE_ICONS,
  MODULE_LABELS,
} from './search-types';
export type {
  GlobalSearchResponse,
  SearchHit,
  SearchSuggestion,
} from './search-types';
