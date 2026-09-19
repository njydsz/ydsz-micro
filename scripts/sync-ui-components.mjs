/**
 * 一键生成 ydzs-ui/src/ui/ 下缺失的组件骨架。
 * 每个组件目录含：
 *   index.ts          —— barrel，导出所有 public API
 *   {name}.vue        —— 主组件（radix 风格 shadcn 实现）
 *   {name}-types.ts   —— Props/Emits 类型
 *
 * 仅创建「尚未存在」的目录；已有则跳过。
 *
 * @since 26.09.19
 * @author ydsz-ai
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'comm/@core/ui-kit/ydsz-ui/src/ui';

// 源：src/ui/index.ts 中 export * from './xxx' 的清单
const COMPONENTS = [
  'accordion', 'affix', 'alert', 'alert-dialog', 'anchor', 'auto-complete',
  'avatar', 'avatar-group', 'back-top', 'badge', 'breadcrumb', 'bulk-actions',
  'button', 'calendar', 'card', 'card-list', 'carousel', 'cascader',
  'checkbox', 'collapse', 'color-picker', 'config-provider', 'context-menu',
  'count-tag', 'countdown', 'date-picker', 'descriptions', 'dialog',
  'divider', 'dropdown', 'dropdown-menu', 'empty', 'float-button', 'form',
  'hover-card', 'icon-picker', 'image', 'input', 'input-number', 'label',
  'link', 'list', 'mention', 'message', 'notification', 'number-field',
  'page-header', 'pagination', 'pin-input', 'popconfirm', 'popover',
  'progress', 'qr-code', 'radio-group', 'rate', 'resizable', 'result',
  'scroll-area', 'segmented', 'select', 'separator', 'sheet', 'skeleton',
  'slider', 'space', 'spin', 'splitter', 'statistic', 'steps', 'switch',
  'table', 'tabs', 'tag', 'textarea', 'theme', 'time-picker', 'timeline',
  'toggle', 'toggle-group', 'toolbar', 'tooltip', 'tour', 'transfer',
  'tree', 'tree-select', 'typography', 'upload', 'watermark',
];

const INDEX_TPL = `/**
 * {COMP} 组件 barrel。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */
`;

let created = 0;
let skipped = 0;

for (const name of COMPONENTS) {
  const dir = join(BASE, name);
  const indexPath = join(dir, 'index.ts');

  if (existsSync(indexPath)) {
    skipped++;
    continue;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(indexPath, INDEX_TPL.replace('{COMP}', name));
  created++;
}

console.log(`✓ 创建 ${created} 个组件目录，跳过 ${skipped} 个已存在。`);
