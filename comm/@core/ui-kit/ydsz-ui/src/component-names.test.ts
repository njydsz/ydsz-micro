/**
 * component-names 名册一致性测试。
 *
 * <p>auto-import resolver 与 Nuxt 模块都消费 component-names.ts，
 * 名册一旦与包根 barrels 脱节，构建期会生成指向不存在导出的 import，
 * 而这在运行前不会报错。本用例把「名册 == barrels 真实导出」固化为门禁。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/component-names.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { YDSZ_UI_COMPONENT_NAMES } from './component-names';

const SRC_ROOT = dirname(fileURLToPath(import.meta.url));

/**
 * 递归收集 src 下所有 barrel（index.ts）文件路径。
 *
 * @param dir - 起始目录
 * @returns barrel 文件绝对路径列表
 */
function collectBarrels(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectBarrels(full));
    else if (entry === 'index.ts') out.push(full);
  }
  return out;
}

/**
 * 从 barrels 中解析出全部组件导出名。
 *
 * @returns 包根实际透出的 Yd* 组件名集合
 */
function readExportsFromBarrels(): Set<string> {
  const names = new Set<string>();
  for (const file of collectBarrels(SRC_ROOT)) {
    // export type { … } 只透出类型，不能作为组件注册。
    const valueExports = readFileSync(file, 'utf8').replace(/export\s+type\s*\{[^}]*\}/gs, '');
    for (const match of valueExports.matchAll(/\bas\s+(Yd[A-Za-z0-9]*)/g)) {
      names.add(match[1]);
    }
  }
  return names;
}

describe('YDSZ_UI_COMPONENT_NAMES 名册', () => {
  const barrelNames = readExportsFromBarrels();

  it('应覆盖 barrels 透出的每一个组件导出', () => {
    const missing = [...barrelNames].filter(name => !YDSZ_UI_COMPONENT_NAMES.includes(name));
    expect(missing).toEqual([]);
  });

  it('不应包含 barrels 里不存在的幽灵组件', () => {
    const roster = new Set(YDSZ_UI_COMPONENT_NAMES);
    const phantom = [...roster].filter(name => !barrelNames.has(name));
    expect(phantom).toEqual([]);
  });

  it('名册内不得出现重名', () => {
    expect(new Set(YDSZ_UI_COMPONENT_NAMES).size).toBe(YDSZ_UI_COMPONENT_NAMES.length);
  });

  it('名册应按字典序排列，便于 diff 审查', () => {
    expect([...YDSZ_UI_COMPONENT_NAMES]).toEqual([...YDSZ_UI_COMPONENT_NAMES].sort());
  });

  it('全部条目都应带 Yd 前缀', () => {
    expect(YDSZ_UI_COMPONENT_NAMES.filter(name => !name.startsWith('Yd'))).toEqual([]);
  });

  it('barrel 扫描应真实命中已知组件，而非空集合通过校验', () => {
    expect(barrelNames.size).toBe(YDSZ_UI_COMPONENT_NAMES.length);
    for (const name of ['YdButton', 'YdSelectSmart', 'YdTreeSelect', 'YdBreadcrumbPro', 'YdTourStep']) {
      expect(barrelNames.has(name)).toBe(true);
    }
  });
});
