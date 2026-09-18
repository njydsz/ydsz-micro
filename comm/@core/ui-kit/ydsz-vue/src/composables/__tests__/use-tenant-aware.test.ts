/**
 * @file use-tenant-aware.test.ts
 * @description useTenantAwareSelection composable 测试——租户切换清空 / 手动设置 / 回调。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\composables\__tests__\use-tenant-aware.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useTenantAwareSelection } from '../use-tenant-aware'

describe('useTenantAwareSelection', () => {
  it('初始选择为空', () => {
    const tenant = ref('tenant-a')
    const { selected } = useTenantAwareSelection<string>({ tenantKey: tenant })
    expect(selected.value).toEqual([])
  })

  it('setSelected 设置值', () => {
    const tenant = ref('tenant-a')
    const { selected, setSelected } = useTenantAwareSelection<string>({ tenantKey: tenant })
    setSelected(['opt1', 'opt2'])
    expect(selected.value).toEqual(['opt1', 'opt2'])
  })

  it('clearSelection 清空', () => {
    const tenant = ref('tenant-a')
    const { selected, setSelected, clearSelection } = useTenantAwareSelection<string>({ tenantKey: tenant })
    setSelected(['a', 'b'])
    clearSelection()
    expect(selected.value).toEqual([])
  })

  it('租户切换 → 自动清空选择', () => {
    const tenant = ref('tenant-a')
    const { selected, setSelected } = useTenantAwareSelection<string>({ tenantKey: tenant })
    setSelected(['opt1', 'opt2'])
    expect(selected.value).toHaveLength(2)

    tenant.value = 'tenant-b'
    expect(selected.value).toEqual([])
  })

  it('租户切换 → 触发 onTenantChange 回调', () => {
    const tenant = ref('tenant-a')
    const onChange = vi.fn()
    useTenantAwareSelection<string>({ tenantKey: tenant, onTenantChange: onChange })

    tenant.value = 'tenant-b'
    expect(onChange).toHaveBeenCalledWith('tenant-b', 'tenant-a')
  })

  it('值未变化的 watch 不触发回调', () => {
    const tenant = ref('tenant-a')
    const onChange = vi.fn()
    useTenantAwareSelection<string>({ tenantKey: tenant, onTenantChange: onChange })

    // 强制重新赋值相同值
    tenant.value = 'tenant-a'
    expect(onChange).not.toHaveBeenCalled()
  })
})
