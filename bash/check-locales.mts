#!/usr/bin/env node
/**
 * check-locales.mts — 国际化 key 一致性校验（全语种门禁）
 *
 * <p>覆盖两层词典，均以 zh-CN 为基线做 key 集合比对：
 * <ol>
 *   <li>应用层 JSON 词典 — comm / main / apps/* 的 {@code langs/<lang>/<module>.json}，
 *       语种清单与 {@code SupportedLanguagesType} 一致（6 语种）</li>
 *   <li>组件库内置词典 — {@code comm/@core/ui-kit/ydsz-ui/src/locale/<lang>.ts}，
 *       扁平点号 key，语种由目录实测（多于应用层，含 ar/de/hi/pt/ru/th/vi/zh-TW）</li>
 * </ol>
 *
 * <p>校验维度：语种目录缺失/未知、模块文件缺失/多余、叶子 key 集合不一致、解析失败、
 * 以及<b>翻译质量预算棘轮</b>（机翻痕迹，见 {@link checkTranslationQuality}）。
 * 任一项不通过即退出码 1，供 {@code pnpm check:i18n} 与 CI 门禁消费。
 *
 * <p>设计契合「最小化外部依赖、绝对可控」原则：零第三方依赖，原生 Node 实现。
 *
 * @usage
 *   node bash/check-locales.mts                 # 全量校验，有差异退出码 1
 *   node bash/check-locales.mts --root <dir>    # 指定仓库根（自检夹具用）
 *   node bash/check-locales.mts --self-test     # 用反例夹具证明本门禁不是空转
 *   node bash/check-locales.mts --update-quality-baseline # 重译后把质量预算下调到当前值
 *
 * @path bash\check-locales.mts
 * @author ydsz-team
 * @since 4.5.0
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');

/** 基线语种 — 作为 key 集合的事实来源 */
const BASELINE_LANG = 'zh-CN';

/** 应用层全量语种清单 — 与 comm/locales/src/typing.ts 的 SupportedLanguagesType 保持同步 */
const ALL_LANGUAGES = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR'];

/** 需要校验的语种（排除基线自身） */
const TARGET_LANGUAGES = ALL_LANGUAGES.filter((lang) => lang !== BASELINE_LANG);

/** 组件库内置词典目录 — 扁平点号 key 的 TS 常量，语种数量独立于应用层 */
const UIKIT_LOCALE_DIR = 'comm/@core/ui-kit/ydsz-ui/src/locale';

/** 语种文件命名形如 zh-CN.ts / zh-CN.json，用于排除 index、useLocale、测试文件 */
const LOCALE_FILE_RE = /^[a-z]{2}-[A-Z]{2}\.[a-z]+$/;

/** 组件库词典的词条行：缩进 + 单引号点号 key + 单引号字符串值 */
const UIKIT_ENTRY_RE = /^\s+'([^']+)':\s*'/;

/** 递归收集 JSON 对象的全部叶子 key 路径（点号连接） */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

/** 抽取扁平 key 词典文本的词条列表（组件库 TS 无需解析，按行取 key） */
function collectFlatKeys(source: string): string[] {
  return source.split('\n').flatMap((line) => {
    const matched = UIKIT_ENTRY_RE.exec(line);
    return matched ? [matched[1]] : [];
  });
}

/** 比较两组 key，返回基线缺失与目标多余项 */
function diffKeys(
  baselineKeys: string[],
  targetKeys: string[],
): {
  missing: string[];
  extra: string[];
} {
  const baselineSet = new Set(baselineKeys);
  const targetSet = new Set(targetKeys);
  return {
    missing: baselineKeys.filter((k) => !targetSet.has(k)),
    extra: targetKeys.filter((k) => !baselineSet.has(k)),
  };
}

/** 报告累加器：命中项计入差异总数并决定退出码 */
function makeReport() {
  const details: string[] = [];
  return {
    details,
    diffs: 0,
    roots: 0,
    /** 记录一条缺陷；weight 为该项涉及的 key 数（默认 1） */
    push(message: string, weight = 1) {
      details.push(message);
      this.diffs += weight;
    },
  };
}

type Report = ReturnType<typeof makeReport>;

/** 语言搜索根：公共层 + 主应用 + 各子应用（相对给定仓库根） */
function searchRoots(root: string): string[] {
  const appsDir = join(root, 'apps');
  const apps = existsSync(appsDir)
    ? readdirSync(appsDir).filter((name) => !name.startsWith('.'))
    : [];
  return [
    'comm/locales/src/langs',
    'main/src/locales/langs',
    ...apps.map((name) => `apps/${name}/src/locales/langs`),
  ];
}

