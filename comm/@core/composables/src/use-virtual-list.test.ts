/**
 * useVirtualList 单元测试。
 *
 * @path comm\@core\composables\src\use-virtual-list.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { ref } from 'vue';
import { describe, expect, it } from 'vitest';

import { useVirtualList } from './use-virtual-list';

describe('useVirtualList', () => {
  it('should compute total height based on item count', () => {
    const list = ref(Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` })));
    const containerRef = ref<HTMLElement | null>(null);

    const { totalHeight } = useVirtualList(list, containerRef, { itemHeight: 48 });

    expect(totalHeight.value).toBe(100 * 48);
  });

  it('should accept plain array as input', () => {
    const list = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const containerRef = ref<HTMLElement | null>(null);

    const { totalHeight } = useVirtualList(list, containerRef, { itemHeight: 30 });

    expect(totalHeight.value).toBe(50 * 30);
  });

  it('should expose visibleItems, scrollTo, startIndex, endIndex', () => {
    const list = ref([{ id: 1 }, { id: 2 }]);
    const containerRef = ref<HTMLElement | null>(null);

    const { visibleItems, scrollTo, startIndex, endIndex } = useVirtualList(list, containerRef);

    expect(visibleItems.value).toBeDefined();
    expect(typeof scrollTo).toBe('function');
    expect(startIndex.value).toBeDefined();
    expect(endIndex.value).toBeDefined();
  });
});
