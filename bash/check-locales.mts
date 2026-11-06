#!/usr/bin/env node
/**
 * check-locales.mts — 国际化 key 一致性校验（全语种门禁）
 *
 * <p>覆盖两层词典，均以 zh-CN 为基线做 key 集合比对：
 * <ol>
 *   <li>应用层 JSON 词典 — comm / main / apps/* 的 {@code langs/<lang>/<module>.json}，
 *       语种清单与 {@code SupportedLanguagesType} 一致（仅 zh-CN / en-US 双语）</li>
 *   <li>组件库内置词典 — {@code comm/@core/ui-kit/ydsz-ui/src/locale/<lang>.ts}，
 *       扁平点号 key，与应用层保持一致（仅 zh-CN / en-US）</li>
 * </ol>
 *
 * <p>校验维度：语种目录缺失/未知、模块文件缺失/多余、叶子 key 集合不一致、解析失败、
 * 组件库源码<b>引用了词典里不存在的键</b>（见 {@link checkUikitKeyUsage}）。
 * 任一项不通过即退出码 1，供 {@code pnpm check:i18n} 与 CI 门禁消费。
 *
 * <p>设计契合「最小化外部依赖、绝对可控」原则：零第三方依赖，原生 Node 实现。
 *
 * @usage
 *   node bash/check-locales.mts                 # 全量校验，有差异退出码 1
 *   node bash/check-locales.mts --root <dir>    # 指定仓库根（自检夹具用）
 *   node bash/check-locales.mts --self-test     # 用反例夹具证明本门禁不是空转
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
const ALL_LANGUAGES = ['zh-CN', 'en-US'];

/** 需要校验的语种（排除基线自身） */
const TARGET_LANGUAGES = ALL_LANGUAGES.filter((lang) => lang !== BASELINE_LANG);

/** 组件库内置词典目录 — 扁平点号 key 的 TS 常量，语种数量独立于应用层 */
const UIKIT_LOCALE_DIR = 'comm/@core/ui-kit/ydsz-ui/src/locale';

/** 组件库包根 — 词典本体所在包 */
const UIKIT_PKG_DIR = 'comm/@core/ui-kit/ydsz-ui';

/** ui-kit 包根目录 — 词典键引用点的搜索范围 */
const UIKIT_DIR = 'comm/@core/ui-kit';

/**
 * 引用组件库词典键的包：自动枚举 ui-kit 下声明 {@code @ydsz-core/ydsz-ui} 依赖的包。
 *
 * <p>这些包复用 ydsz-ui 的内置词典（{@code useLocale} 是公共导出、自带 BUILTIN_MESSAGES，
 * 宿主无需注入），它们的 {@code t('...')} 与 ydsz-ui 共用一份键集合，必须同批扫描。
 * 按 package.json 依赖枚举而不是手写清单：新增消费包零登记即被覆盖，清单漏登记时缺键引用
 * 会静默溜过门禁（此前 popup-ui/form-designer/ai-builder 就是靠人记得才扫到）。
 *
 * @param root - 仓库根（自检夹具根同样适用）
 * @returns 待扫描包目录（相对仓库根，正斜杠）
 */
function discoverKeyRefPkgDirs(root: string): string[] {
  const base = join(root, UIKIT_DIR);
  if (!existsSync(base)) {
    return [UIKIT_PKG_DIR];
  }
  const dirs = [UIKIT_PKG_DIR];
  for (const name of readdirSync(base)) {
    const manifestPath = join(base, name, 'package.json');
    if (!existsSync(manifestPath)) {
      continue;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const dependsOnLocale =
      manifest.dependencies?.['@ydsz-core/ydsz-ui'] ??
      manifest.peerDependencies?.['@ydsz-core/ydsz-ui'];
    if (dependsOnLocale) {
      dirs.push(`${UIKIT_DIR}/${name}`);
    }
  }
  return dirs;
}

/** 自检夹具用的兄弟包：声明了 ydsz-ui 依赖，夹具落进它才证明按依赖枚举真的生效 */
const SIBLING_REF_PKG_DIR = `${UIKIT_DIR}/popup-ui`;

/** 自检夹具用的第二个兄弟包：advanced-table 的词典键存在 .ts 数据里 */
const SIBLING_DATA_PKG_DIR = `${UIKIT_DIR}/advanced-table`;

/** 自检夹具用的包清单（只有声明 ydsz-ui 依赖的包才会被枚举进扫描范围） */
function dependentPkgManifest(name: string): string {
  return `${JSON.stringify(
    {
      name: `@ydsz-core/${name}`,
      dependencies: { '@ydsz-core/ydsz-ui': 'workspace:*' },
    },
    null,
    2,
  )}\n`;
}

/**
 * 组件里引用词典键的写法：{@code t('a.b')}；第二参是插值对象还是 fallback 都同样命中。
 *
 * <p>前置断言要排掉 {@code $t('cancel')} 这类调用：popup-ui 的 Alert/Drawer/Modal 用的是
 * useSimpleLocale 的极简兜底词典（无点号键 cancel/confirm/reset…），与组件库词典无关，
 * 按「引用缺键」报出来等于冤枉正确写法。
 */
const UIKIT_KEY_REF_RE = /(?<![\w$.])t\(\s*'([^']+)'/gu;