/** 比对单个词典文件，命中差异时写入报告 */
function compareModule(
  report: Report,
  label: string,
  baselineKeys: string[],
  targetSource: string,
  parse: (source: string) => string[],
): void {
  try {
    const { missing, extra } = diffKeys(baselineKeys, parse(targetSource));
    if (missing.length === 0 && extra.length === 0) {
      return;
    }
    report.push(`[key 不一致] ${label}`, missing.length + extra.length);
    for (const k of missing) {
      report.details.push(`  - ${label.split('/').pop()} 缺失: ${k}`);
    }
    for (const k of extra) {
      report.details.push(`  - ${BASELINE_LANG} 缺失: ${k}`);
    }
  } catch (error) {
    report.push(`[解析失败] ${label}: ${(error as Error).message}`);
  }
}

/**
 * 校验应用层 JSON 词典：目录完整性 → 文件完整性 → 叶子 key 一致性。
 *
 * <p>反向同时校验「多余文件 / 未知语种目录」，防止残留或拼错的目录让门禁误判为通过。
 *
 * @param report - 共享报告累加器
 * @param root - 仓库根
 */
function checkJsonLocales(report: Report, root: string): void {
  for (const relativeRoot of searchRoots(root)) {
    const rootPath = join(root, relativeRoot);
    const baselineDir = join(rootPath, BASELINE_LANG);

    if (!existsSync(baselineDir) || !statSync(baselineDir).isDirectory()) {
      continue;
    }

    const baselineFiles = readdirSync(baselineDir).filter((f) => f.endsWith('.json'));
    report.roots += 1;

    // 反向维度：目录内出现清单外的语种，说明拼错或废弃语种未清理
    for (const entry of readdirSync(rootPath)) {
      if (!ALL_LANGUAGES.includes(entry) && statSync(join(rootPath, entry)).isDirectory()) {
        report.push(`[未知语种] ${relativeRoot}/${entry}/ 不在 ${ALL_LANGUAGES.join('/')} 清单内`);
      }
    }

    const baselineSources = new Map<string, string[]>();
    for (const file of baselineFiles) {
      baselineSources.set(
        file,
        collectKeys(JSON.parse(readFileSync(join(baselineDir, file), 'utf-8'))),
      );
    }

    for (const lang of TARGET_LANGUAGES) {
      const langDir = join(rootPath, lang);

      // 维度 1: 目录完整性
      if (!existsSync(langDir)) {
        report.push(`[缺失目录] ${relativeRoot}/${lang}/`);
        continue;
      }

      // 反向维度：目标语种多出基线没有的模块文件
      for (const file of readdirSync(langDir)
        .filter((f) => f.endsWith('.json') && !baselineFiles.includes(f))
        .sort()) {
        report.push(`[多余文件] ${relativeRoot}/${lang}/${file}`);
      }

      // 维度 2: 文件完整性 + 维度 3: key 一致性
      for (const [file, baselineKeys] of baselineSources) {
        const targetFile = join(langDir, file);

        if (!existsSync(targetFile)) {
          report.push(`[缺失文件] ${relativeRoot}/${lang}/${file}`);
          continue;
        }
        compareModule(
          report,
          `${relativeRoot}/${lang}/${file}`,
          baselineKeys,
          readFileSync(targetFile, 'utf-8'),
          (source) => collectKeys(JSON.parse(source)),
        );
      }
    }
  }
}

/**
 * 校验语种清单单一来源：{@code comm/constants/src/core.ts} 的 SUPPORT_LANGUAGES
 * 必须与本脚本的 ALL_LANGUAGES 集合一致。
 *
 * <p>SUPPORT_LANGUAGES 决定语言切换器暴露的选项，本脚本的清单决定校验范围；
 * 两者一旦脱节，新增语种会「用户能切到但门禁不校验」，或反之门禁拦住选项里
 * 并不存在的语种。常量文件不存在时跳过（夹具可只放词典目录）。
 *
 * @param report - 共享报告累加器
 * @param root - 仓库根
 */
