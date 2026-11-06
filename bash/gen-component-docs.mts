/**
 * 组件 API 文档自动生成器。
 *
 * <p>扫描 ydsz-ui 组件目录，从 SFC 源码中提取 Props/Emits/Slots/Expose
 * 类型定义，生成 Markdown API 参考文档到 apps/docs-site/ui-kit/ydsz-ui/api/ 目录。
 *
 * <p>使用 vue-component-meta 解析 SFC 类型，支持泛型 defineProps/defineEmits。
 *
 * @path bash\gen-component-docs.mts
 * @author ydsz-team
 * @since 1.0.0
 */

import { readdir, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';

// ===== 类型定义 =====

interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

interface EmitInfo {
  name: string;
  type: string;
  description: string;
}

interface SlotInfo {
  name: string;
  props: string;
  description: string;
}

interface ExposeInfo {
  name: string;
  type: string;
  description: string;
}

interface ComponentApi {
  name: string;
  description: string;
  props: PropInfo[];
  emits: EmitInfo[];
  slots: SlotInfo[];
  expose: ExposeInfo[];
  filePath: string;
}

// ===== 配置 =====

const UI_SRC = join(process.cwd(), 'comm/@core/ui-kit/ydsz-ui/src/components');
const OUTPUT_DIR = join(process.cwd(), 'apps/docs-site/ui-kit/ydsz-ui/api');

// 跳过测试/story/类型文件
const SKIP_PATTERNS = ['.test.', '.stories.', '.story.', '-types.ts', 'types.ts', 'index.ts'];

// ===== 工具函数 =====

/**
 * 递归读取目录下所有 .vue 文件。
 */
async function scanVueFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await scanVueFiles(fullPath)));
    } else if (entry.name.endsWith('.vue') && !SKIP_PATTERNS.some((p) => entry.name.includes(p))) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * 从 SFC 源码中提取 script setup 块内的类型定义。
 * 简单解析，不依赖完整 AST。
 */