/**
 * 数据侧的键持有属性：{@code labelKey: 'a.b'} / {@code placeholderKey: 'a.b'}。
 *
 * <p>组件面板、快捷规则这类「数据驱动的文案」把词典键存进 .ts/.vue 的数据结构，渲染时才
 * {@code t(item.labelKey)} 取值——静态正则看不到 {@code t()} 调用，缺键会在界面上渲染成
 * {@code designer.item.xxx} 字面量。按属性名白名单收（不用通用 {@code \w+Key:}）：
 * {@code rowKey: 'id'}、{@code childrenKey: 'children'} 是字段名，不是词典键。
 */
const UIKIT_KEY_PROP_RE = /\b(?:labelKey|placeholderKey):\s*'([^']+)'/gu;

/**
 * 引用扫描跳过的路径片段。
 *
 * <p>{@code __tests__} 与 {@code *.test.ts} 必须排除：useLocale.test.ts 里
 * {@code t('nonexistent.key', 'fallback text')} 是故意引用缺键来验证回退链路，
 * 按缺陷报出来等于让门禁冤枉正确写法。
 */
const KEY_REF_SKIP = ['node_modules', '/dist/', '/__tests__/', '.test.ts', '/src/locale/'];

/** 语种文件命名形如 zh-CN.ts / zh-CN.json，用于排除 index、useLocale、测试文件 */
const LOCALE_FILE_RE = /^[a-z]{2}-[A-Z]{2}\.[a-z]+$/;

/**
 * 组件库词典的词条行：缩进 + 单引号点号 key + 字符串值。
 *
 * 值可能是单引号或双引号：prettier 对含撇号的译文（如法语 "Sélecteur d'heure"）
 * 会自动改用双引号包裹，只认单引号会把这类合法词条判成缺键。
 */
const UIKIT_ENTRY_RE = /^\s+'([^']+)':(?:\s*(?:'|"|$))/;

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
 * <p>该层与应用层保持一致，仅校验 zh-CN / en-US 双语。
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

/**
 * 收集组件库源码里对词典键的字面量引用（{@code t('a.b')} 与 {@code labelKey: 'a.b'}）。
 *
 * <p>逐行剔除注释行：本仓注释按规范一律中文，JSDoc 里常拿 {@code t('table.empty')} 举例，
 * 那类文本不是引用点。
 *
 * @param root - 仓库根
 * @returns 引用到的键及其「相对路径:行号」
 */
function collectKeyRefs(root: string): Array<{ key: string; at: string }> {
  const refs: Array<{ key: string; at: string }> = [];
  const scan = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const rel = abs.slice(root.length + 1).replaceAll('\\', '/');
      if (KEY_REF_SKIP.some((skip) => rel.includes(skip))) {
        continue;
      }
      if (statSync(abs).isDirectory()) {
        scan(abs);
        continue;
      }
      if (!/\.(?:ts|vue)$/u.test(name)) {
        continue;
      }
      readFileSync(abs, 'utf-8')
        .split(/\r?\n/u)
        .forEach((line, idx) => {
          if (/^\s*(?:\/\/|\*|\/\*)/u.test(line)) {
            return;
          }
          for (const re of [UIKIT_KEY_REF_RE, UIKIT_KEY_PROP_RE]) {
            for (const match of line.matchAll(re)) {
              refs.push({ key: match[1], at: `${rel}:${idx + 1}` });
            }
          }
        });
    }
  };
  for (const pkgDir of discoverKeyRefPkgDirs(root)) {
    const base = join(root, pkgDir);
    if (existsSync(base)) {
      scan(base);
    }
  }
  return refs;
}

/**
 * 校验组件引用的词典键在各语种里真实存在。
 *
 * <p>key parity 只保证「各语种键集合一致」，不保证「组件引用的键收录在词典里」；而
 * {@code useLocale.t()} 逐级回退的最终兜底是<b>键名本身</b>。实测 auto-complete.vue 曾写
 * {@code t('noData') ?? '无匹配结果'}——t() 返回 'noData' 恒为真值，中文兜底永远走不到，
 * 界面直接渲染出 "noData" 字面量。该缺陷在中文界面下完全隐形，只能按引用点显式拦截。
 *
 * @param report - 共享报告累加器
 * @param root - 仓库根
 */
