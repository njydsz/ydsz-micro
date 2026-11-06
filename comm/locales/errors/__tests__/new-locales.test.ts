/**
 * 错误码多语种文案覆盖测试。
 *
 * @remarks
 * 校验 es-ES / fr-FR / ja-JP / ko-KR 四语种的错误码文案：
 * <ol>
 *   <li>四个语种均导出完整的错误码映射（与 zh-CN 键集合一致）</li>
 *   <li>同一错误码在四个语种中均有非空译文</li>
 *   <li>西/法/韩三语种不含中文残留；日文因书写体系允许汉字，仅校验非空</li>
 *   <li>{@link resolveErrorMessage} 能正确解析新语种</li>
 * </ol>
 *
 * @path comm/locales/errors/__tests__/new-locales.test.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { describe, expect, it } from 'vitest';

import { EN_US_MESSAGES } from '../en-US';
import { ES_ES_MESSAGES } from '../es-ES';
import { FR_FR_MESSAGES } from '../fr-FR';
import { JA_JP_MESSAGES } from '../ja-JP';
import { KO_KR_MESSAGES } from '../ko-KR';
import { ZH_CN_MESSAGES } from '../zh-CN';
import { resolveErrorMessage } from '../index';

/** 允许使用汉字的目标语种（日语标准书写体系使用漢字）。 */
const CJK_TOLERANT_LOCALES = new Set(['ja-JP']);

const LOCALE_TABLES = {
  'en-US': EN_US_MESSAGES,
  'es-ES': ES_ES_MESSAGES,
  'fr-FR': FR_FR_MESSAGES,
  'ja-JP': JA_JP_MESSAGES,
  'ko-KR': KO_KR_MESSAGES,
} as const;

describe('错误码多语种文案覆盖', () => {
  const zhCodes = Object.keys(ZH_CN_MESSAGES);

  it('zh-CN 映射表非空', () => {
    expect(zhCodes.length).toBeGreaterThan(300);
  });

  for (const [locale, table] of Object.entries(LOCALE_TABLES)) {
    describe(`${locale}`, () => {
      it('键集合覆盖 zh-CN（新语种为超集）', () => {
        const codes = new Set(Object.keys(table));
        // 新语种由 generated 全量生成，覆盖 zh-CN 精校表的全部条目
        for (const code of zhCodes) {
          expect(codes.has(code), `缺少 ${code}`).toBe(true);
        }
      });

      it('键集合与 en-US 一致', () => {
        const codes = Object.keys(table);
        expect(codes.sort()).toEqual(Object.keys(EN_US_MESSAGES).sort());
      });

      it('所有文案非空', () => {
        for (const [code, message] of Object.entries(table)) {
          expect(message, `${code} 文案为空`).toBeTruthy();
        }
      });

      if (!CJK_TOLERANT_LOCALES.has(locale)) {
        it('不含中文残留', () => {
          const offenders = Object.entries(table).filter(([, message]) =>
            /[\u4e00-\u9fff]/.test(message),
          );
          expect(offenders.map(([code]) => code)).toEqual([]);
        });
      }
    });
  }

  describe('resolveErrorMessage', () => {
    it('能解析 es-ES 的 A00000', async () => {
      const result = await resolveErrorMessage('A00000', 'es-ES');
      expect(result).toBeTruthy();
      expect(result).not.toContain('操作成功');
    });

    it('能解析 fr-FR 的 A00000', async () => {
      const result = await resolveErrorMessage('A00000', 'fr-FR');
      expect(result).toBeTruthy();
      expect(result).not.toContain('操作成功');
    });

    it('能解析 ja-JP 的 A00000', async () => {
      const result = await resolveErrorMessage('A00000', 'ja-JP');
      expect(result).toBeTruthy();
    });

    it('能解析 ko-KR 的 A00000', async () => {
      const result = await resolveErrorMessage('A00000', 'ko-KR');
      expect(result).toBeTruthy();
      expect(result).not.toContain('操作成功');
    });
  });
});
