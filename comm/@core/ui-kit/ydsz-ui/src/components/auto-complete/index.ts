/**
 * AutoComplete 自动完成组件入口。
 *
 * @module primitives/auto-complete
 * @author ydsz-team
 * @since 1.0.0
 */

export { default as YdAutoComplete } from './YdAutoComplete.vue';
export type { AutoCompleteOption } from './YdAutoComplete.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as ydAutoComplete } from './auto-complete.vue';
export { useAutoComplete } from './use-auto-complete';
export type { AutoCompleteOption, AutoCompleteFetchMethod, AutoCompleteProps, AutoCompleteEmits, } from './auto-complete-types';
export type { UseAutoCompleteOptions, UseAutoCompleteReturn } from './use-auto-complete';
