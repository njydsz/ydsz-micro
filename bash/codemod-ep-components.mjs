/**
 * EP 退场 codemod —— 组件标签替换 + 入口迁移。
 *
 * 职责边界（机械变换，人工审查后套用）：
 * 1. 标签重命名：`<ElXxx>` → `<YdXxx>`，关闭标签一并处理。
 * 2. 导入来源切换：`from 'element-plus'` → `from '@ydsz-core/ydsz-ui'`。
 * 3. 对无直接 YDSZ 对应的组件（ElDescriptions/ElTableColumn 等），保留原 import、打 FIXME 注释。
 *
 * 不做：属性映射（如 model→form、label-width→等价物）、事件重命名
 * （如 @submit→@finish）—— 这些需按组件族分批人工处理。
 *
 * 用法：
 *   node bash/codemod-ep-components.mjs              # dry-run，仅报告
 *   node bash/codemod-ep-components.mjs --write      # 应用变更
 *   node bash/codemod-ep-components.mjs --write --app=generator-web  # 仅限单个 app
 *
 * @path bash\codemod-ep-components.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const WRITE_MODE = process.argv.includes('--write');
const APP_FILTER = (() => {
  const idx = process.argv.findIndex((a) => a.startsWith('--app='));
  return idx >= 0 ? process.argv[idx].slice('--app='.length) : null;
})();
const ROOT = resolve(process.cwd(), '.');

// ---------------------------------------------------------------------------
// 组件映射表：EP 组件名 → YDSZ 组件名
// ---------------------------------------------------------------------------
const TAG_MAP = new Map([
  // Tier 1：直接 1:1 语义对齐，可全自动
  ['ElInput', 'YdInput'],
  ['ElButton', 'YdButton'],
  ['ElCard', 'YdCard'],
  ['ElEmpty', 'YdEmptyState'],
  ['ElCheckbox', 'YdCheckbox'],
  ['ElSwitch', 'YdSwitch'],
  ['ElTooltip', 'YdTooltip'],
  ['ElDatePicker', 'YdDatePicker'],
  ['ElDescriptions', 'YdDescriptions'],
  ['ElDescriptionsItem', 'YdDescriptionsItem'],
  ['ElDivider', 'YdSeparator'],
  ['ElIcon', 'YdIcon'],
  ['ElProgress', 'YdProgress'],
  ['ElAvatar', 'YdAvatar'],
  ['ElBreadcrumb', 'YdBreadcrumb'],
  ['ElBreadcrumbItem', 'YdBreadcrumbItem'],
  ['ElDropdown', 'YdDropdownMenu'],
  ['ElDropdownMenu', 'YdDropdownMenu'],
  ['ElDropdownItem', 'YdDropdownMenuItem'],
  ['ElImage', 'YdImage'],
  ['ElTimeline', 'YdTimeline'],
  ['ElTimelineItem', 'YdTimelineItem'],
  ['ElSteps', 'YdSteps'],
  ['ElStep', 'YdStep'],
  ['ElSlider', 'YdSlider'],
  ['ElRate', 'YdRate'],
  ['ElCalendar', 'YdCalendar'],
  ['ElText', 'YdText'],
  ['ElTag', 'YdBadge'],
  ['ElBadge', 'YdBadge'],
  ['ElCollapse', 'YdAccordion'],
  ['ElCollapseItem', 'YdAccordionItem'],
  ['ElAlert', 'YdAlertBanner'],
  ['ElDrawer', 'YdSheet'],
  ['ElTransfer', 'YdTransfer'],
  ['ElTree', 'YdTree'],
  ['ElUpload', 'YdUpload'],
  ['ElCascader', 'YdCascader'],
  ['ElColorPicker', 'YdColorPicker'],
  ['ElTimePicker', 'YdTimePicker'],
  ['ElTimeSelect', 'YdTimeSelect'],
  ['ElSkeleton', 'YdSkeleton'],
  ['ElStatistic', 'YdCountToAnimator'],
  ['ElPageHeader', 'YdPageHeader'],
  ['ElCarousel', 'YdCarousel'],
  ['ElCarouselItem', 'YdCarouselItem'],
  ['ElScrollbar', 'YdScrollArea'],
  ['ElAffix', 'YdAffix'],
  ['ElAnchor', 'YdAnchor'],
  ['ElAnchorLink', 'YdAnchorLink'],
  ['ElBacktop', 'YdBackTop'],
  ['ElPopover', 'YdPopover'],
  ['ElPopconfirm', 'YdPopconfirm'],
  ['ElInputNumber', 'YdNumberFieldInput'],
]);

// Tier 2：标签重命名 + import 迁移，但属性需人工补正（需要 wrapper 或 props 兼容）
const TAG_MAP_TIER2 = new Map([
  ['ElForm', 'YdForm'],
  ['ElFormItem', 'YdFormItem'],
  ['ElSelect', 'YdSelect'],
  ['ElOption', 'YdSelectItem'],
  ['ElOptionGroup', 'YdSelectGroup'],
  ['ElTabs', 'YdTabs'],
  ['ElTabPane', 'YdTabsContent'],
  ['ElRadioGroup', 'YdRadioGroup'],
  ['ElRadio', 'YdRadioGroupItem'],
  ['ElRadioButton', 'YdRadioGroupItem'],
  ['ElDialog', 'YdDialog'],
  ['ElDrawer', 'YdDrawer'],
  ['ElTable', 'YdTable'],
  ['ElPagination', 'YdPagination'],
  ['ElRow', 'YdRow'],
  ['ElCol', 'YdCol'],
  ['ElSpace', 'YdSpace'],
  ['ElContainer', 'YdContainer'],
  ['ElHeader', 'YdHeader'],
  ['ElAside', 'YdAside'],
  ['ElMain', 'YdMain'],
  ['ElFooter', 'YdFooter'],
]);

// Tier 3：暂无 YDSZ 直接对应——保留 EP，仅打 FIXME，留在后续 phase 人工处理
const DEFERRED_NAMES = new Set([
  'ElTableColumn',
  'ElMenu',
  'ElMenuItem',
  'ElMenuItemGroup',
  'ElSubMenu',
]);

// 合并全部 map
const ALL_TAG_MAP = new Map([...TAG_MAP, ...TAG_MAP_TIER2]);

// ---------------------------------------------------------------------------
// 扫描目录
// ---------------------------------------------------------------------------
const EXTS = ['.ts', '.mts', '.vue'];
const SKIP = new Set([
  'node_modules', 'dist', '.turbo', 'coverage', 'build',
]);

/** 递归收集待处理文件 */
function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
    } else if (
      EXTS.some((e) => name.endsWith(e)) &&
      !name.endsWith('.d.ts')
    ) {
      out.push(full);
    }
  }
  return out;
}

