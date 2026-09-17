/**
 * useSelectHeadless 测试 —— 验证纯逻辑层字段解析、选择模式、虚拟阈值
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\headless\use-select-headless.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { useSelectHeadless } from './index';

interface Item {
  id: string;
  name: string;
}

const sampleItems: Item[] = Array.from({ length: 200 }, (_, i) => ({
  id: `item-${i}`,
  name: `选项 ${i}`,
}));

describe('useSelectHeadless', () => {
  it('小数据量（< threshold）应关闭虚拟滚动', () => {
    const items = ref(sampleItems.slice(0, 50));
    const handle = useSelectHeadless({
      items,
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
      virtualThreshold: 100,
    });
    expect(handle.isVirtualEnabled.value).toBe(false);
  });

  it('大数据量（>= threshold）应开启虚拟滚动', () => {
    const items = ref(sampleItems);
    const handle = useSelectHeadless({
      items,
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
      virtualThreshold: 100,
    });
    expect(handle.isVirtualEnabled.value).toBe(true);
  });

  it('单选模式应输出 label 文本', () => {
    const items = ref(sampleItems.slice(0, 10));
    const handle = useSelectHeadless({
      items,
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
    });
    expect(handle.getLabelByValue('item-3')).toBe('选项 3');
  });

  it('toggleItem 单选模式应覆盖原值', () => {
    const items = ref(sampleItems.slice(0, 10));
    const handle = useSelectHeadless({
      items,
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
    });
    const next = handle.toggleItem('item-1', 'item-2', false);
    expect(next).toBe('item-2');
  });

  it('toggleItem 单选模式再次点击相同 value 应取消', () => {
    const items = ref(sampleItems.slice(0, 10));
    const handle = useSelectHeadless({
      items,
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
    });
    const next = handle.toggleItem('item-1', 'item-1', false);
    expect(next).toBeUndefined();
  });

  it('toggleItem 多选模式应追加到数组', () => {
    const items = ref(sampleItems.slice(0, 10));
    const handle = useSelectHeadless({
      items,
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
    });
    const next = handle.toggleItem(['item-1'], 'item-2', true);
    expect(Array.isArray(next)).toBe(true);
    expect(next).toContain('item-1');
    expect(next).toContain('item-2');
  });

  it('toggleItem 多选模式再次点击应移除', () => {
    const items = ref(sampleItems.slice(0, 10));
    const handle = useSelectHeadless({
      items,
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
    });
    const next = handle.toggleItem(['item-1', 'item-2'], 'item-1', true);
    expect(next).toEqual(['item-2']);
  });

  it('isSelected 单选模式应返回布尔', () => {
    const items = ref(sampleItems.slice(0, 10));
    const handle = useSelectHeadless({
      items,
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
    });
    expect(handle.isSelected('item-1', 'item-1', false)).toBe(true);
    expect(handle.isSelected('item-1', 'item-2', false)).toBe(false);
  });

  it('clearValue 多选应返回空数组', () => {
    const handle = useSelectHeadless({
      items: ref(sampleItems),
      getValue: (i) => i.id,
      getLabel: (i) => i.name,
      getKey: (i) => i.id,
    });
    expect(handle.clearValue(true)).toEqual([]);
    expect(handle.clearValue(false)).toBeUndefined();
  });
});
