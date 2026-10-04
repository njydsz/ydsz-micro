/**
 * diff.ts 工具函数单元测试
 *
 * 覆盖：arraysEqual / diff
 *
 * @path comm\@core\base\shared\src\utils\__tests__\diff.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { arraysEqual, diff } from '../diff';

// ---------------------------------------------------------------------------
// arraysEqual
// ---------------------------------------------------------------------------

describe('arraysEqual', () => {
  it('相同元素忽略顺序应返回 true', () => {
    expect(arraysEqual([1, 2, 3], [3, 2, 1])).toBe(true);
    expect(arraysEqual(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('不同长度应返回 false', () => {
    expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(arraysEqual([1, 2, 3], [1, 2])).toBe(false);
  });

  it('重复元素计数不同应返回 false', () => {
    expect(arraysEqual([1, 1, 2], [1, 2, 2])).toBe(false);
    expect(arraysEqual(['a', 'a'], ['a', 'b'])).toBe(false);
  });

  it('两个空数组应相等', () => {
    expect(arraysEqual([], [])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// diff
// ---------------------------------------------------------------------------

interface TestObj {
  name: string;
  age: number;
  tags?: string[];
  nested?: { x: number; y: number };
}

describe('diff', () => {
  it('两对象完全相同时应返回 undefined', () => {
    const obj: TestObj = { name: 'Alice', age: 30 };
    expect(diff(obj, { ...obj })).toBeUndefined();
  });

  it('应仅返回已变更层级的字段', () => {
    const before: TestObj = { name: 'Alice', age: 30 };
    const after: TestObj = { name: 'Bob', age: 30 };
    const result = diff(before, after);
    expect(result).toBeDefined();
    expect(result?.name).toBe('Bob');
    // 未变化字段不出现在结果中
    expect(result?.age).toBeUndefined();
  });

  it('应递归比较嵌套对象，仅返回已变更字段', () => {
    const before: TestObj = {
      name: 'Alice',
      age: 30,
      nested: { x: 1, y: 2 },
    };
    const after: TestObj = {
      name: 'Alice',
      age: 30,
      nested: { x: 1, y: 99 },
    };
    const result = diff(before, after);
    expect(result).toBeDefined();
    expect(result?.name).toBeUndefined();
    // diff 仅返回已变更的字段，x 未变不出现
    expect(result?.nested).toEqual({ y: 99 });
  });

  it('数组不相等时整体数组作为差异返回', () => {
    const before: TestObj = { name: 'Alice', age: 30, tags: ['a', 'b'] };
    const after: TestObj = { name: 'Alice', age: 30, tags: ['c', 'd'] };
    const result = diff(before, after);
    expect(result?.tags).toEqual(['c', 'd']);
  });
});
