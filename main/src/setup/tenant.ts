/**
 * 多租户初始化模块 —— 注入租户加载器 + 同步登录租户上下文
 *
 * <p>在应用引导阶段完成两件事：
 * <ol>
 *   <li>将租户查询 API 注入 shared-business 的 useTenant composable，
 *       使 TenantContext 挂件能获取可访问租户列表</li>
 *   <li>监听 userStore.userInfo 变化，登录成功后自动将 tenantId 同步到 tenantStore，
 *       写入 localStorage['X-Tenant-Id'] 供请求拦截器注入 X-Tenant-Id 头</li>
 * </ol>
 *
 * @path main\src\setup\tenant.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { watch } from 'vue';

import type { TenantFetcher, TenantInfo } from '@ydsz/shared-business';

import { setTenantFetcher, useTenant } from '@ydsz/shared-business';
import { useUserStore } from '@ydsz/stores';

import { getAccessibleTenantsApi } from '#/api/core/tenant';

/** 加载器是否已注入（避免重复执行） */
let _initialized = false;

/**
 * 初始化多租户上下文。
 *
 * <p>{@link setTenantFetcher} 幂等（多次调用仅第一次生效）。
 * 该函数同样幂等——多次调用不会重复创建监听器。
 */
export function initTenant(): void {
  if (_initialized) {
    return;
  }
  _initialized = true;

  // 1. 注入租户查询加载器
  const fetcher: TenantFetcher = async () => {
    const tenants = await getAccessibleTenantsApi();
    return tenants.map(
      (t): TenantInfo => ({
        id: t.id,
        tenantCode: t.tenantCode,
        tenantName: t.tenantName,
      }),
    );
  };
  setTenantFetcher(fetcher);

  // 2. 监听用户信息变化，自动将 tenantId 同步到租户上下文
  //    适用于：登录成功、token 恢复后 fetchUserInfo、SSO 回调等场景
  const userStore = useUserStore();
  watch(
    () => userStore.userInfo?.tenantId,
    (tenantId) => {
      if (tenantId) {
        const tenantStore = useTenant();
        // 仅在 tenantStore 尚未设置或值不同时才更新，避免循环
        if (tenantStore.activeTenantId.value !== tenantId) {
          tenantStore.activeTenantId.value = tenantId;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('X-Tenant-Id', tenantId);
          }
        }
      }
    },
    { immediate: true },
  );
}
