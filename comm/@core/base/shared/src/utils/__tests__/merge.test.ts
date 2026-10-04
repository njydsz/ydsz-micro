/**
 * merge.ts 工具函数单元测试
 *
 * 覆盖：merge（defu，首参优先 + 数组拼接）/ mergeWithArrayOverride（数组首参覆盖）
 *
 * @path comm\@core\base\shared\src\utils\__tests__\merge.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { merge, mergeWithArrayOverride } from '../merge';

// ---------------------------------------------------------------------------
// merge（defu 语义：首参优先、数组拼接、次参补缺）
// ---------------------------------------------------------------------------

describe('merge', () => {
  it('首参字段保留，次参补全缺失字段', () => {
    const result = merge({ a: 1, b: 2 }, { b: 20, c: 3 });
    expect(result).toHaveProperty('a', 1);
    expect(result).toHaveProperty('b', 2); // 首参 b 优先
    expect(result).toHaveProperty('c', 3); // 补充缺失字段
  });

  it('应深合并嵌套对象（首参优先、次参补入）', () => {
    const result = merge(
      { user: { name: 'Alice', age: 30 } },
      { user: { age: 31, role: 'admin' } },
    );
    expect(result.user).toEqual({ name: 'Alice', age: 30, role: 'admin' });
  });

  it('数组默认执行首参 + 次参拼接合并', () => {
    const result = merge({ list: ['a', 'b'] }, { list: ['c'] });
    expect(result.list).toEqual(['a', 'b', 'c']);
  });

  it('空对象合并或次参为空应返回首参浅拷贝', () => {
    expect(merge({ a: 1 }, {})).toEqual({ a: 1 });
    expect(merge({}, { a: 1 })).toEqual({ a: 1 });
    expect(merge({}, {})).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// mergeWithArrayOverride（首参数组覆盖，不拼接）
// ---------------------------------------------------------------------------

describe('mergeWithArrayOverride', () => {
  it('数组字段应由首参完全覆盖次参数组', () => {
    const result = mergeWithArrayOverride(
      { list: ['a', 'b', 'c'] },
      { list: ['x'] },
    );
    expect(result.list).toEqual(['a', 'b', 'c']);
    expect(result.list).toHaveLength(3);
  });

  it('非数组字段仍执行深合并', () => {
    const result = mergeWithArrayOverride(
      { user: { name: 'Alice', age: 30 } },
      { user: { age: 31 } },
    );
    expect(result.user).toEqual({ name: 'Alice', age: 30 });
  });

  it('空数组覆盖次参应保留首参数组', () => {
    const result = mergeWithArrayOverride(
      { list: ['a', 'b'] },
      { list: [] },
    );
    expect(result.list).toEqual(['a', 'b']);
    expect(result.list).toHaveLength(2);
  });

  it('同时包含数组与非数组字段时应按各自策略处理', () => {
    const result = mergeWithArrayOverride(
      { name: 'old', items: [1, 2], meta: { v: 1 } },
      { name: 'new', items: [3], meta: { v: 2, extra: true } },
    );
    expect(result.name).toBe('old'); // 首参优先
    expect(result.items).toEqual([1, 2]); // 首参数组覆盖
    expect(result.meta).toEqual({ v: 1, extra: true }); // 数组外仍是深合并
  });
});
