/**
 * Unit tests for resolveErrorMessage — error code i18n mapping lookup logic.
 *
 * <p>Covers the two-tier lookup strategy:
 * <ol>
 *   <li>Static locale map (hand-crafted messages) — highest priority</li>
 *   <li>i18nKey fallback via GENERATED_ERROR_CODE_META + $t translation</li>
 * </ol>
 *
 * @path comm/locales/errors/__tests__/resolve-error-message.test.ts
 */

// ── Mocks must be declared BEFORE importing the module under test ──────────
// Because resolveErrorMessage uses lazy `import('@ydsz/request')` at call time,
// the module specifier must already be hoisted and mocked by vitest.

vi.mock('@ydsz/request', () => ({
  GENERATED_ERROR_CODE_META: {
    // i18nKey present + $t has translation → should resolve
    C99001: {
      code: 'C99001',
      module: 'test',
      enumName: 'TEST_CODE',
      message: 'test msg',
      i18nKey: 'error.test.code',
    },
    // i18nKey present but $t has no translation (returns key itself) → undefined
    C99003: {
      code: 'C99003',
      module: 'test',
      enumName: 'UNTRANSLATED_CODE',
      message: 'untranslated msg',
      i18nKey: 'error.does.not.exist',
    },
    // meta entry without i18nKey → i18n fallback skipped, returns undefined
    C99002: {
      code: 'C99002',
      module: 'test',
      enumName: 'NO_I18N_KEY_CODE',
      message: 'no i18n key msg',
    },
  },
}));

vi.mock('../../src/i18n', () => ({
  $t: vi.fn((key: string) => {
    if (key === 'error.test.code') return 'Test error message';
    // Simulate vue-i18n behaviour: returns the key itself when translation missing
    return key;
  }),
}));

import { describe, it, expect } from 'vitest';
import { resolveErrorMessage } from '..';
import type { SupportedLanguagesType } from '../../src/typing';

describe('resolveErrorMessage', () => {
  // ── 1. Static mapping: zh-CN A00000 → '操作成功' ────────────────────────
  it('should return static message when code exists in zh-CN mapping', async () => {
    const result = await resolveErrorMessage('A00000', 'zh-CN');
    expect(result).toBe('操作成功');
  });

  // ── 2. Static miss → i18nKey fallback ───────────────────────────────────
  it('should fall back to $t translation via i18nKey when static map misses', async () => {
    const result = await resolveErrorMessage('C99001', 'zh-CN');
    expect(result).toBe('Test error message');
  });

  // ── 3. Static miss + $t returns key itself (no translation) → undefined ──
  it('should return undefined when $t returns the key itself (i18n entry missing)', async () => {
    const result = await resolveErrorMessage('C99003', 'zh-CN');
    expect(result).toBeUndefined();
  });

  // ── 4. Static mapping: en-US locale ─────────────────────────────────────
  it('should return English message when locale is en-US and code exists', async () => {
    const result = await resolveErrorMessage('A00000', 'en-US' as SupportedLanguagesType);
    expect(result).toBe('Operation successful');
  });

  // ── 5. Static miss + meta entry has no i18nKey → undefined ──────────────
  it('should return undefined when meta entry exists but has no i18nKey', async () => {
    const result = await resolveErrorMessage('C99002', 'zh-CN');
    expect(result).toBeUndefined();
  });

  // ── 6. Unknown error code → undefined ───────────────────────────────────
  it('should return undefined for unknown error code not in any map', async () => {
    const result = await resolveErrorMessage('X99999', 'zh-CN');
    expect(result).toBeUndefined();
  });
});
