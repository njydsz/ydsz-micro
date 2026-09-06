/**
 * vxe-table 适配器（应用级 re-export）
 *
 * <p>统一实现已提取至 @ydsz/shared-business，此处保留应用级入口以兼容既有导入路径。
 * <p>如需应用级扩展自定义 renderer，可在此文件内补充。
 *
 * <p>增强：根据 localStorage 中 {@code ydsz_pref_user_config} 的 {@code tableSize}
 * 字段动态覆盖 VxeTable 默认 size 属性（mini | small | medium | large）。
 *
 * @path apps/system-web/src/adapter/vxe-table.ts
 * @author ydsz-team
 * @since 1.1.0
 */

import { useYDSZVxeGrid as useSharedYDSZVxeGrid } from '@ydsz/shared-business';

/**
 * 根据 localStorage 读取用户配置的表格密度，返回 VxeTable size 属性值。
 *
 * <p>偏好储存在 localStorage {@code ydsz_pref_user_config} 的 {@code tableSize} 字段，
 * 可选值为 default | compact | loose，对应 VxeTable 的 small | mini | medium。
 */
function resolveTableSizeFromPreferences(): string | undefined {
  try {
    const stored = localStorage.getItem('ydsz_pref_user_config');
    if (!stored) return undefined;
    const config = JSON.parse(stored) as { tableSize?: string };
    const sizeMap: Record<string, string> = {
      compact: 'mini',
      default: 'small',
      loose: 'medium',
    };
    return config.tableSize ? sizeMap[config.tableSize] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 应用级 useYDSZVxeGrid —— 注入表格密度偏好。
 *
 * <p>在调用底层共享实现前，将 localStorage 中的表格局部 size 合并到
 * gridOptions.size 中，实现用户偏好的表格密度即时生效。
 */
function useYDSZVxeGrid(options: { gridOptions: Record<string, unknown> }) {
  const tableSize = resolveTableSizeFromPreferences();
  if (tableSize) {
    options.gridOptions.size = tableSize;
  }
  return useSharedYDSZVxeGrid(
    options as Parameters<typeof useSharedYDSZVxeGrid>[0],
  );
}

export { useYDSZVxeGrid };

export type * from '@ydsz/plugins/vxe-table';