function checkUikitKeyUsage(report: Report, root: string): void {
  const dir = join(root, UIKIT_LOCALE_DIR);
  // 词典目录缺失已由 checkUikitLocale 报出，此处不重复计
  if (!existsSync(dir)) {
    return;
  }
  const langFiles = readdirSync(dir).filter((f) => LOCALE_FILE_RE.test(f) && f.endsWith('.ts'));
  if (langFiles.length === 0) {
    return;
  }
  const keySets = langFiles.map(
    (file) =>
      [
        file.replace(/\.ts$/u, ''),
        new Set(collectFlatKeys(readFileSync(join(dir, file), 'utf-8'))),
      ] as const,
  );

  const reported = new Set<string>();
  for (const { key, at } of collectKeyRefs(root)) {
    // 同一缺键只报首处引用，避免词典缺一项时刷屏掩盖其它缺陷
    if (reported.has(key)) {
      continue;
    }
    const missingLangs = keySets.filter(([, set]) => !set.has(key)).map(([lang]) => lang);
    if (missingLangs.length === 0) {
      continue;
    }
    reported.add(key);
    report.push(
      `[引用缺键] ${at} 引用词典键 '${key}'，` +
        (missingLangs.length === keySets.length
          ? `全部 ${keySets.length} 个语种词典均无此键`
          : `语种 ${missingLangs.join('/')} 无此键`) +
        '（t() 未命中回退成键名字面量，会直接渲染到界面）',
    );
  }
}

/** 汇总校验，返回报告（--self-test 用夹具根调用） */
function collectReport(root: string): Report {
  const report = makeReport();
  checkJsonLocales(report, root);
  checkUikitLocale(report, root);
  checkUikitKeyUsage(report, root);
  checkLanguageListDrift(report, root);
  return report;
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
  ['组件引用词典里不存在的键', '[引用缺键]'],
  [
    '兄弟包（复用同一词典）的引用点也在扫描范围',
    `${SIBLING_REF_PKG_DIR}/src/image-viewer/Ghost.vue`,
  ],
  [
    '数据侧 labelKey/placeholderKey 字面量也按引用校验',
    `${SIBLING_REF_PKG_DIR}/src/palette/GhostPalette.ts`,
  ],
  [
    '新增消费包按 package.json 依赖自动纳入扫描范围',
    `${SIBLING_DATA_PKG_DIR}/src/components/ghost/Ghost.ts`,
  ],
  ['语种清单漂移', '[语种清单漂移]'],
];

/** SUPPORT_LANGUAGES 常量夹具（语言切换器的语种清单单一来源） */
function supportLanguagesFixture(values: string[]): string {
  const entries = values.map((value) => `  { label: '${value}', value: '${value}' },`).join('\n');
  return `export const SUPPORT_LANGUAGES: LanguageOption[] = [\n${entries}\n];\n`;
}

/** 语种目录夹具：{@code lang → 文件名 → 文件内容} */
type LangDirs = Record<string, Record<string, string>>;

/** 应用层反例：zh-CN 基线完整，en-US 踩中缺叶子 / 多叶子 / 解析失败 / 多余文件 */
const BROKEN_JSON_DIRS: LangDirs = {
  'zh-CN': {
    'common.json': json({ back: 'zh-CN', orphan: { only: 'zh-CN' } }),
    'page.json': json({ title: 'zh-CN' }),
  },
  'en-US': {
    'common.json': json({ back: 'en-US', extra: { key: 'en-US' } }),
    'page.json': '{ not json',
    'bonus.json': json({ any: 'en-US' }),
  },
};