function checkLanguageListDrift(report: Report, root: string): void {
  const constantsFile = join(root, 'comm/constants/src/core.ts');
  if (!existsSync(constantsFile)) {
    return;
  }
  const source = readFileSync(constantsFile, 'utf-8');
  // 锚定声明本身：常量文件里 JSDoc 也提到了 SUPPORT_LANGUAGES
  const declaration = source.indexOf('export const SUPPORT_LANGUAGES');
  if (declaration === -1) {
    report.push('[语种清单漂移] comm/constants/src/core.ts 缺少 SUPPORT_LANGUAGES 声明');
    return;
  }
  const block = source.slice(declaration);
  const declared = [...block.slice(0, block.indexOf('];')).matchAll(/value:\s*'([^']+)'/g)].map(
    (match) => match[1],
  );

  if (declared.length === 0) {
    report.push('[语种清单漂移] comm/constants/src/core.ts 未解析出 SUPPORT_LANGUAGES 选项');
    return;
  }
  const { missing, extra } = diffKeys(ALL_LANGUAGES, declared);
  if (missing.length === 0 && extra.length === 0) {
    return;
  }
  report.push(
    '[语种清单漂移] SUPPORT_LANGUAGES 与 check-locales 的 ALL_LANGUAGES 不一致',
    missing.length + extra.length,
  );
  for (const lang of missing) {
    report.details.push(`  - SUPPORT_LANGUAGES 缺失: ${lang}`);
  }
  for (const lang of extra) {
    report.details.push(`  - ALL_LANGUAGES 缺失: ${lang}`);
  }
}

/**
 * 校验组件库内置词典：每个 {@code <lang>.ts} 的扁平 key 集合须与 zh-CN 相同。
 *
 * <p>该层语种数量多于应用层，独立以目录实测为清单，避免与应用层 6 语种耦合。
 *
 * @param report - 共享报告累加器
 * @param root - 仓库根
 */
function checkUikitLocale(report: Report, root: string): void {
  const dir = join(root, UIKIT_LOCALE_DIR);
  const baselineFile = join(dir, `${BASELINE_LANG}.ts`);

  if (!existsSync(baselineFile)) {
    report.push(`[缺失文件] ${UIKIT_LOCALE_DIR}/${BASELINE_LANG}.ts`);
    return;
  }

  const langFiles = readdirSync(dir).filter((f) => LOCALE_FILE_RE.test(f) && f.endsWith('.ts'));
  const baselineKeys = collectFlatKeys(readFileSync(baselineFile, 'utf-8'));
  report.roots += 1;

  for (const file of langFiles) {
    if (file === `${BASELINE_LANG}.ts`) {
      continue;
    }
    compareModule(
      report,
      `${UIKIT_LOCALE_DIR}/${file}`,
      baselineKeys,
      readFileSync(join(dir, file), 'utf-8'),
      collectFlatKeys,
    );
  }
}

/** 汇总校验，返回报告（--self-test 用夹具根调用） */
function collectReport(root: string): Report {
  const report = makeReport();
  checkJsonLocales(report, root);
  checkUikitLocale(report, root);
  checkLanguageListDrift(report, root);
  return report;
}

// =====================================================================/
// 翻译质量棘轮：拦机翻痕迹，预算只减不增
// =====================================================================/

/**
 * 「key 齐了但值没翻」是 key-parity 校验拦不住的缺陷：批量机翻会把 en 原文照抄进
 * ja/ko/es/fr，或逐词硬译（`いいえ application data`），或抹掉 es/fr 的变音符
 * （`Exito`/`Duracion`/`Succes`）。界面在切换语种后渲染半英半日的拼接文本，
 * 对母语用户等于没有本地化——但词典"完整"，parity 门禁全绿。
 *
 * <p>本棘轮只收<b>高精度</b>信号（宁可漏报也不能冤枉，否则会被当噪声关掉）：
 * <ol>
 *   <li>{@code [机翻照抄]}：值与 en-US 完全一致且含空格（单词级同形如 Total/Rank 属合法同源词，放过）</li>
 *   <li>{@code [逐词硬译]}：以{@code いいえ}/{@code 아니요} 起头直接拼英文词（"暂无 X" 的机械直译）</li>
 *   <li>{@code [丢变音符]}：整串纯 ASCII，却含{@link ACCENT_REQUIRED}里"必须带音符"的词</li>
 * </ol>
 *
 * <p>存量债务（实测 880 处）一次性清不完，因此按语种记预算：超过预算即失败，
 * 重译后用 {@code --update-quality-baseline} 把预算下调，债务只会单调减少。
 */
const QUALITY_BASELINE_FILE = 'bash/i18n-quality-baseline.json';

