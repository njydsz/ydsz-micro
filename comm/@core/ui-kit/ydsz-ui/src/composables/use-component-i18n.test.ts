// cspell:words i18n
/**
 * useComponentI18n 单元测试 —— 验证组件级国际化能力。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-component-i18n.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import { describe, expect, it } from 'vitest';

import type { UseComponentI18nOptions } from './use-component-i18n';
import { useComponentI18n } from './use-component-i18n';

function makeOptions(): UseComponentI18nOptions {
  return {
    messages: {
      en: {
        emptyText: 'No data',
        greeting: 'Hello, {name}!',
      },
      zh: {
        emptyText: '暂无数据',
        greeting: '你好，{name}！',
      },
    },
  };
}

describe('useComponentI18n', () => {
  it('默认应返回默认语言的翻译', () => {
    const { t } = useComponentI18n(makeOptions());
    expect(t('emptyText')).toBe('暂无数据');
  });

  it('切换语言后应返回对应翻译', () => {
    const { t, setLocale } = useComponentI18n(makeOptions());
    setLocale('en');
    expect(t('emptyText')).toBe('No data');
  });

  it('支持嵌套 key 访问', () => {
    const { t } = useComponentI18n({
      messages: {
        zh: { table: { emptyText: '暂无数据' } },
      },
    });
    expect(t('table.emptyText')).toBe('暂无数据');
  });

  it('支持占位符替换', () => {
    const { setLocale, t } = useComponentI18n(makeOptions());
    setLocale('en');
    expect(t('greeting', { name: 'World' })).toBe('Hello, World!');
  });

  it('key 不存在时应 fallback 到 key 本身', () => {
    const { t } = useComponentI18n(makeOptions());
    expect(t('nonExistent')).toBe('nonExistent');
  });

  it('切换不存在的 locale 应保持原语言', () => {
    const { setLocale, t } = useComponentI18n(makeOptions());
    setLocale('fr');
    expect(t('emptyText')).toBe('暂无数据');
  });
});
