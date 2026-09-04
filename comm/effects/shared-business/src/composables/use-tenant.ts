/**
 * use-tenant — 多租户上下文 composable
 *
 * <p>提供可访问租户列表加载、当前租户切换、租户上下文同步等能力。
 * 加载器通过 {@link setTenantFetcher} 注入（由应用层提供 requestClient 实现），
 * 保持本包不依赖 @ydsz/request，遵守包边界约束。
 *
 * <p>切换租户的核心链路：
 * <ol>
 *   <li>调用 {@link switchTenant} 设置活跃租户 ID</li>
 *   <li>{@link useTenantStore} 同步写入 localStorage['X-Tenant-Id']</li>
 *   <li>后续请求由请求拦截器自动读取 localStorage 注入 X-Tenant-Id 头</li>
 *   <li>广播租户变更事件到所有子应用</li>
 *   <li>字典缓存自动失效（字典按租户隔离）</li>
 * </ol>
 *
 * @path comm\effects\shared-business\src\composables\use-tenant.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';

import { useDictStore, useTenantStore } from '@ydsz/stores';

/** 租户简要信息（前端展示用） */
export interface TenantInfo {
  /** 租户 ID */
  id: string;
  /** 租户编码 */
  tenantCode: string;
  /** 租户名称 */
  tenantName: string;
}

/** 租户加载器函数签名 */
export type TenantFetcher = () => Promise<TenantInfo[]>;

let _fetcher: TenantFetcher | null = null;

/**
 * 注入租户加载器（应用启动时调用一次）。
 *
 * @param fetcher - 返回当前用户可访问租户列表的异步函数
 */
export function setTenantFetcher(fetcher: TenantFetcher): void {
  _fetcher = fetcher;
}

/**
 * 多租户上下文 composable
 *
 * <p>返回租户列表加载、当前租户切换等方法。通常在共享组件或主应用布局中使用。
 */
export function useTenant() {
  const tenantStore = useTenantStore();
  const dictStore = useDictStore();

  /** 可访问租户列表 */
  const accessibleTenants = ref<TenantInfo[]>([]);
  /** 是否正在加载租户列表 */
  const loading = ref(false);
  /** 加载错误信息 */
  const error = ref<null | string>(null);

  /** 当前活跃 tenantId */
  const activeTenantId = computed(() => tenantStore.activeTenantId);
  /** 当前活跃 tenantName */
  const activeTenantName = computed(() => tenantStore.activeTenantName);
  /** 是否为多租户模式 */
  const isMultiTenant = computed(() => tenantStore.isMultiTenant);

  /**
   * 加载当前用户可访问的租户列表。
   *
   * @returns 可访问租户列表
   */
  async function loadAccessibleTenants(): Promise<TenantInfo[]> {
    if (!_fetcher) {
      error.value = '未注入租户加载器，请先调用 setTenantFetcher()';
      return [];
    }
    loading.value = true;
    error.value = null;
    try {
      const tenants = await _fetcher();
      accessibleTenants.value = tenants;
      return tenants;
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载租户列表失败';
      error.value = message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 切换到指定租户。
   *
   * <p>更新 localStorage → 请求拦截器自动注入 X-Tenant-Id 头 → 广播子应用刷新 → 失效字典缓存。
   * 切换后建议刷新页面或重新拉取当前页面数据以确保数据一致性。
   *
   * @param tenantId - 目标租户 ID
   * @param tenantName - 目标租户名称（可选，展示用）
   */
  function switchTenant(tenantId: string, tenantName?: string): void {
    const previousTenantId = tenantStore.activeTenantId;
    if (previousTenantId === tenantId) {
      return;
    }

    // 1. 更新 store + localStorage
    tenantStore.setActiveTenant(tenantId, tenantName);

    // 2. 失效字典缓存（不同租户的字典数据可能不同）
    dictStore.invalidate();

    // 3. 广播租户变更事件到所有子应用
    broadcastTenantChange(tenantId, previousTenantId);
  }

  return {
    /** 可访问租户列表（需先调用 loadAccessibleTenants） */
    accessibleTenants,
    /** 加载错误信息 */
    error,
    /** 当前活跃租户 ID */
    activeTenantId,
    /** 当前活跃租户名称 */
    activeTenantName,
    /** 是否为多租户模式 */
    isMultiTenant,
    /** 是否正在加载 */
    loading,
    /** 加载可访问租户列表 */
    loadAccessibleTenants,
    /** 切换到指定租户 */
    switchTenant,
  };
}

/**
 * 广播租户变更事件到所有子应用。
 *
 * <p>通过 CustomEvent 触发，监听方需在适当时机处理（如刷新数据、关闭弹窗等）。
 *
 * @param newTenantId - 新租户 ID
 * @param previousTenantId - 原租户 ID
 */
function broadcastTenantChange(
  newTenantId: string,
  previousTenantId: string,
): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent('tenant-change', {
      detail: { newTenantId, previousTenantId },
    }),
  );
}