/** 跳过退场工具自身 + el-bridge 实现 */
function isSelfAugmentation(file) {
  const n = file.replaceAll('\\', '/');
  return n.includes('bash/codemod-ep')
    || n.includes('effects/notification/src/el-bridge.ts')
    || n.includes('effects/notification/src/compat.ts');
}

// ---------------------------------------------------------------------------
// 变换逻辑
// ---------------------------------------------------------------------------

/**
 * 在 YDSZ 无对应组件时追加 FIXME 注释。
 * @param {string} namesRaw 成员原始字符串
 * @param {boolean} vueSfc 是否为 Vue SFC
 * @returns {string} 可能需要补 FIXME 的 import 行
 */
function maybeAddDeferComment(namesRaw, vueSfc) {
  const names = namesRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const defer = names.filter((n) => DEFERRED_NAMES.has(n));
  if (defer.length === 0) return '';
  return ` FIXME: ${defer.join(', ')} 暂无 YDSZ 对应组件，待 Phase 3 人工迁移`;
}

/**
 * 对一个文件执行组件替换变换。
 * @param {string} filePath 绝对路径
 * @returns {Record<string, number>}
 */
function transformFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  let content = original;
  const stats = {
    tagsRenamed: 0,
    importsRewired: 0,
    importsDeferred: 0,
    changed: false,
  };

  // 1) 标签重命名（开标签）
  //    形式：<ElXxx 或 <ElXxx> 或 <ElXxx\n
  for (const [epName, ydszName] of ALL_TAG_MAP.entries()) {
    // 开标签
    const openRe = new RegExp(`<${epName}(?=[\\s>/])`, 'g');
    const openMatches = content.match(openRe);
    if (openMatches) {
      stats.tagsRenamed += openMatches.length;
      content = content.replace(openRe, `<${ydszName}`);
    }
    // 闭标签
    const closeRe = new RegExp(`</${epName}>`, 'g');
    const closeMatches = content.match(closeRe);
    if (closeMatches) {
      stats.tagsRenamed += closeMatches.length;
      content = content.replace(closeRe, `</${ydszName}>`);
    }
  }

  // 2) 导入迁移（from 'element-plus'）
  //    匹配含一个或多个成员的单行导入。
  const EP_IMPORT_RE =
    /import\s*\{([^}]*)\}\s*from\s*(['"])element-plus\2;?/g;

  content = content.replace(EP_IMPORT_RE, (match, namesRaw, quote) => {
    const names = namesRaw.split(',').map((s) => s.trim()).filter(Boolean);

    // 分类：可迁移 vs 需保留
    const migratable = [];
    const deferred = [];
    for (const n of names) {
      if (DEFERRED_NAMES.has(n)) {
        deferred.push(n);
      } else {
        migratable.push(n);
      }
    }

    // 全为 DEFERRED：保留原 import，打 FIXME
    if (migratable.length === 0) {
      stats.importsDeferred += 1;
      const sentinel = ' // FIXME-P3-EP-EXIT';
      return match.endsWith(';') ? `${match.slice(0, -1)}${sentinel};` : `${match}${sentinel}`;
    }

    // 有可迁移成员：切到 YDSZ
    stats.importsRewired += 1;

    // 计算迁移后的新成员名
    const migratedNames = migratable.map((n) => ALL_TAG_MAP.get(n) ?? n);
    let newLine = `import { ${migratedNames.join(', ')} } from ${quote}@ydsz-core/ydsz-ui${quote};`;

    // 若有 MEMBER 保留在 EP：再拼接一条 EP 行
    if (deferred.length > 0) {
      newLine += `\nimport { ${deferred.join(', ')} } from ${quote}element-plus${quote};`;
      stats.importsDeferred += 1;
    }
    return newLine;
  });

  // 3) 迁移 @element-plus/icons-vue（若有）
  const ICON_IMPORT_RE =
    /import\s*\{([^}]*)\}\s*from\s*(['"])@element-plus\/icons-vue\2;?/g;
  content = content.replace(ICON_IMPORT_RE, (match, namesRaw, quote) => {
    // 图标迁移到 @ydsz/icons —— 命名规范兼容 lucide / iconify
    // 作保守处理：保留原 import + 打 FIXME 待批量替换
    stats.importsDeferred += 1;
    return `${match} // FIXME-P3-ICON-EXIT → @ydsz/icons or lucide-vue-next`;
  });

  if (content !== original) {
    stats.changed = true;
    if (WRITE_MODE) {
      writeFileSync(filePath, content, 'utf8');
    }
  }
  return stats;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
const SCAN_DIRS = APP_FILTER ? [`apps/${APP_FILTER}/src`] : ['apps', 'comm', 'main'];
const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d))).filter(
  (f) => !isSelfAugmentation(f),
);

