/**
 * 全局搜索组件模块。
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
