/**
 * codemod-ep-to-ydsz.mts — 将 Element Plus 用法迁移到 ydsz-ui（EP 已退场 v5.0.0）。
 *
 * @path bash/codemod-ep-to-ydsz.mts
 * @author ydsz-team
 * @since 26.11.06
 *
 * 迁移策略（安全优先，纯正则文本改写，不破坏未匹配代码）：
 * 1. **import 迁移**：`import { ElXxx } from 'element-plus'` → `import { YdXxx } from '@ydsz-core/ydsz-ui'`；
 * 2. **组件标签迁移**：`<el-xxx>` / `<ElXxx>` → `<yd-xxx>` / `<YdXxx>`（kebab/Pascal 双形态）；
 * 3. **图标迁移**：`@element-plus/icons-vue` → `lucide-vue-next`（常见图标映射表）；
 * 4. **命令式 API 迁移**：`ElMessage`/`ElMessageBox`/`ElNotification` → popup-ui 对应 API；
 * 5. **props 重命名**：常见 EP → ydsz-ui 的 prop 映射（如 `v-model` 保持，`size="sm"` → `size="sm"`）；
 * 6. **豁免**：ydsz-ui 自身、Node 工具、测试、已退场的注释块。
 *
 * 幂等：重复运行不会产生重复替换。
 *
 * @usage
 *   node bash/codemod-ep-to-ydsz.mts [rootDir]
 *
 * 注意：本脚本为**启发式迁移**，迁移后必须人工复核 + 跑 lint/type-check。
 * 复杂场景（ElTable 列配置、ElForm 校验规则、ElTree 数据契约）建议参考
 * docs/reports/ydsz-ui-vs-competitors-gap-analysis-2026-10-30.md。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] ?? process.cwd();

/** 豁免文件模式 */
const EXEMPT = [
  /@core\/ui-kit\/ydsz-ui\//,
  /@core\/ui-kit\/ydsz-vue\//,
  /\/__tests__\//,
  /\.spec\.ts$/,
  /\.test\.ts$/,
  /\/tests\//,
  /^bash[\\/]/,
  /^conf[\\/]/,
  /\.d\.ts$/,
  /node_modules/,
  /dist/,
];

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.turbo',
  '.cache',
]);

/** EP 组件 → ydsz-ui 组件映射（PascalCase） */
const COMPONENT_MAP = {
  ElAlert: 'YdAlert',
  ElAutoComplete: 'YdAutoComplete',
  ElAvatar: 'YdAvatar',
  ElBadge: 'YdBadge',
  ElBreadcrumb: 'YdBreadcrumb',
  ElButton: 'YdButton',
  ElButtonGroup: 'YdButtonGroup',
  ElCalendar: 'YdCalendar',
  ElCard: 'YdCard',
  ElCarousel: 'YdCarousel',
  ElCascader: 'YdCascader',
  ElCheckbox: 'YdCheckbox',
  ElCheckboxGroup: 'YdCheckboxGroup',
  ElCollapse: 'YdCollapse',
  ElColorPicker: 'YdColorPicker',
  ElDatePicker: 'YdDatePicker',
  ElDescriptions: 'YdDescriptions',
  ElDialog: 'YdDialog',
  ElDivider: 'YdDivider',
  ElDrawer: 'YdDrawer',
  ElDropdown: 'YdDropdownMenu',
  ElEmpty: 'YdEmpty',
  ElForm: 'YdForm',
  ElFormItem: 'YdFormItem',
  ElIcon: 'YdIcon',
  ElImage: 'YdImage',
  ElInput: 'YdInput',
  ElInputNumber: 'YdInputNumber',
  ElLink: 'YdLink',
  ElMenu: 'YdMenu',
  ElMenuItem: 'YdMenuItem',
  ElPagination: 'YdPagination',
  ElPopconfirm: 'YdPopconfirm',
  ElPopover: 'YdPopover',
  ElProgress: 'YdProgress',
  ElRadio: 'YdRadio',
  ElRadioButton: 'YdRadioGroup',
  ElRadioGroup: 'YdRadioGroup',
  ElRate: 'YdRate',
  ElResult: 'YdResult',
  ElRow: 'YdRow',
  ElCol: 'YdCol',
  ElScrollbar: 'YdScrollArea',
  ElSelect: 'YdSelect',
  ElOption: 'YdOption',
  ElSkeleton: 'YdSkeleton',
  ElSlider: 'YdSlider',
  ElSpace: 'YdSpace',
  ElSteps: 'YdSteps',
  ElStep: 'YdStep',
  ElSwitch: 'YdSwitch',
  ElTable: 'YdTable',
  ElTableColumn: 'YdTableColumn',
  ElTabPane: 'YdTabPane',
  ElTabs: 'YdTabs',
  ElTag: 'YdTag',
  ElTextarea: 'YdTextarea',
  ElTimePicker: 'YdTimePicker',
  ElTimeline: 'YdTimeline',
  ElTimelineItem: 'YdTimelineItem',
  ElTooltip: 'YdTooltip',
  ElTransfer: 'YdTransfer',
  ElTree: 'YdTree',
  ElTreeSelect: 'YdTreeSelect',
  ElUpload: 'YdUpload',
};

