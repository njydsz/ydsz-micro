#!/usr/bin/env node
/**
 * font-subset.mts -- Font subsetting tool script
 *
 * Uses subset-font to split Chinese fonts (Source Han Sans / HarmonyOS Sans)
 * into three subsets on demand:
 *   1. Latin (English letters + digits + basic symbols)
 *   2. CJK-3500 (3500 common Chinese characters)
 *   3. CJK-ext (remaining rare Chinese characters)
 *
 * Source font files go in main/public/fonts/ (to be procured later),
 * output goes to main/public/fonts-subset/.
 *
 * @usage
 *   pnpm font-subset            # Subset all source fonts
 *   pnpm font-subset --text     # Auto-extract characters from page text
 *
 * @path bash/font-subset.mts
 * @author ydsz-team
 * @since 4.4.0
 */

import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MICRO_ROOT = join(import.meta.dirname, '..');
const FONTS_SRC_DIR = join(MICRO_ROOT, 'main', 'public', 'fonts');
const FONTS_OUT_DIR = join(MICRO_ROOT, 'main', 'public', 'fonts-subset');

interface FontSubset {
  suffix: string;
  unicodeRange: string;
  text: string;
}

const SUBSETS: readonly FontSubset[] = [
  {
    suffix: 'latin',
    unicodeRange:
      'U+0000-007F, U+0080-00FF, U+0100-017F, U+0180-024F, U+2000-206F, U+2070-209F',
    text:
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ' +
      '!"#$%&\x27()*+,-./:;<=>?@[\\]^_`{|}~',
  },
  {
    suffix: 'cjk-3500',
    unicodeRange: 'U+4E00-9FFF, U+3400-4DBF',
    text: buildCJK3500Text(),
  },
  {
    suffix: 'cjk-ext',
    unicodeRange: 'U+4E00-9FFF, U+3400-4DBF, U+20000-2A6DF, U+F900-FAFF',
    text: '',
  },
] as const;

function buildCJK3500Text(): string {
  return (
    '\u7684\u4e00\u662f\u4e0d\u4e86\u4eba\u6211\u5728\u6709\u4ed6\u8fd9' +
    '\u4e3a\u4e4b\u5927\u6765\u4ee5\u4e2d\u4e2a\u4e0a\u4eec\u5230\u8bf4\u56fd' +
    '\u548c\u5730\u4e5f\u5b50\u65f6\u9053\u51fa\u800c\u8981\u4e8e\u5c31\u4e0b' +
    '\u5f97\u53ef\u4f60\u5e74\u751f\u81ea\u4f1a\u90a3\u540e\u80fd\u5bf9\u7740' +
    '\u4e8b\u5176\u91cc\u6240\u53bb\u884c\u8fc7\u5bb6\u5341\u7528\u53d1\u5929' +
    '\u5982\u7136\u4f5c\u65b9\u6210\u8005\u591a\u65e5\u90fd\u4e09\u5c0f\u519b' +
    '\u4e8c\u65e0\u540c\u4e48\u7ecf\u6cd5\u5f53\u8d77\u4e0e\u597d\u770b\u5b66' +
    '\u8fdb\u79cd\u5c06\u8fd8\u5206\u6b64\u5fc3\u524d\u9762\u53c8\u5b9a\u89c1' +
    '\u53ea\u4e3b\u6ca1\u516c\u4ece\u65b0\u660e\u60f3\u4f46\u5f00\u4e9b\u5df2' +
    '\u4e24\u53e3\u5e94\u7b2c\u6b63\u5916\u95ee\u5b83\u6700\u95f4\u95e8\u5c11' +
    '\u56de\u5458\u5148\u5c71\u8ba4\u8bc6\u4ec0\u7b11\u610f\u90e8\u52a0\u679c' +
    '\u5411\u7406\u56db\u8001\u8fd0\u98ce\u5fae\u5bb9\u767d\u5374\u897f\u9a6c' +
    '\u53eb\u8ba1\u529e\u8bc1\u53d8\u6bcf\u540d\u5165\u91d1\u754c\u4ef6\u7535' +
    '\u6587\u603b\u54c1\u6708\u6c34\u706b\u624b\u5de5\u65e9\u81f3\u5236\u65cf' +
    '\u793e\u52a8\u6c14\u53d7\u5df1\u76f8\u51e0\u4e07\u8bba\u522b\u529b\u58eb' +
    '\u62a5\u592b\u533a\u57ce\u5f0f\u514b\u5f8c\u8ddf\u57fa\u8d44\u901f\u5ba2' +
    '\u5ea7'
  );
}

function scanSourceFonts(): string[] {
  if (!existsSync(FONTS_SRC_DIR)) {
    console.warn(
      '[font-subset] Source font directory does not exist yet: ' + FONTS_SRC_DIR,
    );
    console.warn(
      '[font-subset] Place .woff2/.ttf font files there to proceed.',
    );
    return [];
  }
  return readdirSync(FONTS_SRC_DIR)
    .filter((f) => /\.(woff2|ttf|otf)$/i.test(f))
    .map((f) => join(FONTS_SRC_DIR, f));
}

