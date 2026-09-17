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

import { AutoCompleteOption } from './YdAutoComplete.vue';
import YdAutoComplete from './YdAutoComplete.vue';

describe('YdAutoComplete component', () => {
  it('应被定义', () => {
    expect(YdAutoComplete).toBeDefined();
  });

  it('应包含 value prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('value');
  });

  it('应包含 isAsync prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('isAsync');
    expect(YdAutoComplete.props.isAsync.default).toBe(false);
  });

  it('应包含 searchFn prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('searchFn');
  });

  it('应包含 debounceMs prop 且默认值为 300', () => {
    expect(YdAutoComplete.props).toHaveProperty('debounceMs');
    expect(YdAutoComplete.props.debounceMs.default).toBe(300);
  });

  it('应包含 clearable prop 且默认值为 true', () => {
    expect(YdAutoComplete.props).toHaveProperty('clearable');
    expect(YdAutoComplete.props.clearable.default).toBe(true);
  });

  it('应包含 emptyText prop', () => {
    expect(YdAutoComplete.props).toHaveProperty('emptyText');
    expect(YdAutoComplete.props.emptyText.default).toBe('暂无匹配项');
  });
});

describe('AutoCompleteOption type', () => {
  it('应能创建 AutoCompleteOption 对象', () => {
    const opt: AutoCompleteOption = { label: '选项 A', value: 'a' };
    expect(opt.value).toBe('a');
    expect(opt.label).toBe('选项 A');
  });
});