/** 各语种「拼成 ASCII 即错」的高频词（西/法的必备音符形式） */
const ACCENT_REQUIRED: Record<string, Set<string>> = {
  'es-ES': new Set([
    'accion',
    'analisis',
    'aplicacion',
    'area',
    'atencion',
    'configuracion',
    'contrasena',
    'creacion',
    'diagnostico',
    'direccion',
    'duracion',
    'edicion',
    'eliminacion',
    'epoca',
    'exito',
    'informacion',
    'numero',
    'proximo',
    'revision',
    'seleccion',
    'sesion',
    'ultimo',
  ]),
  'fr-FR': new Set([
    'deuxieme',
    'detail',
    'duree',
    'etat',
    'generation',
    'nationalite',
    'numerique',
    'operation',
    'parametre',
    'premiere',
    'resultat',
    'selection',
    'succes',
  ]),
};

/** 组件库词典的词条行（同时取 key 与 value） */
const UIKIT_KV_RE = /^\s+'([^']+)':\s*'((?:[^'\\]|\\.)*)'/;

/** 参与质量判定的语种：排除基线 zh-CN，也排除作为"照抄对照物"的 en-US */
const QUALITY_LANGUAGES = TARGET_LANGUAGES.filter((lang) => lang !== 'en-US');

/** 一条质量命中 */
interface QualityHit {
  /** 命中的规则标签 */
  rule: string;
  /** 语种 */
  lang: string;
}

/** 把 JSON 词典摊平成 {@code key → string 值}（只收字符串叶子） */
function leafValues(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, leafValues(value, path));
    } else if (typeof value === 'string') {
      out[path] = value;
    }
  }
  return out;
}

/**
 * 判定一个词条是否带机翻痕迹。
 *
 * @param lang - 目标语种
 * @param value - 目标语种文案
 * @param enValue - 同 key 的英文原文（无则不参与照抄判定）
 * @return 命中的规则标签列表
 */
function qualityRules(lang: string, value: string, enValue?: string): string[] {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [];
  }
  const rules: string[] = [];
  if (enValue !== undefined && trimmed === enValue.trim() && /\s/.test(trimmed)) {
    rules.push('[机翻照抄]');
  }
  if (/^(いいえ|아니요)\s+[A-Za-z]/.test(trimmed)) {
    rules.push('[逐词硬译]');
  }
  const accentWords = ACCENT_REQUIRED[lang];
  if (accentWords && /^[\x20-\x7f]*$/.test(trimmed)) {
    for (const word of trimmed.toLowerCase().split(/[^a-z]+/)) {
      if (accentWords.has(word)) {
        rules.push('[丢变音符]');
        break;
      }
    }
  }
  return rules;
}

/**
 * 汇总全仓机翻痕迹，按语种计数。
 *
 * @param root - 仓库根
 * @return {@code 语种 → 命中数}
 */
function countQualityHits(root: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const bump = (hit: QualityHit) => {
    counts[hit.lang] = (counts[hit.lang] ?? 0) + 1;
  };

  for (const relativeRoot of searchRoots(root)) {
    const enDir = join(root, relativeRoot, 'en-US');
    if (!existsSync(enDir)) {
      continue;
    }
    for (const lang of QUALITY_LANGUAGES) {
      const langDir = join(root, relativeRoot, lang);
      if (!existsSync(langDir)) {
        continue;
      }
      for (const file of readdirSync(langDir).filter((f) => f.endsWith('.json'))) {
        const enFile = join(enDir, file);
        if (!existsSync(enFile)) {
          continue;
        }
        let enValues: Record<string, string>;
        let langValues: Record<string, string>;
        try {
          enValues = leafValues(JSON.parse(readFileSync(enFile, 'utf-8')));
          langValues = leafValues(JSON.parse(readFileSync(join(langDir, file), 'utf-8')));
        } catch {
          // 解析失败由 key 一致性维度负责报错，此处不重复计
          continue;
        }
        for (const [key, value] of Object.entries(langValues)) {
          for (const rule of qualityRules(lang, value, enValues[key])) {
            bump({ lang, rule });
          }
        }
      }
    }
  }

  const uikitDir = join(root, UIKIT_LOCALE_DIR);
  if (existsSync(join(uikitDir, 'en.ts'))) {
    const enValues = uikitKeyValues(readFileSync(join(uikitDir, 'en.ts'), 'utf-8'));
    for (const file of readdirSync(uikitDir).filter(
      (f) => LOCALE_FILE_RE.test(f) && f.endsWith('.ts') && !f.startsWith('en.') && !f.startsWith('zh-CN.'),
    )) {
      const lang = file.replace('.ts', '');
      const values = uikitKeyValues(readFileSync(join(uikitDir, file), 'utf-8'));
      for (const [key, value] of Object.entries(values)) {
        for (const rule of qualityRules(lang, value.replaceAll("\\'", "'"), enValues[key])) {
          bump({ lang, rule });
        }
      }
    }
  }

  return counts;
}