let touched = 0;
let totalTags = 0;
let totalImports = 0;
let totalDeferred = 0;
const touchedFiles = [];

for (const file of files) {
  const r = transformFile(file);
  if (r.changed) {
    touched += 1;
    totalTags += r.tagsRenamed;
    totalImports += r.importsRewired;
    totalDeferred += r.importsDeferred;
    touchedFiles.push({
      path: file.replaceAll('\\', '/'),
      tags: r.tagsRenamed,
      imports: r.importsRewired,
      deferred: r.importsDeferred,
    });
  }
}

console.log(`模式：${WRITE_MODE ? 'WRITE（已应用）' : 'DRY-RUN（加 --write 生效）'}`);
if (APP_FILTER) console.log(`范围：仅 apps/${APP_FILTER}`);
console.log(`扫描文件：${files.length}`);
console.log(`命中文件：${touched}`);
console.log(`标签替换：${totalTags} 处`);
console.log(`导入迁移：${totalImports} 条`);
console.log(`保留原样（FIXME）：${totalDeferred} 条`);

if (!WRITE_MODE && touchedFiles.length > 0) {
  console.log('\n前 40 个待变更文件：');
  for (const entry of touchedFiles.slice(0, 40)) {
    console.log(`  ${entry.path}  (tag:${entry.tags}, import:${entry.imports}, defer:${entry.deferred})`);
  }
  if (touchedFiles.length > 40) {
    console.log(`  ... 另有 ${touchedFiles.length - 40} 个文件`);
  }
}
