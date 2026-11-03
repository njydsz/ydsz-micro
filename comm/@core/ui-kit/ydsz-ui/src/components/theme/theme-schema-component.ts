/**
 * YDSZ Design Token Schema —— component 层。
 *
 * 组件命名空间（--yd-table-header-bg / --yd-select-item-hover 等），引用 semantic
 * 层 token，可按组件粒度覆写。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\theme\theme-schema-component.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { TokenCategory, TokenLayer } from './theme-schema-types';
import type { TokenDefinition } from './theme-schema-types';

/**
 * component 层 token 注册表：引用 semantic 层，可按组件粒度覆写。
 */
export const componentTokens = {
  'yd-table-header-bg': {
    category: TokenCategory.COLOR,
    cssVar: 'yd-table-header-bg',
    defaultValue: '210 40% 96.1%',
    description: '表头背景',
    layer: TokenLayer.COMPONENT,
    ref: 'muted',
  },
  'yd-table-row-hover': {
    category: TokenCategory.COLOR,
    cssVar: 'yd-table-row-hover',
    defaultValue: '210 40% 96.1%',
    description: '表格行 hover 背景',
    layer: TokenLayer.COMPONENT,
    ref: 'muted',
  },
  'yd-table-row-selected': {
    category: TokenCategory.COLOR,
    cssVar: 'yd-table-row-selected',
    defaultValue: '210 40% 92%',
    description: '表格行选中背景',
    layer: TokenLayer.COMPONENT,
    ref: 'muted',
  },
  'yd-select-item-hover': {
    category: TokenCategory.COLOR,
    cssVar: 'yd-select-item-hover',
    defaultValue: '210 40% 96.1%',
    description: '下拉选项 hover 背景',
    layer: TokenLayer.COMPONENT,
    ref: 'muted',
  },
  'yd-select-item-active': {
    category: TokenCategory.COLOR,
    cssVar: 'yd-select-item-active',
    defaultValue: '210 40% 90%',
    description: '下拉选项选中背景',
    layer: TokenLayer.COMPONENT,
    ref: 'accent',
  },
  'yd-tooltip-bg': {
    category: TokenCategory.COLOR,
    cssVar: 'yd-tooltip-bg',
    defaultValue: '222.2 84% 4.9%',
    description: '文字提示背景',
    layer: TokenLayer.COMPONENT,
    ref: 'foreground',
  },
  'yd-tooltip-fg': {
    category: TokenCategory.COLOR,
    cssVar: 'yd-tooltip-fg',
    defaultValue: '210 40% 98%',
    description: '文字提示前景',
    layer: TokenLayer.COMPONENT,
    ref: 'background',
  },
} as const satisfies Record<string, TokenDefinition>;