/** 抽取组件库 TS 词典的 {@code key → value}（不做转义还原） */
function uikitKeyValues(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of source.split('\n')) {
    const matched = UIKIT_KV_RE.exec(line);
    if (matched) {
      out[matched[1]] = matched[2];
    }
  }
  return out;
}

/** 质量预算文件结构 */
interface QualityBaseline {
  /** 提示：预算由 --update-quality-baseline 生成，只允许下调 */
  hint: string;
  /** 语种 → 允许的机翻痕迹数 */
  budgets: Record<string, number>;
}

/**
 * 把命中数与预算比对，返回待报缺陷（纯函数，便于自检覆盖"超预算必须红"这条路径）。
 *
 * @param counts - 实测机翻痕迹数
 * @param budgets - 预算数
 * @return 问题描述列表，空表示在预算内
 */
function compareQualityToBudget(counts: Record<string, number>, budgets: Record<string, number>): string[] {
  const over: string[] = [];
  for (const [lang, count] of Object.entries(counts)) {
    const budget = budgets[lang] ?? 0;
    if (count > budget) {
      over.push(`${lang}: 命中 ${count} > 预算 ${budget}（新增 ${count - budget} 处机翻痕迹）`);
    }
  }
  // 预算里挂着已不再出现的语种且仍有额度，说明债务清了却没下调预算
  for (const [lang, budget] of Object.entries(budgets)) {
    if (budget > 0 && (counts[lang] ?? 0) === 0) {
      over.push(`${lang}: 预算 ${budget} 但已零命中，请跑 --update-quality-baseline 归零`);
    }
  }
  return over;
}

/**
 * 翻译质量棘轮：命中数不得超过预算，预算文件缺失即失败（防"没有基线=没有债务"的误读）。
 *
 * @param root - 仓库根
 * @param writeBaseline - 是否把当前命中数写回预算（重译后收紧）
 */
function checkTranslationQuality(root: string, writeBaseline: boolean): void {
  const counts = countQualityHits(root);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const baselinePath = join(root, QUALITY_BASELINE_FILE);

  if (writeBaseline) {
    const payload: QualityBaseline = {
      budgets: Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))),
      hint: '机翻痕迹预算：由 `node ./bash/check-locales.mts --update-quality-baseline` 生成，只允许下调',
    };
    writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
    console.log(
      `[check:i18n] 已写入质量预算：合计 ${total} 处 → ${QUALITY_BASELINE_FILE}（后续只减不增）`,
    );
    process.exit(0);
  }

  if (!existsSync(baselinePath)) {
    console.error(
      `[check:i18n] 缺少质量预算文件 ${QUALITY_BASELINE_FILE} —— ` +
        '没有基线不等于没有债务，先跑 `node ./bash/check-locales.mts --update-quality-baseline` 记录现状。',
    );
    process.exit(1);
  }

  const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8')) as QualityBaseline;
  const over = compareQualityToBudget(counts, baseline.budgets);
  if (over.length > 0) {
    console.error('[check:i18n] 翻译质量预算被突破（判据：机翻照抄 / 逐词硬译 / 丢变音符）：');
    console.error(over.map((item) => `  - ${item}`).join('\n'));
    process.exit(1);
  }
  console.log(
    `[check:i18n] 翻译质量预算内 ✓ — 机翻痕迹存量 ${total} 处（` +
      `${Object.entries(counts).map(([l, n]) => `${l} ${n}`).join('、')}）`,
  );
}

// =====================================================================/
// 门禁自检：反例夹具必须逐项命中，正例夹具必须零命中
// =====================================================================/

/** 反例清单：[说明, 报告里必须出现的片段] */
const REQUIRED_DETECTIONS: [string, string][] = [
  ['语种目录缺失', '[缺失目录]'],
  ['未知语种目录', '[未知语种]'],
  ['模块文件缺失', '[缺失文件]'],
  ['模块文件多余', '[多余文件]'],
  ['JSON 叶子 key 缺失', '缺失: orphan.only'],
  ['JSON 叶子 key 多余', '缺失: extra.key'],
  ['JSON 解析失败', '[解析失败]'],
  ['组件库词典 key 缺失', '缺失: table.confirm'],
  ['语种清单漂移', '[语种清单漂移]'],
];