/** 组件库词典夹具：en-US 故意缺 table.confirm */
const BROKEN_UIKIT_DIR: Record<string, string> = {
  'zh-CN.ts': uikitEntryLine('zh-CN', 'zh-CN'),
  'en-US.ts': "export const pack = {\n  'table.cancel': 'en-US',\n} as const;\n",
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

/** 组件库引用夹具：一个 .vue，在 setup 里以 {@code t('key')} 字面量引用词典键 */
function uikitRefFixture(keys: string[]): string {
  const body = keys.map((key) => `  const label = t('${key}');`).join('\n');
  return `<script setup lang="ts">\n${body}\n</script>\n\n<template>\n  <span>{{ label }}</span>\n</template>\n`;
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

function selfTest(): void {
  const dir = mkdtempSync(join(tmpdir(), 'ydsz-locales-gate-'));
  const clean = mkdtempSync(join(tmpdir(), 'ydsz-locales-gate-ok-'));
  try {
    // 反例夹具：comm 层逐项踩坑 + apps 层对齐（证明搜索根真的枚举到子应用）
    writeLangDirs(join(dir, 'comm/locales/src/langs'), BROKEN_JSON_DIRS);
    const unknownLangDir = join(dir, 'comm/locales/src/langs/zh-TW');
    mkdirSync(unknownLangDir, { recursive: true });
    writeFileSync(join(unknownLangDir, 'common.json'), json({ back: 'zh-TW' }), 'utf-8');
    // en-US 目录整体缺失 → [缺失目录]
    writeLangDirs(join(dir, 'apps/demo-web/src/locales/langs'), {
      'zh-CN': { 'common.json': json({ back: 'zh-CN' }), 'page.json': json({ title: 'zh-CN' }) },
    });
    // en-US 存在但缺 page.json → [缺失文件]
    writeLangDirs(join(dir, 'apps/demo-missing-file/src/locales/langs'), {
      'zh-CN': { 'common.json': json({ back: 'zh-CN' }), 'page.json': json({ title: 'zh-CN' }) },
      'en-US': { 'common.json': json({ back: 'en-US' }) },
    });
    writeFixture(dir, uikitFixtureFiles(BROKEN_UIKIT_DIR));
    // 组件引用了词典里不存在的键 → [引用缺键]
    writeFixture(dir, {
      [`${UIKIT_PKG_DIR}/src/components/ghost/Ghost.vue`]: uikitRefFixture(['table.ghost']),
    });
    // 按 package.json 依赖自动纳入的兄弟包：.vue 的 t() 与 .ts 数据里的 labelKey 都要命中
    writeFixture(dir, {
      [`${SIBLING_REF_PKG_DIR}/package.json`]: dependentPkgManifest('popup-ui'),
      [`${SIBLING_REF_PKG_DIR}/src/image-viewer/Ghost.vue`]: uikitRefFixture(['imageViewer.ghost']),
      [`${SIBLING_REF_PKG_DIR}/src/palette/GhostPalette.ts`]:
        'export const GHOST_META = [\n' +
        "  { labelKey: 'imageViewer.ghostLabel', placeholderKey: 'imageViewer.ghostPlaceholder' },\n" +
        '] as const;\n',
    });
    // 第二个消费包同样零登记即被扫到（证明扫描范围不是靠人记得）→ [引用缺键]
    writeFixture(dir, {
      [`${SIBLING_DATA_PKG_DIR}/package.json`]: dependentPkgManifest('advanced-table'),
      [`${SIBLING_DATA_PKG_DIR}/src/components/ghost/Ghost.ts`]:
        "export const GHOST_LABEL = { labelKey: 'rowExpand.ghost' };\n",
    });
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
    // 正例：引用已存在的键不得被拦（否则门禁会冤枉正确写法）
    writeFixture(clean, {
      [`${UIKIT_PKG_DIR}/src/components/ok/Ok.vue`]: uikitRefFixture([
        'table.confirm',
        'table.cancel',
      ]),
    });
    // 正例：$t()/i18n.t() 走宿主/极简兜底词典（无点号键），不属于组件库词典引用点
    writeFixture(clean, {
      [`${SIBLING_REF_PKG_DIR}/package.json`]: dependentPkgManifest('popup-ui'),
      [`${SIBLING_DATA_PKG_DIR}/package.json`]: dependentPkgManifest('advanced-table'),
      [`${SIBLING_REF_PKG_DIR}/src/alert/Alert.vue`]:
        '<script setup lang="ts">\nconst hint = i18n.t(\'prompt\');\n</script>\n\n' +
        "<template>\n  <span>{{ cancelText || $t('cancel') }}</span>\n</template>\n",
    });
    writeFixture(clean, {
      [`${SIBLING_REF_PKG_DIR}/src/table/useGhostTable.ts`]:
        "export const TABLE_CONF = { rowKey: 'id', childrenKey: 'children' };\n",
    });
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
const SUPPORTED_ARGS = new Set(['--self-test', '--root']);
const UNKNOWN_ARGS = argv.filter((arg, i) => !SUPPORTED_ARGS.has(arg) && i !== rootFlagIdx + 1);
if (UNKNOWN_ARGS.length > 0) {
  console.error(`❌ 未知参数：${UNKNOWN_ARGS.join(' ')}（支持 --self-test、--root <dir>）`);
  process.exit(1);
}

if (argv.includes('--self-test')) {
  selfTest();
} else {
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

  console.log(
    `[check:i18n] 双语校验通过 ✓ — ${report.roots} 个词典根 × ${TARGET_LANGUAGES.length} 个目标语种（外加组件库按目录实测语种）`,
  );
  process.exit(0);
}
