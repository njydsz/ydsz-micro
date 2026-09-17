/**
 * YdVSelect 测试用的辅助函数。
 *
 * 在多个测试文件间复用数据生成逻辑；放在 helpers 文件而不是 __test__ 目录，
 * 是为了让 stories、benchmark 文件也能直接引用。
 *
 * @path comm\@core\ui-kit\ydsz-ui/src/ui/select/vselect-test-helpers.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** YdVSelect 项的字面量类型 */
export interface VSelectItem {
  label: string;
  value: string;
}

/**
 * 生成 YdVSelect 测试数据数组。
 *
 * @param count - 数据条数，默认 100
 * @param prefix - 标签前缀，默认 '标签'
 * @return YdSelectItem 数组
 */
export function generateTestItems(
  count = 100,
  prefix = '标签',
): VSelectItem[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `${prefix} ${i}`,
    value: `item-${i}`,
  }));
}
