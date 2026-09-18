/**
 * @file use-tenant-aware.ts
 * @description 租户感知选择 composable —— ydzz-vue 业务特化层。
 *
 * 后端多租户（三种策略）场景下，Select/TreeSelect 在租户切换后
 * 需要自动清空已选并重新加载选项。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\composables\use-tenant-aware.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import type { Ref } from 'vue'

import { ref, watch } from 'vue'

/** useTenantAwareSelection 配置项 */
export interface UseTenantAwareOptions {
  /** 当前租户标识 */
  tenantKey: Ref<string> | string
  /** 租户切换回调 */
  onTenantChange?: (newVal: string, oldVal: string) => void
}

/** 返回句柄 */
export interface UseTenantAwareHandle<T> {
  /** 当前已选值（租户切换自动清空） */
  selected: Ref<T[]>
  /** 手动重置选择（不清空租户） */
  clearSelection: () => void
  /** 设置选择值（外部传入） */
  setSelected: (vals: T[]) => void
}

/**
 * 租户感知选择状态机。
 *
 * @example
 * ```ts
 * const { selected, clearSelection } = useTenantAwareSelection<string>({
 *   tenantKey: () => currentTenant.value,
 *   onTenantChange: (n, o) => logger.info(`租户切换 ${o} → ${n}`),
 * })
 * ```
 */
export function useTenantAwareSelection<T>(
  options: UseTenantAwareOptions,
): UseTenantAwareHandle<T> {
  const { onTenantChange } = options

  const selected = ref<T[]>([]) as Ref<T[]>

  /** 获取当前 tenantKey 值（兼容 ref 与普通值） */
  function resolveTenantKey(): string {
    const raw = options.tenantKey
    return typeof raw === 'object' && 'value' in raw ? (raw as Ref<string>).value : String(raw)
  }

  /** 清空选择（租户切换时自动调用） */
  function clearSelection(): void {
    selected.value = []
  }

  /** 设置选择值 */
  function setSelected(vals: T[]): void {
    selected.value = [...vals]
  }

  /** 监听租户变化 → 清空选择 → 回调 */
  if (typeof options.tenantKey === 'object' && 'value' in options.tenantKey) {
    let previousTenant = resolveTenantKey()
    watch(
      () => resolveTenantKey(),
      (newTenant: string) => {
        if (newTenant !== previousTenant) {
          clearSelection()
          onTenantChange?.(newTenant, previousTenant)
          previousTenant = newTenant
        }
      },
      { flush: 'sync' },
    )
  }

  return {
    selected,
    clearSelection,
    setSelected,
  }
}
