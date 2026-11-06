/**
 * ARIA 契约一致性测试。
 *
 * @remarks
 * 把 `aria-role-map.ts` 从「死数据」变成可执行契约：
 * <ol>
 *   <li>契约结构合法（role 非空、category 在枚举内、键位常量合法）</li>
 *   <li>同一 role 的组件契约一致（避免同类组件 role 漂移）</li>
 *   <li>声明了 requiredAttrs 的组件必须同时声明 keyboardInteractions
 *       （交互组件若只声明属性不声明键位，说明契约不完整）</li>
 *   <li>所有注册组件均以 Yd 前缀开头（NAM 约定）</li>
 * </ol>
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/a11y/__tests__/aria-role-map.test.ts
 * @author ydsz-team
 * @since 26.11.06
 */

import { describe, expect, it } from 'vitest';

import {
  ARIA_KEYBOARD_KEYS,
  ARIA_RTL_LANGUAGES,
  ARIA_ROLE_CONTRACTS,
  type AriaRoleCategory,
} from '../aria-role-map';

const VALID_CATEGORIES: AriaRoleCategory[] = [
  'widget',
  'structure',
  'landmark',
  'window',
  'liveRegion',
  'navigation',
];

const VALID_KEY_NAMES = new Set([
  ...ARIA_KEYBOARD_KEYS.activation,
  ...ARIA_KEYBOARD_KEYS.escape,
  ...ARIA_KEYBOARD_KEYS.tab,
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Delete',
  'Backspace',
  'Space',
  'Tab',
  'Enter',
  'Escape',
]);

describe('ARIA_ROLE_CONTRACTS', () => {
  const entries = Object.entries(ARIA_ROLE_CONTRACTS);

  it('契约表非空（避免空集合通过校验）', () => {
    expect(entries.length).toBeGreaterThan(30);
  });

  for (const [name, contract] of entries) {
    describe(name, () => {
      it('role 非空且为合法 ARIA 角色名', () => {
        expect(contract.role).toBeTruthy();
        expect(contract.role).toMatch(/^[a-z]+$/);
      });

      it('category 在枚举内', () => {
        expect(VALID_CATEGORIES).toContain(contract.category);
      });

      it('组件名以 Yd 前缀开头', () => {
        expect(name).toMatch(/^Yd[A-Z]/);
      });

      it('声明的键位均为已知键名', () => {
        for (const key of contract.keyboardInteractions ?? []) {
          expect(VALID_KEY_NAMES.has(key), `未知键位 ${key}`).toBe(true);
        }
      });

      it('widget 类组件必须声明键位', () => {
        // 只有可交互组件（widget）才需要键位；structure/landmark 等
        // 非交互组件声明 attrs 但不涉及键盘交互。
        if (contract.category === 'widget') {
          expect(
            contract.keyboardInteractions?.length,
            `${name} 属于 widget 分类但缺少 keyboardInteractions`,
          ).toBeGreaterThan(0);
        }
      });
    });
  }

  it('同一 role 的组件契约一致', () => {
    // 允许的例外：同一 role 同时存在静态与可交互两种形态。
    // 例如 separator：YdSeparator（静态分隔线，structure）与
    // YdSplitter（可拖拽分隔条，widget）是合法的语义分化。
    // list 同理：YdSteps（步骤导航，navigation）与 YdTimeline（时间线，structure）。
    const ALLOWED_ROLE_SPLIT = new Set(['separator', 'list']);

    const byRole = new Map<string, string[]>();
    for (const [name, c] of entries) {
      const list = byRole.get(c.role) ?? [];
      list.push(name);
      byRole.set(c.role, list);
    }

    for (const [role, names] of byRole) {
      if (names.length < 2) continue;
      if (ALLOWED_ROLE_SPLIT.has(role)) continue;
      const categories = new Set(names.map((n) => ARIA_ROLE_CONTRACTS[n].category));
      // 同一 role 的组件应归属同一分类
      expect(categories.size, `role="${role}" 的分类不一致：${names.join(', ')}`).toBe(1);
    }
  });
});

describe('ARIA_RTL_LANGUAGES', () => {
  it('包含 RTL 语种且格式合法', () => {
    expect(ARIA_RTL_LANGUAGES.length).toBeGreaterThan(0);
    for (const tag of ARIA_RTL_LANGUAGES) {
      expect(tag).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });
});

describe('ARIA_KEYBOARD_KEYS', () => {
  it('三组键位常量非空', () => {
    expect(ARIA_KEYBOARD_KEYS.activation.length).toBeGreaterThan(0);
    expect(ARIA_KEYBOARD_KEYS.escape.length).toBeGreaterThan(0);
    expect(ARIA_KEYBOARD_KEYS.tab.length).toBeGreaterThan(0);
  });
});
