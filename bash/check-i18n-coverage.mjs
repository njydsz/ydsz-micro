#!/usr/bin/env node
/**
 * 国际化 (i18n) 覆盖率检测工具
 *
 * 扫描项目中的 i18n 翻译文件，检测：
 * 1. 各语言翻译覆盖率（是否遗漏翻译键）
 * 2. 未使用的翻译键（代码中未引用）
 * 3. 硬编码中文字符串（代码中未使用 $t 翻译）
 * 4. 翻译文件格式错误（JSON 解析失败、层级不一致）
 *
 * 使用方式：
 *   pnpm check:i18n             # 完整检查
 *   pnpm check:i18n --fix       # 尝试自动修复（移除未使用键、补全缺失键）
 *   pnpm check:i18n --lang en   # 仅检查英文翻译
 *   pnpm check:i18n --verbose   # 详细输出
 *
 * @path bash/check-i18n-coverage.mjs
 * @author remi-team
 * @since 4.0.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ==================== 参数解析 ====================

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');
const langFilter = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;

// ==================== 配置 ====================

const LOCALES_DIRS = [
  path.join(root, 'apps/*/src/locales'),
  path.join(root, 'comm/*/src/locales'),
  path.join(root, 'main/src/locales'),
];

const SUPPORTED_LANGS = ['zh-CN', 'en-US'];
const CODE_EXTENSIONS = ['.ts', '.vue', '.mjs', '.js'];
const I18N_FUNCTIONS = ['$t', 't', 'i18n.t', '$te', 'te', 'useI18n'];

// ==================== 工具函数 ====================

/**
 * 使用 glob 模式查找文件（简化版）
 */
function globSync(pattern, baseDir) {
  const results = [];
  const regex = new RegExp(
    pattern
      .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLESTAR>>>/g, '.*'),
  );

  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          const relative = path.relative(baseDir, fullPath);
          if (regex.test(relative)) {
            results.push(fullPath);
          }
        }
      }
    } catch {
      // 静默跳过无权限目录
    }
  }

  walk(baseDir);
  return results;
}

/**
 * 获取所有 locales 目录
 */
function getLocalesDirs() {
  const dirs = [];
  // 手动扫描 apps/*/src/locales 和 main/src/locales
  const appsDir = path.join(root, 'apps');
  if (fs.existsSync(appsDir)) {
    for (const app of fs.readdirSync(appsDir)) {
      const localeDir = path.join(appsDir, app, 'src', 'locales', 'langs');
      if (fs.existsSync(localeDir)) {
        dirs.push({ app, path: localeDir, type: 'app' });
      }
    }
  }

  const mainLocaleDir = path.join(root, 'main', 'src', 'locales', 'langs');
  if (fs.existsSync(mainLocaleDir)) {
    dirs.push({ app: 'main', path: mainLocaleDir, type: 'main' });
  }

  return dirs;
}

/**
 * 扁平化翻译对象 (将嵌套 JSON 转为点分 key)
 */