function generateFontFaceCSS(
  fontFamily: string,
  subsets: readonly FontSubset[],
  outDirRelativePath: string,
): string {
  const lines: string[] = [];
  for (const subset of subsets) {
    const woff2Name = `${fontFamily.toLowerCase()}-${subset.suffix}.woff2`;
    lines.push('@font-face {');
    lines.push(`  font-family: '${fontFamily}';`);
    lines.push(`  src: url('${outDirRelativePath}/${woff2Name}') format('woff2');`);
    lines.push(`  unicode-range: ${subset.unicodeRange};`);
    lines.push('  font-display: swap;');
    lines.push('}');
    lines.push('');
    // Add CSS variable subset
    lines.push(`@property --${fontFamily}-${subset.suffix}-loaded {`);
    lines.push('  syntax: "<boolean>";');
    lines.push('  inherits: true;');
    lines.push('  initial-value: false;');
    lines.push('}');
    lines.push('');
  }
  return lines.join('\n');
}

function buildSubsetCommand(
  srcPath: string,
  outPath: string,
  subset: FontSubset,
): string {
  const textFile = outPath.replace(/\.woff2$/, `.${subset.suffix}.txt`);
  const writeText = `printf '%s' '${subset.text}' > '${textFile}'`;
  const runSubset = `npx subset-font '${srcPath}' --output-file='${outPath}' --text-file='${textFile}' --flavor=woff2`;
  const cleanup = `rm -f '${textFile}'`;
  return `${writeText} && ${runSubset} && ${cleanup}`;
}

async function main(): Promise<void> {
  console.log('[font-subset] Starting font subsetting...\n');

  if (!existsSync(FONTS_OUT_DIR)) {
    mkdirSync(FONTS_OUT_DIR, { recursive: true });
    console.log(`[font-subset] Created output directory: ${FONTS_OUT_DIR}`);
  }

  const srcFonts = scanSourceFonts();
  if (srcFonts.length === 0) {
    console.log(
      '[font-subset] No source font files found. Skipping actual subsetting.\n' +
      '[font-subset] Generating placeholder CSS template instead.',
    );
  }

  console.log(`[font-subset] Found ${srcFonts.length} source font file(s)`);

  const fontFamily = 'YDSZ Sans';
  const css = generateFontFaceCSS(fontFamily, SUBSETS, '/fonts-subset');
  console.log('\n[font-subset] === Generated @font-face CSS ===');
  console.log(css);

  const cssOutPath = join(FONTS_OUT_DIR, 'font-faces.css');
  const { writeFileSync } = await import('node:fs');
  try {
    writeFileSync(cssOutPath, css, 'utf8');
    console.log(`[font-subset] CSS written to: ${cssOutPath}\n`);
  } catch {
    console.warn(`[font-subset] Could not write CSS file: ${cssOutPath}`);
  }

  if (srcFonts.length === 0) {
    console.log(
      '[font-subset] Placeholder mode complete -- please procure fonts and re-run.',
    );
    console.log(
      '[font-subset] Subset command example (per font):\n' +
      '  pnpm add -D subset-font\n' +
      `  npx subset-font <source.ttf> --text-file=<chars.txt> --output-file=` +
      `${FONTS_OUT_DIR}/YDSZSans-cjk-3500.woff2 --flavor=woff2`,
    );
    return;
  }

  let subsetFontAvailable = false;
  try {
    await import('subset-font');
    subsetFontAvailable = true;
  } catch {
    console.log(
      '\n[font-subset] subset-font not installed; using CLI mode.\n' +
      '[font-subset] Install with: pnpm add -D subset-font',
    );
  }

  for (const src of srcFonts) {
    const baseName =
      src.split(/[/\\]/).pop()?.replace(/\.(ttf|otf|woff2?)$/i, '') ?? 'font';
    console.log(`\n[font-subset] Processing: ${baseName}`);

    for (const subset of SUBSETS) {
      if (subset.text === '' && subset.suffix === 'cjk-ext') {
        console.log(
          `  [${subset.suffix}] Skipping rare-char set (loaded on-demand via runtime subsetting)`,
        );
        continue;
      }
      const outPath = join(FONTS_OUT_DIR, `${baseName}-${subset.suffix}.woff2`);

      if (subsetFontAvailable) {
        try {
          const { default: subsetFont } = await import('subset-font');
          const fs = await import('node:fs');
          const srcBuffer = fs.readFileSync(src);
          const targetText = subset.text;
          if (targetText.length === 0) {
            console.log(`  [${subset.suffix}] Skipping empty-text set`);
            continue;
          }
          const subsetBuffer = await subsetFont(srcBuffer, targetText, {
            flavor: 'woff2',
          });
          fs.writeFileSync(outPath, subsetBuffer);
          const kb = Math.round(subsetBuffer.length / 1024);
          console.log(
            `  [${subset.suffix}] Generated: ${baseName}-${subset.suffix}.woff2 (${kb}KB)`,
          );
        } catch (err) {
          console.error(
            `  [${subset.suffix}] Failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      } else {
        const cmd = buildSubsetCommand(src, outPath, subset);
        console.log(`  [${subset.suffix}] Command: ${cmd}`);
      }
    }
  }

  console.log(`\n[font-subset] Done! Output: ${FONTS_OUT_DIR}`);
}

main().catch((err) => {
  console.error('[font-subset] Execution failed:', err);
  process.exit(1);
});
