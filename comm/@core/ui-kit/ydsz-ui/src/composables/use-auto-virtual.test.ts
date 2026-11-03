/**
 * useAutoVirtual composable 测试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-auto-virtual.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { useAutoVirtual } from './use-auto-virtual';

describe('useAutoVirtual', () => {
  it('数据量低于阈值时默认不启用虚拟滚动', () => {
    const count = ref(50);
    const { shouldVirtualize } = useAutoVirtual(() => count.value, { threshold: 100 });

    expect(shouldVirtualize.value).toBe(false);
  });

  it('数据量超过阈值时自动启用虚拟滚动', () => {
    const count = ref(150);
    const { shouldVirtualize } = useAutoVirtual(() => count.value, { threshold: 100 });

    expect(shouldVirtualize.value).toBe(true);
  });

  it('数据量变化时响应式更新', () => {
    const count = ref(50);
    const { shouldVirtualize } = useAutoVirtual(() => count.value, { threshold: 100 });

    expect(shouldVirtualize.value).toBe(false);
    count.value = 200;
    expect(shouldVirtualize.value).toBe(true);
  });

  it('force=true 时始终启用', () => {
    const count = ref(10);
    const { shouldVirtualize } = useAutoVirtual(() => count.value, {
      force: true,
      threshold: 100,
    });

    expect(shouldVirtualize.value).toBe(true);
  });

  it('force=false 时始终禁用', () => {
    const count = ref(1000);
    const { shouldVirtualize } = useAutoVirtual(() => count.value, {
      force: false,
      threshold: 100,
    });

    expect(shouldVirtualize.value).toBe(false);
  });

  it('virtualizedProps 包含正确的配置', () => {
    const count = ref(150);
    const { virtualizedProps } = useAutoVirtual(() => count.value, {
      itemHeight: 36,
      threshold: 100,
      viewportHeight: 400,
    });

    expect(virtualizedProps.value.virtual).toBe(true);
    expect(virtualizedProps.value.virtualHeight).toBe(400);
    expect(virtualizedProps.value.itemHeight).toBe(36);
  });

  it('使用默认阈值 100', () => {
    const count = ref(101);
    const { shouldVirtualize } = useAutoVirtual(() => count.value);

    expect(shouldVirtualize.value).toBe(true);
  });
});
