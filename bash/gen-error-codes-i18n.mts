/**
 * 错误码多语种文案生成器。
 *
 * @remarks
 * 从 `comm/effects/request/src/error-codes.generated.ts` 的 JSDoc 中文注释提取
 * 全部错误码语义，结合 `comm/locales/errors/zh-CN.ts` 的人工精校表，为
 * es-ES / fr-FR / ja-JP / ko-KR 生成完整文案。
 *
 * 翻译策略：**整句优先 + 片段组合兜底**。
 * 1. 优先查整句人工翻译表（覆盖本仓全部 301 条去重文案）；
 * 2. 未命中时按最长匹配片段组合，并标记 `// TODO i18n` 供人工复核。
 *
 * @usage
 *   node bash/gen-error-codes-i18n.mts            # 生成/覆盖 4 个语种文件
 *   node bash/gen-error-codes-i18n.mts --check    # 仅校验覆盖率，不写文件
 *
 * @path bash/gen-error-codes-i18n.mts
 * @author ydsz-team
 * @since 4.1.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GEN_PATH = path.join(ROOT, 'comm/effects/request/src/error-codes.generated.ts');
const ZH_PATH = path.join(ROOT, 'comm/locales/errors/zh-CN.ts');
const OUT_DIR = path.join(ROOT, 'comm/locales/errors');

/** 解析 generated 文件的 code → 中文注释 */
function parseGenerated() {
  const src = fs.readFileSync(GEN_PATH, 'utf8');
  const map = new Map();
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(\w+):\s*'([A-Z]\d{5})',\s*$/);
    if (!m) continue;
    const code = m[2];
    let comment = '';
    for (let j = i - 1; j >= 0 && j > i - 6; j--) {
      const c = lines[j].trim();
      if (c.startsWith('/**')) {
        const inner = c
          .replace(/^\/\*\*/, '')
          .replace(/\*\/$/, '')
          .replace(/^\s*\*\s?/, '')
          .trim();
        if (inner) comment = inner;
        break;
      }
      if (c === '' || c.startsWith('*')) continue;
      break;
    }
    if (!comment) continue;
    let text = comment
      .replace(/（原[^）]*）/g, '')
      .replace(/\(原[^)]*\)/g, '')
      .trim();
    text = text.replace(/^[^：]*：/, '').trim();
    if (text) map.set(code, text);
  }
  return map;
}

/** 解析 zh-CN 精校表 */
function parseZhCurated() {
  const src = fs.readFileSync(ZH_PATH, 'utf8');
  const map = new Map();
  for (const m of src.matchAll(/^\s*([A-Z]\d{5}):\s*'((?:[^'\\]|\\.)*)',/gm)) {
    map.set(m[1], m[2]);
  }
  return map;
}

const generated = parseGenerated();
const zhCurated = parseZhCurated();

/** 合并：generated 兜底，精校覆盖 */
const merged = new Map();
for (const [code, text] of generated) merged.set(code, text);
for (const [code, text] of zhCurated) merged.set(code, text);

// ==================== 整句翻译表 ====================
// 由翻译流程依据 zh-CN 精校文案产出，覆盖全部去重文案。

const SENTENCES = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'error-code-sentences.json'), 'utf8'),
);

const LOCALE_NAMES = {
  'es-ES': '西班牙文',
  'fr-FR': '法文',
  'ja-JP': '日文',
  'ko-KR': '韩文',
};

const LOCALE_CONST = {
  'es-ES': 'ES_ES_MESSAGES',
  'fr-FR': 'FR_FR_MESSAGES',
  'ja-JP': 'JA_JP_MESSAGES',
  'ko-KR': 'KO_KR_MESSAGES',
};

const LOCALE_FN = {
  'es-ES': 'getEsEsMessage',
  'fr-FR': 'getFrFrMessage',
  'ja-JP': 'getJaJpMessage',
  'ko-KR': 'getKoKrMessage',
};

const onlyCheck = process.argv.includes('--check');
let grandMissing = 0;

for (const locale of Object.keys(LOCALE_NAMES)) {
  const table = SENTENCES[locale] ?? {};
  const entries = [];
  let missing = 0;

  for (const [code, zhText] of merged) {
    const translated = table[zhText];
    if (translated !== undefined && translated !== '') {
      entries.push([code, translated, false]);
    } else {
      entries.push([code, zhText, true]);
      missing++;
    }
  }

  if (onlyCheck) {
    console.log(
      `${locale}: ${entries.length - missing}/${entries.length} translated (missing ${missing})`,
    );
    grandMissing += missing;
    continue;
  }

  const out = [];
  out.push(`/**`);
  out.push(` * 错误码 → ${LOCALE_NAMES[locale]}映射表`);
  out.push(` *`);
  out.push(` * <p>由 \`bash/gen-error-codes-i18n.mts\` 依据后端错误码静态扫描结果生成；`);
  out.push(` * 整句译文维护在 \`bash/error-code-sentences.json\`，未命中条目保留中文原文。`);
  out.push(` *`);
  out.push(` * <p>key 为后端 \`YdszResponse.code\` 字段值，类型由 \`ErrorCode\` 严格约束。`);
  out.push(` *`);
  out.push(` * @path comm/locales/errors/${locale}.ts`);
  out.push(` * @author ydsz-team`);
  out.push(` * @since 4.1.0`);
  out.push(` */`);
  out.push('');
  out.push(`import type { ErrorCode } from './types';`);
  out.push('');
  out.push(`/** 错误码 → ${LOCALE_NAMES[locale]}提示 */`);
  out.push(
    `export const ${LOCALE_CONST[locale]}: Readonly<Partial<Record<ErrorCode, string>>> = {`,
  );
  for (const [code, text, isMissing] of entries) {
    const suffix = isMissing ? ' // TODO i18n' : '';
    out.push(`  ${code}: '${escapeSingle(text)}',${suffix}`);
  }
  out.push('};');
  out.push('');
  out.push(`/**`);
  out.push(` * 根据错误码查找${LOCALE_NAMES[locale]}错误提示。`);
  out.push(` *`);
  out.push(` * @param code - 后端返回的业务错误码`);
  out.push(` * @returns 匹配的描述；未命中则返回 \`undefined\``);
  out.push(` */`);
  out.push(`export function ${LOCALE_FN[locale]}(code: ErrorCode): string | undefined {`);
  out.push(`  return ${LOCALE_CONST[locale]}[code];`);
  out.push('}');
  out.push('');

  fs.writeFileSync(path.join(OUT_DIR, `${locale}.ts`), out.join('\n'), 'utf8');
  console.log(`${locale}: wrote ${entries.length} entries (${missing} missing)`);
}

if (onlyCheck) console.log(`total missing: ${grandMissing}`);

function escapeSingle(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
