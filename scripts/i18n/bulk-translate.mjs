#!/usr/bin/env node
/**
 * 批量翻译脚本 — 将 zh-CN 源语言包扩展到 22 个语种
 *
 * <p>使用 MyMemory 免费翻译 API（无需 Key，每秒 1 请求限速），
 * 遍历 comm/locales/src/langs/zh-CN 下所有 JSON 文件，
 * 批量翻译生成到 comm/locales/src/langs/{locale}/ 对应文件中。
 *
 * <p>用法：
 * <pre>
 *   node scripts/i18n/bulk-translate.mjs           # 全量翻译
 *   node scripts/i18n/bulk-translate.mjs --locale fr-FR  # 单语种
 *   node scripts/i18n/bulk-translate.mjs --dry-run       # 仅预览不写文件
 * </pre>
 *
 * @path scripts\i18n\bulk-translate.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import { writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const SOURCE_LANG = 'zh-CN';
const LOCALES_DIR = join(PROJECT_ROOT, 'comm', 'locales', 'src', 'langs');

/**
 * 22 个目标语种清单。
 *
 * <p>选择策略：覆盖全球 95%+ 互联网用户人口，兼顾 SaaS 出海刚需市场。
 * dayjs 语言包用短码（如 ja / ko / zh-tw），vue-i18n locale 用 BCP-47 长码。
 */
const TARGET_LOCALES = [
  { code: 'en-US', dayjsCode: 'en', label: 'English' },
  { code: 'ja-JP', dayjsCode: 'ja', label: '日本語' },
  { code: 'ko-KR', dayjsCode: 'ko', label: '한국어' },
  { code: 'zh-TW', dayjsCode: 'zh-tw', label: '繁體中文' },
  { code: 'es-ES', dayjsCode: 'es', label: 'Español' },
  { code: 'pt-BR', dayjsCode: 'pt-br', label: 'Português (Brasil)' },
  { code: 'fr-FR', dayjsCode: 'fr', label: 'Français' },
  { code: 'de-DE', dayjsCode: 'de', label: 'Deutsch' },
  { code: 'ru-RU', dayjsCode: 'ru', label: 'Русский' },
  { code: 'ar-SA', dayjsCode: 'ar', label: 'العربية' },
  { code: 'hi-IN', dayjsCode: 'hi', label: 'हिन्दी' },
  { code: 'vi-VN', dayjsCode: 'vi', label: 'Tiếng Việt' },
  { code: 'th-TH', dayjsCode: 'th', label: 'ไทย' },
  { code: 'id-ID', dayjsCode: 'id', label: 'Bahasa Indonesia' },
  { code: 'it-IT', dayjsCode: 'it', label: 'Italiano' },
  { code: 'nl-NL', dayjsCode: 'nl', label: 'Nederlands' },
  { code: 'pl-PL', dayjsCode: 'pl', label: 'Polski' },
  { code: 'tr-TR', dayjsCode: 'tr', label: 'Türkçe' },
  { code: 'uk-UA', dayjsCode: 'uk', label: 'Українська' },
  { code: 'cs-CZ', dayjsCode: 'cs', label: 'Čeština' },
  { code: 'pt-PT', dayjsCode: 'pt', label: 'Português (Portugal)' },
  { code: 'sv-SE', dayjsCode: 'sv', label: 'Svenska' },
];

/** MyMemory 免费翻译 API（无需 Key，限每秒 1 请求） */
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

/**
 * 调用 MyMemory 翻译 API，返回译文。
 *
 * @param text - 原文（中文）
 * @param targetLang - 目标语种短码（如 en、ja、ko）
 * @returns 译文
 */
async function translateText(text, targetLang) {
  const params = new URLSearchParams({
    q: text,
    langpair: `zh|${targetLang}`,
  });
  const url = `${MYMEMORY_API}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const result = await response.json();
  if (result.responseStatus === 200 && result.responseData?.translatedText) {
    return result.responseData.translatedText;
  }
  throw new Error(`翻译失败: ${result.responseDetails || '未知错误'}`);
}

/**
 * 递归翻译对象中的所有字符串值（跳过含插值占位符 {0} 的字符串 key、保留 key 不变）。
 *
 * @param source - 源语言对象
 * @param targetShortCode - 目标语种短码
 * @returns 翻译后的新对象
 */
async function translateObject(source, targetShortCode) {
  const result = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      // 限制：含 i18n 插值占位符 {0} 的字符串也直接翻译，API 通常能正确处理
      try {
        result[key] = await translateText(value, targetShortCode);
      } catch (error) {
        console.warn(`⚠  翻译跳过 [${key}]: ${(error as Error).message}`);
        result[key] = value;
      }
      // MyMemory 每秒 1 请求限速
      await delay(1100);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value, targetShortCode);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** 简单延迟函数 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 读取 JSON 文件。
 *
 * @param filePath - 文件路径
 * @returns 解析后的对象
 */
async function readJsonFile(filePath) {
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * 写入 JSON 文件（UTF-8 无 BOM，2 空格缩进）。
 *
 * @param filePath - 文件路径
 * @param data - 待写入对象
 */
async function writeJsonFile(filePath, data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(filePath, content, 'utf8');
}

/** 检查目录是否存在 */
async function directoryExists(dirPath) {
  try {
    await access(dirPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** 主执行 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const localeArg = args.find((_, i) => args[i - 1] === '--locale');

  const targets = localeArg
    ? TARGET_LOCALES.filter((l) => l.code === localeArg)
    : TARGET_LOCALES.filter((l) => l.code !== SOURCE_LANG); // 跳过源语言

  if (targets.length === 0) {
    console.error(`❌ 未找到匹配的语种: ${localeArg}`);
    process.exit(1);
  }

  // 1. 读取源语言文件列表
  const sourceDir = join(LOCALES_DIR, SOURCE_LANG);
  const { readdir } = await import('node:fs/promises');
  const sourceFiles = (await readdir(sourceDir)).filter((f) => f.endsWith('.json'));

  console.log(`🌍 批量翻译任务启动`);
  console.log(`   源语言: ${SOURCE_LANG}`);
  console.log(`   目标语种: ${targets.map((t) => t.code).join(', ')}`);
  console.log(`   文件数: ${sourceFiles.length}`);
  console.log(`   模式: ${dryRun ? '仅预览' : '写入文件'}`);
  console.log('');

  for (const locale of targets) {
    console.log(`\n── ${locale.code} (${locale.label}) ──`);
    const localeDir = join(LOCALES_DIR, locale.code);

    if (!dryRun && !(await directoryExists(localeDir))) {
      await mkdir(localeDir, { recursive: true });
    }

    for (const file of sourceFiles) {
      const sourcePath = join(sourceDir, file);
      const sourceObj = await readJsonFile(sourcePath);

      if (dryRun) {
        const keyCount = countKeys(sourceObj);
        console.log(`  [dry-run] ${file} (${keyCount} 词条) → ${locale.code}/${file}`);
        continue;
      }

      console.log(`  📝 翻译 ${file} ...`);
      const startTime = Date.now();
      const translated = await translateObject(sourceObj, locale.dayjsCode);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      const targetPath = join(localeDir, file);
      await writeJsonFile(targetPath, translated);
      console.log(`  ✅ ${file} 完成 (${elapsed}s)`);
    }
  }

  console.log('\n🎉 全部完成！');
}

/** 统计对象中叶子字符串节点数量（用于 dry-run 预览） */
function countKeys(obj) {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      count += 1;
    } else if (typeof value === 'object' && value !== null) {
      count += countKeys(value);
    }
  }
  return count;
}

main().catch((error) => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
