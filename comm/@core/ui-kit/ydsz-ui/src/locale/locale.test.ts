/**
 * ydsz-ui 国际化模块测试 —— 验证双语包与 useLocale。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\locale\locale.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import { enUS } from './en-US';
import { zhCN } from './zh-CN';
import { useLocale } from './useLocale';

describe('zh-CN locale', () => {
  it('应包含 table.empty', () => {
    expect(zhCN['table.empty']).toBe('暂无数据');
  });

  it('应包含 table.loading', () => {
    expect(zhCN['table.loading']).toBe('加载中...');
  });

  it('应包含 form.validating', () => {
    expect(zhCN['form.validating']).toBe('校验中...');
  });

  it('应包含 form.submitting', () => {
    expect(zhCN['form.submitting']).toBe('提交中...');
  });

  it('应包含 common.confirm 和 common.cancel', () => {
    expect(zhCN['common.confirm']).toBe('确认');
    expect(zhCN['common.cancel']).toBe('取消');
  });
});

describe('en-US locale', () => {
  it('应包含 table.empty', () => {
    expect(enUS['table.empty']).toBe('No data');
  });

  it('应包含 table.loading', () => {
    expect(enUS['table.loading']).toBe('Loading...');
  });

  it('应包含 form.validating', () => {
    expect(enUS['form.validating']).toBe('Validating...');
  });

  it('应包含 form.submitting', () => {
    expect(enUS['form.submitting']).toBe('Submitting...');
  });

  it('应包含 common.confirm 和 common.cancel', () => {
    expect(enUS['common.confirm']).toBe('Confirm');
    expect(enUS['common.cancel']).toBe('Cancel');
  });
});

describe('useLocale composable', () => {
  it('应默认使用 zh-CN', () => {
    const { lang } = useLocale();
    expect(lang.value).toBe('zh-CN');
  });

  it('t 函数应返回对应语种文案', () => {
    const { t } = useLocale();
    expect(t('table.empty')).toBe('暂无数据');
    expect(t('form.validating')).toBe('校验中...');
  });

  it('t 函数 key 不存在时应返回 key 本身', () => {
    const { t } = useLocale();
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('应支持自定义消息表', () => {
    const { t } = useLocale({
      messages: {
        'en-US': { greeting: 'Hello' },
        'zh-CN': { greeting: '你好' },
      },
    });
    expect(t('greeting')).toBe('你好');
  });

  it('resolve 应覆盖 en-US 文案', () => {
    const { t } = useLocale({
      messages: {
        'en-US': { 'table.empty': 'Custom Empty' },
        'zh-CN': { 'table.empty': '自定义空' },
      },
    });
    expect(t('table.empty')).toBe('自定义空');
  });
});