async function extractComponentApi(filePath: string): Promise<ComponentApi | null> {
  const content = await readFile(filePath, 'utf-8');

  // 提取 script setup 块
  const scriptMatch = content.match(/<script[^>]*setup[^>]*>([\s\S]*?)<\/script>/);
  if (!scriptMatch) return null;

  const script = scriptMatch[1];

  // 提取 defineProps 泛型参数
  const propsMatch = script.match(/defineProps(?:<([^>]+)>)?\s*\(/);
  const props = propsMatch ? parsePropsFromType(propsMatch[1] || '', script) : [];

  // 提取 defineEmits 泛型参数
  const emitsMatch = script.match(/defineEmits(?:<([^>]+)>)?\s*\(/);
  const emits = emitsMatch ? parseEmitsFromType(emitsMatch[1] || '', script) : [];

  // 提取 defineSlots
  const slotsMatch = script.match(/defineSlots(?:<([^>]+)>)?\s*\(/);
  const slots = slotsMatch ? parseSlotsFromType(slotsMatch[1] || '') : [];

  // 提取 defineExpose
  const exposeMatch = script.match(/defineExpose\s*\(\{([\s\S]*?)\}\)/);
  const expose = exposeMatch ? parseExpose(exposeMatch[1]) : [];

  // 从文件头部注释提取描述
  const commentMatch = content.match(/<!--([\s\S]*?)-->/);
  const description = commentMatch
    ? commentMatch[1]
        .split('\n')
        .map((l) => l.replace(/^\s*\*\s?/, '').trim())
        .filter((l) => l && !l.startsWith('@'))
        .slice(0, 2)
        .join(' ')
    : '';

  // 组件名从文件名提取
  const componentName = basename(filePath, '.vue');

  return {
    name: componentName,
    description,
    props,
    emits,
    slots,
    expose,
    filePath,
  };
}

/**
 * 从 TypeScript 类型字符串中解析 Props。
 */
function parsePropsFromType(typeStr: string, script: string): PropInfo[] {
  if (!typeStr) return [];

  const props: PropInfo[] = [];
  // 匹配接口定义中的属性
  const lines = typeStr.split('\n');
  let currentProp: PropInfo | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // 匹配 JSDoc 注释
    const jsdocMatch = trimmed.match(/\/\*\*\s*(.+?)\s*\*\//);
    if (jsdocMatch && !currentProp) {
      currentProp = {
        name: '',
        type: '',
        required: false,
        description: jsdocMatch[1].replace(/\*\/$/, ''),
      };
      continue;
    }

    // 匹配属性定义
    const propMatch = trimmed.match(/^(\w+)(\?)?:\s*(.+?);?$/);
    if (propMatch) {
      const [, name, optional, type] = propMatch;
      props.push({
        name,
        type: type.trim(),
        required: !optional,
        description: currentProp?.description || '',
        defaultValue: extractDefaultValue(name, script),
      });
      currentProp = null;
    }
  }

  return props;
}

/**
 * 从脚本中提取默认值。
 */
function extractDefaultValue(propName: string, script: string): string | undefined {
  const withDefaultsMatch = script.match(
    /withDefaults\s*\(\s*defineProps[^)]*,\s*\{([\s\S]*?)\}\s*\)/,
  );
  if (!withDefaultsMatch) return undefined;

  const defaults = withDefaultsMatch[1];
  const propMatch = defaults.match(new RegExp(`\\b${propName}\\s*:\\s*([^,}]+)`));
  return propMatch ? propMatch[1].trim() : undefined;
}

/**
 * 从 TypeScript 类型字符串中解析 Emits。
 */
function parseEmitsFromType(typeStr: string, _script: string): EmitInfo[] {
  if (!typeStr) return [];

  const emits: EmitInfo[] = [];
  const lines = typeStr.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const emitMatch = trimmed.match(/\(e:\s*'(\w+[^']*)'(?:,\s*(\w+):\s*([^)]+))?\):/);
    if (emitMatch) {
      emits.push({
        name: emitMatch[1],
        type: emitMatch[2] ? `${emitMatch[2]}: ${emitMatch[3]?.trim() || 'unknown'}` : 'void',
        description: '',
      });
    }
  }

  return emits;
}

/**
 * 从 TypeScript 类型字符串中解析 Slots。
 */
function parseSlotsFromType(typeStr: string): SlotInfo[] {
  if (!typeStr) return [];

  const slots: SlotInfo[] = [];
  const slotMatches = typeStr.matchAll(/(\w+)\s*\??\s*\([^)]*\)\s*:\s*([^;]+);?/g);

  for (const match of slotMatches) {
    slots.push({
      name: match[1],
      props: match[2].trim(),
      description: '',
    });
  }

  return slots;
}

/**
 * 从 defineExpose 对象中解析 Expose。
 */
function parseExpose(exposeStr: string): ExposeInfo[] {
  const expose: ExposeInfo[] = [];
  const lines = exposeStr.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    const match = trimmed.match(/^(\w+)\s*[:,]\s*(.+?);?$/);
    if (match) {
      expose.push({
        name: match[1],
        type: match[2].trim(),
        description: '',
      });
    }
  }

  return expose;
}

/**
 * 生成 Markdown 文档。
 */