/** SUPPORT_LANGUAGES 常量夹具（语言切换器的语种清单单一来源） */
function supportLanguagesFixture(values: string[]): string {
  const entries = values.map((value) => `  { label: '${value}', value: '${value}' },`).join('\n');
  return `export const SUPPORT_LANGUAGES: LanguageOption[] = [\n${entries}\n];\n`;
}

/** 语种目录夹具：{@code lang → 文件名 → 文件内容} */
type LangDirs = Record<string, Record<string, string>>;

/** 应用层反例：每个语种各踩中一类缺陷，未列出的语种即「目录缺失」 */
const BROKEN_JSON_DIRS: LangDirs = {
  'zh-CN': {
    'common.json': json({ back: 'zh-CN', orphan: { only: 'zh-CN' } }),
    'page.json': json({ title: 'zh-CN' }),
  },
  'en-US': {
    // 缺 orphan.only 叶子，且整个 page.json 未翻译
    'common.json': json({ back: 'en-US' }),
  },
  'ja-JP': {
    // 多出基线没有的叶子，且多出一个基线没有的模块文件
    'common.json': json({ back: 'ja-JP', orphan: { only: 'ja-JP' }, extra: { key: 'ja-JP' } }),
    'page.json': json({ title: 'ja-JP' }),
    'bonus.json': json({ any: 'ja-JP' }),
  },
  'ko-KR': {
    'common.json': '{ not json',
    'page.json': json({ title: 'ko-KR' }),
  },
  'es-ES': {
    'common.json': json({ back: 'es-ES', orphan: { only: 'es-ES' } }),
    'page.json': json({ title: 'es-ES' }),
  },
  // fr-FR 整目录缺失 → [缺失目录]
};

/** 组件库词典夹具：en-US 故意缺 table.confirm */
const BROKEN_UIKIT_DIR: Record<string, string> = {
  'zh-CN.ts': uikitEntryLine('zh-CN', 'zh-CN'),
  'en-US.ts': "export const pack = {\n  'table.cancel': 'en-US',\n} as const;\n",
  'de-DE.ts': uikitEntryLine('de-DE', 'de-DE'),
};

/** JSON 序列化（夹具用，保持与真实词典一致的 2 空格缩进） */
function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** 生成一份完整对齐的组件库 TS 词典 */
function uikitEntryLine(confirm: string, cancel: string): string {
  return `export const pack = {\n  'table.confirm': '${confirm}',\n  'table.cancel': '${cancel}',\n} as const;\n`;
}

/** 把 {@code lang → 文件 → 内容} 落到 langs 目录下 */
function writeLangDirs(langsDir: string, dirs: LangDirs): void {
  for (const [lang, files] of Object.entries(dirs)) {
    const langDir = join(langsDir, lang);
    mkdirSync(langDir, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(langDir, name), content, 'utf-8');
    }
  }
}

/** 组件库夹具落盘（相对仓库根的路径 → 内容） */
function uikitFixtureFiles(dirs: Record<string, string>): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [name, content] of Object.entries(dirs)) {
    files[`${UIKIT_LOCALE_DIR}/${name}`] = content;
  }
  return files;
}

/** 把扁平「相对路径 → 内容」映射落盘到 dir */
function writeFixture(dir: string, files: Record<string, string>): void {
  for (const [relative, content] of Object.entries(files)) {
    const target = join(dir, relative);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content, 'utf-8');
  }
}

/** 完全对齐的应用层夹具（正例断言用） */
function alignedJsonDirs(): LangDirs {
  const dirs: LangDirs = {};
  for (const lang of ALL_LANGUAGES) {
    dirs[lang] = {
      'common.json': json({ back: lang }),
      'page.json': json({ title: lang }),
    };
  }
  return dirs;
}

/**
 * 质量棘轮自检：三类机翻痕迹必须逐项命中，合法同源词与已重译文本必须零命中。
 * 与 selfTest() 分开——它验的是"值"，selfTest() 验的是"key 集合"。
 */