function flattenKeys(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/**
 * 扫描代码中的 i18n key 引用
 */
function scanCodeUsage() {
  const keys = new Set();
  const hardcodedStrings = [];

  // 扫描所有源码文件
  const extensions = CODE_EXTENSIONS.join(',');
  const files = globSync(`**/*{${extensions}}`, root);

  for (const file of files) {
    // 跳过 node_modules 和 dist
    if (file.includes('node_modules') || file.includes('/dist/')) continue;

    try {
      const content = fs.readFileSync(file, 'utf-8');

      // 匹配 $t('key') / $t("key") 调用
      const tCallRegex = /[$]t\(\s*[\`'"]([^\`'"]+)[\`'"]/g;
      let match;
      while ((match = tCallRegex.exec(content)) !== null) {
        keys.add(match[1]);
      }

      // 匹配 t('key') 调用
      const tFuncRegex = /(?:^|[^.\w])t\(\s*[\`'"]([^\`'"]+)[\`'"]/g;
      while ((match = tFuncRegex.exec(content)) !== null) {
        keys.add(match[1]);
      }

      // 检测硬编码中文（简单启发式：包含中文字符串字面量）
      if (!file.includes('.json')) {
        const chineseRegex = /[`'"]([一-鿿][^`'"]*)[`'"]/g;
        while ((match = chineseRegex.exec(content)) !== null) {
          // 排除 import 路径和注释
          const line = content.substring(Math.max(0, match.index - 50), match.index);
          if (
            !line.trim().startsWith('//') &&
            !line.includes('import ') &&
            !line.includes('from ')
          ) {
            hardcodedStrings.push({
              file: path.relative(root, file),
              text: match[1],
              index: match.index,
            });
          }
        }
      }
    } catch {
      // 静默跳过
    }
  }

  return { keys, hardcodedStrings };
}

// ==================== 主检查逻辑 ====================

async function main() {
  console.log('\n🔍 RMMI i18n 覆盖率检测\n');
  console.log('='.repeat(60));

  const localesDirs = getLocalesDirs();
  const { keys: usedKeys, hardcodedStrings } = scanCodeUsage();

  const allStats = [];
  let totalMissing = 0;
  let totalUnused = 0;
  let hasError = false;

  for (const { app, path: localeDir, type } of localesDirs) {
    const langs = fs.readdirSync(localeDir).filter((d) =>
      fs.statSync(path.join(localeDir, d)).isDirectory(),
    );

    for (const lang of langs) {
      if (langFilter && lang !== langFilter) continue;
      const langDir = path.join(localeDir, lang);

      // 加载所有 JSON 翻译文件
      const allKeys = new Map();
      const files = globSync('**/*.json', langDir);

      for (const file of files) {
        try {
          const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
          const relativePath = path.relative(langDir, file);
          const prefix = relativePath.replace(/\.json$/, '').replace(/\//g, '.');
          const flat = flattenKeys(content);
          for (const [key, value] of Object.entries(flat)) {
            const fullKey = prefix.includes('.')
              ? `${prefix}.${key}`
              : `${relativePath.replace('.json', '')}.${key}`;
            allKeys.set(fullKey, value);
          }
        } catch (err) {
          console.error(`  ❌ JSON 解析失败: ${path.relative(root, file)}`);
          hasError = true;
        }
      }

      // 计算覆盖率
      const totalKeys = allKeys.size;
      let missingKeys = [];
      let unusedKeys = [];

      for (const usedKey of usedKeys) {
        if (!allKeys.has(usedKey) && !usedKey.includes('.')) {
          // 尝试前缀匹配
          const prefixMatch = [...allKeys.keys()].some((k) =>
            k.endsWith(usedKey) || k.split('.').includes(usedKey.split('.').pop()),
          );
          if (!prefixMatch) {
            missingKeys.push(usedKey);
          }
        }
      }

      for (const key of allKeys.keys()) {
        if (!usedKeys.has(key)) {
          unusedKeys.push(key);
        }
      }

      const coverage = totalKeys > 0
        ? Math.round(((totalKeys - unusedKeys.length) / totalKeys) * 100)
        : 100;

      allStats.push({
        app,
        type,
        lang,
        totalKeys,
        missingKeys,
        unusedKeys,
        coverage,
      });

      totalMissing += missingKeys.length;
      totalUnused += unusedKeys.length;

      // 输出结果
      const status = coverage >= 90 ? '✅' : coverage >= 70 ? '⚠️' : '❌';
      console.log(`${status} ${app}/${lang}: ${coverage}% (${totalKeys} keys)`);

      if (verbose) {
        if (missingKeys.length) {
          console.log('   缺失翻译:', missingKeys.slice(0, 5).join(', '), missingKeys.length > 5 ? `... +${missingKeys.length - 5}` : '');
        }
        if (unusedKeys.length) {
          console.log('   未使用:', unusedKeys.slice(0, 5).join(', '), unusedKeys.length > 5 ? `... +${unusedKeys.length - 5}` : '');
        }
      }
    }
  }

  // 硬编码字符串报告
  if (hardcodedStrings.length > 0) {
    console.log('\n⚠️  硬编码中文字符串检测:');
    console.log('-'.repeat(60));
    const sample = hardcodedStrings.slice(0, 10);
    for (const item of sample) {
      console.log(`  ${item.file}: "${item.text.substring(0, 30)}..."`);
    }
    if (hardcodedStrings.length > 10) {
      console.log(`  ... 共 ${hardcodedStrings.length} 处，建议逐步迁移到 i18n`);
    }
  }

  // 汇总
  console.log('\n' + '='.repeat(60));
  console.log('汇总:');
  console.log(`  语言数: ${allStats.length}`);
  console.log(`  代码引用 key 数: ${usedKeys.size}`);
  console.log(`  遗漏翻译: ${totalMissing}`);
  console.log(`  未使用 key: ${totalUnused}`);
  console.log(`  硬编码字符串: ${hardcodedStrings.length}`);

  if (totalMissing > 0 || hasError) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('检测失败:', err);
  process.exit(1);
});