function generateMarkdown(api: ComponentApi): string {
  const lines: string[] = [];

  lines.push(`# ${api.name}`);
  lines.push('');
  if (api.description) {
    lines.push(api.description);
    lines.push('');
  }
  lines.push(`> 源文件：\`${relative(process.cwd(), api.filePath)}\``);
  lines.push('');

  // Props
  if (api.props.length > 0) {
    lines.push('## Props');
    lines.push('');
    lines.push('| 属性 | 类型 | 必填 | 默认值 | 说明 |');
    lines.push('|------|------|------|--------|------|');
    for (const prop of api.props) {
      lines.push(
        `| \`${prop.name}\` | \`${prop.type}\` | ${prop.required ? '是' : '否'} | ${prop.defaultValue ? `\`${prop.defaultValue}\`` : '-'} | ${prop.description || '-'} |`,
      );
    }
    lines.push('');
  }

  // Emits
  if (api.emits.length > 0) {
    lines.push('## Emits');
    lines.push('');
    lines.push('| 事件 | 参数 | 说明 |');
    lines.push('|------|------|------|');
    for (const emit of api.emits) {
      lines.push(`| \`${emit.name}\` | \`${emit.type}\` | ${emit.description || '-'} |`);
    }
    lines.push('');
  }

  // Slots
  if (api.slots.length > 0) {
    lines.push('## Slots');
    lines.push('');
    lines.push('| 名称 | Props | 说明 |');
    lines.push('|------|-------|------|');
    for (const slot of api.slots) {
      lines.push(`| \`${slot.name}\` | \`${slot.props}\` | ${slot.description || '-'} |`);
    }
    lines.push('');
  }

  // Expose
  if (api.expose.length > 0) {
    lines.push('## Expose');
    lines.push('');
    lines.push('| 方法/属性 | 类型 | 说明 |');
    lines.push('|-----------|------|------|');
    for (const exp of api.expose) {
      lines.push(`| \`${exp.name}\` | \`${exp.type}\` | ${exp.description || '-'} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 生成索引文件。
 */
function generateIndex(apis: ComponentApi[]): string {
  const lines: string[] = [];

  lines.push('# YDSZ UI — 组件 API 参考');
  lines.push('');
  lines.push(`> 本目录由 \`bash/gen-component-docs.mts\` 自动生成，请勿手动编辑。`);
  lines.push(`> 共 ${apis.length} 个组件。`);
  lines.push('');
  lines.push('## 组件索引');
  lines.push('');
  lines.push('| 组件 | 说明 |');
  lines.push('|------|------|');

  // 按名称排序
  const sorted = [...apis].sort((a, b) => a.name.localeCompare(b.name));

  for (const api of sorted) {
    const fileName = basename(api.filePath, '.vue');
    const desc = api.description || '-';
    lines.push(`| [${api.name}](./${fileName}.md) | ${desc} |`);
  }

  lines.push('');
  return lines.join('\n');
}

// ===== 主流程 =====

async function main() {
  console.log('🔍 扫描 ydsz-ui 组件目录...');

  const vueFiles = await scanVueFiles(UI_SRC);
  console.log(`📦 发现 ${vueFiles.length} 个组件文件`);

  const apis: ComponentApi[] = [];

  for (const filePath of vueFiles) {
    try {
      const api = await extractComponentApi(filePath);
      if (api && (api.props.length > 0 || api.emits.length > 0 || api.slots.length > 0)) {
        apis.push(api);
      }
    } catch (error) {
      console.warn(`⚠️ 解析失败: ${filePath}`, error);
    }
  }

  console.log(`✅ 提取了 ${apis.length} 个组件的 API 信息`);

  // 创建输出目录
  await mkdir(OUTPUT_DIR, { recursive: true });

  // 生成每个组件的文档
  for (const api of apis) {
    const fileName = basename(api.filePath, '.vue');
    const outputPath = join(OUTPUT_DIR, `${fileName}.md`);
    await writeFile(outputPath, generateMarkdown(api), 'utf-8');
  }

  // 生成索引
  await writeFile(join(OUTPUT_DIR, 'index.md'), generateIndex(apis), 'utf-8');

  console.log(`📝 文档已生成到 ${relative(process.cwd(), OUTPUT_DIR)}`);
  console.log(`📄 共生成 ${apis.length} 个组件文档 + 1 个索引文件`);
}

main().catch((error) => {
  console.error('❌ 文档生成失败:', error);
  process.exit(1);
});