function qualitySelfTest(): void {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-quality-gate-'));
  const clean = mkdtempSync(join(tmpdir(), 'ydsz-quality-gate-ok-'));
  try {
    writeLangDirs(join(dir, 'comm/locales/src/langs'), {
      'en-US': { 'common.json': json({ copied: 'No application data', single: 'Total' }) },
      'es-ES': { 'common.json': json({ accent: 'Exito', ok: 'Éxito' }) },
      'fr-FR': { 'common.json': json({ accent: 'Succes', ok: 'Succès' }) },
      'ja-JP': {
        'common.json': json({
          copied: 'No application data',
          gloss: 'いいえ application data',
          single: 'Total',
        }),
      },
      'ko-KR': { 'common.json': json({ copied: 'No application data', gloss: '아니요 application data' }) },
      'zh-CN': {
        'common.json': json({ accent: 'zh', copied: 'zh', gloss: 'zh', ok: 'zh', single: 'zh' }),
      },
    });
    const counts = countQualityHits(dir);
    const expected: Record<string, number> = {
      'es-ES': 1,
      'fr-FR': 1,
      'ja-JP': 2,
      'ko-KR': 2,
    };
    const problems: string[] = [];
    for (const [lang, want] of Object.entries(expected)) {
      if (counts[lang] !== want) {
        problems.push(`${lang} 命中 ${counts[lang] ?? 0}，期望 ${want}`);
      }
    }
    for (const [lang, got] of Object.entries(counts)) {
      if (expected[lang] === undefined) {
        problems.push(`${lang} 意外命中 ${got}（规则冤枉了合法写法）`);
      }
    }

    writeLangDirs(join(clean, 'comm/locales/src/langs'), {
      'en-US': { 'common.json': json({ copied: 'No application data', single: 'Total' }) },
      'es-ES': { 'common.json': json({ accent: 'Éxito', copied: 'Sin datos de aplicación', single: 'Total' }) },
      'fr-FR': { 'common.json': json({ accent: 'Succès', copied: 'Aucune donnée', single: 'Total' }) },
      'ja-JP': {
        'common.json': json({
          copied: 'アプリデータがありません',
          gloss: 'アプリデータがありません',
          single: 'Total',
        }),
      },
      'ko-KR': { 'common.json': json({ copied: '총 기록', gloss: '총 기록', single: 'Total' }) },
      'zh-CN': {
        'common.json': json({ accent: 'zh', copied: 'zh', gloss: 'zh', single: 'zh' }),
      },
    });
    const cleanCounts = countQualityHits(clean);
    if (Object.keys(cleanCounts).length > 0) {
      problems.push(`已重译的词典仍被判缺陷：${JSON.stringify(cleanCounts)}`);
    }

    // 棘轮本身：超预算必须红、预算内必须绿、清完债务却不收预算也要红
    if (compareQualityToBudget({ 'ja-JP': 3 }, { 'ja-JP': 2 }).length !== 1) {
      problems.push('超预算未被判红（棘轮失效，等于没有门禁）');
    }
    if (compareQualityToBudget({ 'ja-JP': 1 }, { 'ja-JP': 2 }).length !== 0) {
      problems.push('预算内被误判红（会逼着人关掉门禁）');
    }
    if (compareQualityToBudget({ 'ja-JP': 0 }, { 'ja-JP': 2 }).length !== 1) {
      problems.push('债务已清但预算未下调，未被提醒');
    }
    if (compareQualityToBudget({ 'es-ES': 1 }, {}).length !== 1) {
      problems.push('预算缺失语种时未按 0 额度处理（新语种可绕过棘轮）');
    }

    if (problems.length > 0) {
      console.error('❌ 质量棘轮自检失败（检查已空转或冤枉合法写法）：');
      for (const problem of problems) {
        console.error(`  - ${problem}`);
      }
      process.exit(1);
    }
    console.log(
      `✅ 质量棘轮自检通过：三类痕迹命中 ${Object.values(expected).reduce((a, b) => a + b, 0)} 处 / 4 语种，` +
        '合法同源词与已重译文本 0 冤枉',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(clean, { recursive: true, force: true });
  }
}

function selfTest(): void {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-locales-gate-'));
  const clean = mkdtempSync(join(tmpdir(), 'ydsz-locales-gate-ok-'));
  try {
    // 反例夹具：comm 层逐项踩坑 + apps 层对齐（证明搜索根真的枚举到子应用）
    writeLangDirs(join(dir, 'comm/locales/src/langs'), BROKEN_JSON_DIRS);
    const unknownLangDir = join(dir, 'comm/locales/src/langs/zh-TW');
    mkdirSync(unknownLangDir, { recursive: true });
    writeFileSync(join(unknownLangDir, 'common.json'), json({ back: 'zh-TW' }), 'utf-8');
    writeLangDirs(join(dir, 'apps/demo-web/src/locales/langs'), alignedJsonDirs());
    writeFixture(dir, uikitFixtureFiles(BROKEN_UIKIT_DIR));
    // 语种清单多出一个 ALL_LANGUAGES 未纳入的语种 → [语种清单漂移]
    writeFixture(dir, {
      'comm/constants/src/core.ts': supportLanguagesFixture([...ALL_LANGUAGES, 'zh-TW']),
    });

    const report = collectReport(dir);
    const haystack = report.details.join('\n');
    const missed = REQUIRED_DETECTIONS.filter(([, needle]) => !haystack.includes(needle));
    if (missed.length > 0) {
      console.error('❌ 门禁自检失败：反例未被下列检查命中，说明检查已空转：');
      for (const [name] of missed) {
        console.error(`  - ${name}`);
      }
      console.error(`  实际检出 ${report.diffs} 处：`);
      for (const line of report.details) {
        console.error(`    · ${line}`);
      }
      process.exit(1);
    }
    if (report.roots < 3) {
      console.error(`❌ 门禁自检失败：夹具只命中 ${report.roots} 个词典根，搜索根枚举失效`);
      process.exit(1);
    }

    // 正向断言：对齐的夹具必须零命中，否则门禁会拦掉正确写法
    writeLangDirs(join(clean, 'comm/locales/src/langs'), alignedJsonDirs());
    writeFixture(
      clean,
      uikitFixtureFiles({
        'zh-CN.ts': uikitEntryLine('确认', '取消'),
        'en-US.ts': uikitEntryLine('Confirm', 'Cancel'),
      }),
    );
    writeFixture(clean, {
      'comm/constants/src/core.ts': supportLanguagesFixture(ALL_LANGUAGES),
    });
    const cleanReport = collectReport(clean);
    if (cleanReport.diffs > 0) {
      console.error('❌ 门禁自检失败：对齐的词典被判为缺陷：');
      for (const line of cleanReport.details) {
        console.error(`  - ${line}`);
      }
      process.exit(1);
    }

    console.log(
      `✅ 门禁自检通过：反例命中 ${REQUIRED_DETECTIONS.length}/${REQUIRED_DETECTIONS.length} 项，` +
        `词典根 ${report.roots} 个，另含正向断言（对齐词典零命中）`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(clean, { recursive: true, force: true });
  }
}

// =====================================================================/
// 主流程
// =====================================================================/

const argv = process.argv.slice(2);
const rootFlagIdx = argv.indexOf('--root');
const microRoot = rootFlagIdx === -1 ? REPO_ROOT : argv[rootFlagIdx + 1];
if (rootFlagIdx !== -1 && !microRoot) {
  console.error('❌ --root 需要一个目录参数');
  process.exit(1);
}
const SUPPORTED_ARGS = new Set(['--self-test', '--root', '--update-quality-baseline']);
const UNKNOWN_ARGS = argv.filter((arg, i) => !SUPPORTED_ARGS.has(arg) && i !== rootFlagIdx + 1);
if (UNKNOWN_ARGS.length > 0) {
  console.error(
    `❌ 未知参数：${UNKNOWN_ARGS.join(' ')}（支持 --self-test、--root <dir>、--update-quality-baseline）`,
  );
  process.exit(1);
}

if (argv.includes('--self-test')) {
  selfTest();
  qualitySelfTest();
} else {
  // 显式收紧预算时先落盘再退出，避免"债务已清但门禁还在按老预算放行"
  if (argv.includes('--update-quality-baseline')) {
    checkTranslationQuality(microRoot, true);
  }

  const report = collectReport(microRoot);

  // 空转防护：一个词典根都没命中，说明目录结构或搜索根清单已失效
  if (report.roots === 0) {
    console.error('[check:i18n] 未发现任何词典根（搜索根清单失效或目录迁移未同步），按失败处理。');
    process.exit(1);
  }

  if (report.diffs !== 0) {
    console.error(
      `[check:i18n] 发现 ${report.diffs} 处翻译差异（已检查 ${report.roots} 个词典根）：\n`,
    );
    console.error(report.details.join('\n'));
    console.error('\n请补齐缺失的翻译文件/目录后重试（以 zh-CN 为基线事实来源）。');
    process.exit(1);
  }

  checkTranslationQuality(microRoot, false);

  console.log(
    `[check:i18n] 全语种校验通过 ✓ — ${report.roots} 个词典根 × ${TARGET_LANGUAGES.length} 个目标语种（外加组件库按目录实测语种）`,
  );
  process.exit(0);
}