/** EP 图标 → lucide 映射（@element-plus/icons-vue → lucide-vue-next） */
const ICON_MAP = {
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  Check: 'Check',
  CircleCheck: 'CircleCheck',
  CircleClose: 'CircleX',
  CirclePlus: 'CirclePlus',
  Close: 'X',
  Delete: 'Trash2',
  Download: 'Download',
  Edit: 'Pencil',
  Loading: 'Loader2',
  MoreFilled: 'MoreHorizontal',
  Plus: 'Plus',
  QuestionFilled: 'CircleHelp',
  Refresh: 'RefreshCw',
  Remove: 'Minus',
  Search: 'Search',
  Setting: 'Settings',
  Upload: 'Upload',
  User: 'User',
  WarningFilled: 'TriangleAlert',
  ZoomIn: 'ZoomIn',
  ZoomOut: 'ZoomOut',
};

/** EP 命令式 API → popup-ui 映射 */
const API_MAP = {
  ElMessage: 'showNotification',
  ElMessageBox: 'showMessageBox',
  ElNotification: 'showNotification',
  ElLoading: 'useLoadingBar',
};

/** EP → ydsz-ui 的 size 值映射 */
const SIZE_MAP: Record<string, string> = {
  large: 'lg',
  medium: 'md',
  small: 'sm',
  mini: 'xs',
};

/**
 * 需要 size 值归一化的 EP 组件集合。
 *
 * <p>仅对这些 EP 组件标签内的 size 做归一化，避免误改 ydsz-ui 组件。
 */
const SIZE_MIGRATE_TAGS = new Set([
  'el-button',
  'el-input',
  'el-select',
  'el-radio',
  'el-checkbox',
  'el-form',
  'el-table',
  'el-pagination',
]);

/** 常见 prop 重命名（EP → ydsz-ui） */
const PROP_MAP: Record<string, string> = {
  'prefix-icon': 'prefixIcon',
  'suffix-icon': 'suffixIcon',
  'popper-class': 'popoverClass',
  'popper-options': 'popoverOptions',
  'visible-arrow': 'showArrow',
  'label-position': 'labelPosition',
  'label-width': 'labelWidth',
  'show-message': 'showMessage',
  'inline-message': 'inlineMessage',
  'validate-event': 'validateEvent',
};

/**
 * 需要 prop 重命名的 EP 组件集合。
 *
 * <p>仅对这些 EP 组件标签内的 prop 做 kebab → camel 重命名，
 * 避免误改 ydsz-ui 组件（其 props 约定为 kebab-case）。
 */
const PROP_MIGRATE_TAGS = new Set([
  'el-form',
  'el-input',
  'el-select',
  'el-tooltip',
  'el-popover',
  'el-checkbox',
  'el-radio',
]);

const isExempt = (p) => EXEMPT.some((re) => re.test(p.split('\\').join('/')));

const changed = [];

/**
 * PascalCase → kebab-case。
 *
 * @param name PascalCase 名称
 * @returns kebab-case 名称
 */
function toKebab(name) {
  return name
    .replace(/([A-Z])/g, '-$1')
    .replace(/^-/, '')
    .toLowerCase();
}

/**
 * kebab-case → PascalCase。
 *
 * @param name kebab-case 名称
 * @returns PascalCase 名称
 */
function toPascal(name) {
  return name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/**
 * 迁移 import 语句。
 *
 * @param text 源码文本
 * @returns 迁移后的文本
 */
function migrateImports(text) {
  let result = text;

  // 1. 组件 import：import { ElXxx, ElYyy } from 'element-plus';
  result = result.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]element-plus['"];?/g,
    (match, names) => {
      const migrated = names
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => {
          const pascal = n.replace(/^El/, 'El');
          const ydsz = COMPONENT_MAP[pascal] ?? COMPONENT_MAP[toPascal(n)] ?? n;
          return ydsz;
        });
      // 仅当全部组件都已映射时才迁移
      if (migrated.every((n) => COMPONENT_MAP[n] || n.startsWith('Yd'))) {
        return `import { ${migrated.join(', ')} } from '@ydsz-core/ydsz-ui';`;
      }
      return match;
    },
  );

  // 2. 图标 import：import { Xxx } from 'lucide-vue-next';
  result = result.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]@element-plus\/icons-vue['"];?/g,
    (match, names) => {
      const migrated = names
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => ICON_MAP[n] ?? n);
      return `import { ${migrated.join(', ')} } from 'lucide-vue-next';`;
    },
  );

  // 3. 命令式 API：import { showNotification } from '@ydsz-core/popup-ui';
  result = result.replace(
    /import\s*\{([^}]+)\}\s*from\s*['"]element-plus['"];?/g,
    (match, names) => {
      const apis = names
        .split(',')
        .map((n) => n.trim())
        .filter((n) => API_MAP[n]);
      if (apis.length === 0) return match;
      const mapped = apis.map((n) => API_MAP[n]);
      return `import { ${mapped.join(', ')} } from '@ydsz-core/popup-ui';`;
    },
  );

  return result;
}

