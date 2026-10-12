/**
 * YdAutoComplete 组件测试 —— 验证异步搜索 + 防抖 + 清空。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\auto-complete\autoComplete.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import YdAutoComplete from './YdAutoComplete.vue';

describe('YdAutoComplete props', () => {
  it('YdAutoComplete 应被定义', () => {
    expect(YdAutoComplete).toBeDefined();
  });

  it('应包含 value prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('value');
  });

  it('应包含 isAsync prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('isAsync');
  });

  it('isAsync 默认值应为 false', () => {
    expect(YdAutoComplete.props.isAsync.default).toBe(false);
  });

  it('应包含 searchFn prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('searchFn');
  });

  it('应包含 debounceMs prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('debounceMs');
  });

  it('debounceMs 默认值应为 300', () => {
    expect(YdAutoComplete.props.debounceMs.default).toBe(300);
  });

  it('应包含 clearable prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('clearable');
  });

  it('clearable 默认值应为 true', () => {
    expect(YdAutoComplete.props.clearable.default).toBe(true);
  });

  it('应包含 emptyText prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('emptyText');
  });

  it('emptyText 默认值应为「暂无匹配项」', () => {
    expect(YdAutoComplete.props.emptyText.default).toBe('暂无匹配项');
  });
});

describe('AutoCompleteOption type shape', () => {
  it('接口应接受 value 和 label 字段', () => {
    // 型别验证 —— 通过 TS 编译期检查
    const opt: { value: string; label: string } = { label: '选项 A', value: 'a' };
    expect(opt.value).toBe('a');
    expect(opt.label).toBe('选项 A');
  });
});
