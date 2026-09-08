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

/** 租户切换器函数签名（应用层注入，调用后端切换端点并更新令牌） */
export type TenantSwitcher = (tenantId: string) => Promise<void>;

let _fetcher: TenantFetcher | null = null;

/** 远程租户切换器（未注入时退化为纯前端上下文切换） */
let _switcher: TenantSwitcher | null = null;

/**
 * 注入租户加载器（应用启动时调用一次）。
 *
 * @param fetcher - 返回当前用户可访问租户列表的异步函数
 */
export function setTenantFetcher(fetcher: TenantFetcher): void {
  _fetcher = fetcher;
}

/**
 * 注入远程租户切换器（应用启动时调用一次）。
 *
 * <p>切换器由应用层提供（需 requestClient 与 token store，受包边界约束
 * 本包不直接依赖）：调用后端 {@code POST /api/auth/tenant/switch} 签发目标租户的
 * 新 token 对并写回 token store。注入后 {@link useTenant} 的 {@code switchTenant}
 * 会先执行远程切换，失败时中断本地上下文变更，保证两端一致。
 *
 * @param switcher - 执行远程租户切换的异步函数（失败时应抛出异常）
 */
export function setTenantSwitcher(switcher: TenantSwitcher): void {
  _switcher = switcher;
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
   * <p>优先执行远程切换（已注入 {@link setTenantSwitcher} 时）：调用后端切换端点
   * 签发目标租户的 token 对并写回 token store；远程切换失败时抛出异常且不更新本地上下文。
   * 远程成功后再更新本地：localStorage → 请求拦截器注入 X-Tenant-Id → 广播子应用 →
   * 失效字典缓存。切换后由调用方刷新页面以加载新租户上下文。
   *
   * @param tenantId - 目标租户 ID
   * @param tenantName - 目标租户名称（可选，展示用）
   */
  async function switchTenant(tenantId: string, tenantName?: string): Promise<void> {
    const previousTenantId = tenantStore.activeTenantId;
    if (previousTenantId === tenantId) {
      return;
    }

    // 1. 远程切换（后端签发目标租户 token 对；失败则保持原租户上下文）
    if (_switcher) {
      await _switcher(tenantId);
    }

    // 2. 更新 store + localStorage
    tenantStore.setActiveTenant(tenantId, tenantName);

    // 3. 失效字典缓存（不同租户的字典数据可能不同）
    dictStore.invalidate();

    // 4. 广播租户变更事件到所有子应用
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