/**
 * 迁移组件标签。
 *
 * @param text 源码文本
 * @returns 迁移后的文本
 */
function migrateTags(text) {
  let result = text;

  // <ElXxx> → <YdXxx>（PascalCase）
  result = result.replace(/<\/?El([A-Z][A-Za-z0-9]*)/g, (match, suffix) => {
    const ydsz = COMPONENT_MAP[`El${suffix}`];
    if (!ydsz) return match;
    return match.replace(`El${suffix}`, ydsz);
  });

  // <el-xxx> → <yd-xxx>（kebab-case）
  result = result.replace(/<\/?el-([a-z][a-z0-9-]*)/g, (match, kebab) => {
    const pascal = toPascal(kebab);
    const ydsz = COMPONENT_MAP[`El${pascal}`];
    if (!ydsz) return match;
    const ydszKebab = toKebab(ydsz);
    return match.replace(`el-${kebab}`, ydszKebab);
  });

  // 自闭合与结束标签的 />
  result = result.replace(/<\/El([A-Z][A-Za-z0-9]*)\s*>/g, (match, suffix) => {
    const ydsz = COMPONENT_MAP[`El${suffix}`];
    if (!ydsz) return match;
    return match.replace(`El${suffix}`, ydsz);
  });

  return result;
}

/**
 * 迁移命令式 API 调用。
 *
 * @param text 源码文本
 * @returns 迁移后的文本
 */
function migrateApiCalls(text) {
  let result = text;

  // showNotification.success(...) → showNotification.success(...)（简化：保留方法名）
  result = result.replace(
    /\bElMessage\.(\w+)\s*\(/g,
    (_match, method) => `showNotification.${method}(`,
  );
  result = result.replace(/\bElMessage\s*\(/g, 'showNotification(');

  // showMessageBox.confirm(...) → showMessageBox.confirm(...)
  result = result.replace(
    /\bElMessageBox\.(\w+)\s*\(/g,
    (_match, method) => `showMessageBox.${method}(`,
  );

  // showNotification.success(...) → showNotification.success(...)
  result = result.replace(
    /\bElNotification\.(\w+)\s*\(/g,
    (_match, method) => `showNotification.${method}(`,
  );

  return result;
}

/**
 * 迁移 size 属性值。
 *
 * <p>仅对确认的 EP 组件标签生效，避免误改 ydsz-ui 组件。
 *
 * @param text 源码文本
 * @returns 迁移后的文本
 */
function migrateSize(text) {
  let result = text;
  for (const tag of SIZE_MIGRATE_TAGS) {
    const tagRe = new RegExp(`<${tag}\\b[^>]*>`, 'g');
    result = result.replace(tagRe, (match) => {
      let migrated = match;
      for (const [ep, ydsz] of Object.entries(SIZE_MAP)) {
        migrated = migrated.replace(new RegExp(`size=["']${ep}["']`, 'g'), `size="${ydsz}"`);
      }
      return migrated;
    });
  }
  return result;
}

/**
 * 迁移 prop 命名（kebab → camel 等）。
 *
 * <p>仅对确认的 EP 组件标签生效，避免误改 ydsz-ui 组件 props
 * （ydsz-ui 的 props 约定为 kebab-case）。
 *
 * @param text 源码文本
 * @returns 迁移后的文本
 */
function migrateProps(text) {
  let result = text;
  for (const tag of PROP_MIGRATE_TAGS) {
    const tagRe = new RegExp(`<${tag}\\b[^>]*>`, 'g');
    result = result.replace(tagRe, (match) => {
      let migrated = match;
      for (const [ep, ydsz] of Object.entries(PROP_MAP)) {
        migrated = migrated.replace(new RegExp(`\\b${ep}\\b`, 'g'), ydsz);
      }
      return migrated;
    });
  }
  return result;
}

/**
 * 处理单个文件。
 *
 * @param file 文件绝对路径
 */
function processFile(file) {
  if (isExempt(file)) return;
  let text;
  try {
    text = readFileSync(file, 'utf-8');
  } catch {
    return;
  }

  // 无 EP 痕迹则跳过
  if (!/element-plus|El[A-Z]|el-[a-z]/.test(text)) return;

  let result = text;
  result = migrateImports(result);
  result = migrateTags(result);
  result = migrateApiCalls(result);
  result = migrateSize(result);
  result = migrateProps(result);

  if (result !== text) {
    writeFileSync(file, result, 'utf-8');
    changed.push(file);
  }
}

/**
 * 递归遍历目录。
 *
 * @param dir 当前目录
 * @param depth 递归深度
 */
function walk(dir, depth) {
  if (depth > 10) return;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue;
    const full = join(dir, e);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, depth + 1);
    else if (/\.(ts|mts|cts|vue)$/.test(e) && !/\.d\.ts$/.test(e)) processFile(full);
  }
}

walk(ROOT, 0);
console.log(`codemod-ep-to-ydsz: 迁移 ${changed.length} 个文件`);
for (const f of changed) console.log(`  ${f.split('\\').join('/')}`);
