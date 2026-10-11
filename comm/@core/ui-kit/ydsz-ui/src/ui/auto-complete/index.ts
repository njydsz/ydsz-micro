/**
 * AutoComplete 组件 barrel。
 *
 * @author ydsz-team
 * @since 26.10.11
 */
export { default as ydAutoComplete } from './auto-complete.vue';
export { useAutoComplete } from './use-auto-complete';
export type {
  AutoCompleteOption,
  AutoCompleteFetchMethod,
  AutoCompleteProps,
  AutoCompleteEmits,
} from './auto-complete-types';
export type { UseAutoCompleteOptions, UseAutoCompleteReturn } from './use-auto-complete';
