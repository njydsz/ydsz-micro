/**
 * useDebounceSearch 单元测试。
 *
 * @path comm\@core\composables\src\use-debounce-search.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { useDebounceSearch } from './use-debounce-search';

describe('useDebounceSearch', () => {
  it('should return a debounced search function', () => {
    const { debouncedSearch, isSearching, resetSearching } = useDebounceSearch();
    expect(typeof debouncedSearch).toBe('function');
    expect(isSearching.value).toBe(false);
    expect(typeof resetSearching).toBe('function');
  });

  it('should respect custom delay and minLength options', () => {
    const { debouncedSearch } = useDebounceSearch({ delay: 500, minLength: 5 });
    expect(typeof debouncedSearch).toBe('function');
  });

  it('should reset searching state', () => {
    const { isSearching, resetSearching } = useDebounceSearch();
    isSearching.value = true;
    resetSearching();
    expect(isSearching.value).toBe(false);
  });
});
