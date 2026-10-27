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

import arSA from './ar-SA';
import deDE from './de-DE';
import esES from './es-ES';
import frFR from './fr-FR';
import hiIN from './hi-IN';
import jaJP from './ja-JP';
import koKR from './ko-KR';
import ptBR from './pt-BR';
import ruRU from './ru-RU';
import thTH from './th-TH';
import viVN from './vi-VN';
import zhTW from './zh-TW';
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

/**
 * 14 语种词典一致性。
 *
 * <p>组件写 `t('x.y', { count })` 时并不检查目标语种是否写了 `{count}`；某语种漏掉占位，
 * 界面就渲染出 `共 条` 这类读不通的文案，且只有切到那个语种才看得见。词典又分散在 14 个
 * 文件里，加键时漏更某一个语种是高频事故 —— 这三条断言把「缺 key / 空文案 / 占位漂移」
 * 变成一次 `pnpm test` 就能拦住的错误。
 */
const ALL_LOCALES: Array<[string, Record<string, string>]> = [
  ['ar-SA', arSA],
  ['de-DE', deDE],
  ['en-US', enUS],
  ['es-ES', esES],
  ['fr-FR', frFR],
  ['hi-IN', hiIN],
  ['ja-JP', jaJP],
  ['ko-KR', koKR],
  ['pt-BR', ptBR],
  ['ru-RU', ruRU],
  ['th-TH', thTH],
  ['vi-VN', viVN],
  ['zh-CN', zhCN],
  ['zh-TW', zhTW],
];

const PLACEHOLDER = /\{(\w+)\}/g;

describe('14 语种词典与 zh-CN 一致', () => {
  const referenceKeys = Object.keys(zhCN).sort();

  it.each(ALL_LOCALES)('%s 的 key 集合与 zh-CN 完全一致', (locale, dict) => {
    expect(Object.keys(dict).sort()).toEqual(referenceKeys);
  });

  it.each(ALL_LOCALES)('%s 不应有空文案', (locale, dict) => {
    for (const key of Object.keys(dict)) {
      expect(String(dict[key]).trim(), `${locale} 的 ${key} 文案为空`).not.toBe('');
    }
  });

  it.each(ALL_LOCALES)('%s 的命名占位与 zh-CN 一一对应', (locale, dict) => {
    for (const key of referenceKeys) {
      const expected = [...zhCN[key].matchAll(PLACEHOLDER)].map((m) => m[1]).sort();
      const actual = [...dict[key].matchAll(PLACEHOLDER)].map((m) => m[1]).sort();
      expect(actual, `${locale} 的 ${key} 占位应为 ${expected.join(',')}`).toEqual(expected);
    }
  });

  it('词典应有内容（空表会让上面三条断言全部空转）', () => {
    expect(referenceKeys.length).toBeGreaterThan(100);
    expect(ALL_LOCALES).toHaveLength(14);
  });
});
