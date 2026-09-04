/**
 * tenant Pinia 状态管理 — 前端多租户上下文
 *
 * 采用 Composition API（setup）语法，符合云顶编码规范 §8.1。
 *
 * <p>管理当前活跃租户 ID，通过 localStorage 持久化并与后端请求拦截器联动
 * （请求拦截器读取 localStorage['X-Tenant-Id'] 注入请求头）。
 *
 * @path comm\stores\src\modules\tenant.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

/** localStorage 存储键名（与请求拦截器 resolveTenantId() 对齐） */
const STORAGE_KEY_TENANT_ID = 'X-Tenant-Id';
const STORAGE_KEY_TENANT_NAME = 'X-Tenant-Name';

/**
 * @zh_CN 多租户上下文状态管理
 */
export const useTenantStore = defineStore(
  'core-tenant',
  () => {
    /** 当前活跃租户 ID */
    const activeTenantId = ref<string>('');
    /** 当前活跃租户名称（展示用） */
    const activeTenantName = ref<string>('');

    /**
     * 是否为多租户模式（存在租户 ID 即视为启用）
     */
    const isMultiTenant = computed(() => !!activeTenantId.value);

    /**
     * 设置当前活跃租户。
     *
     * <p>同步写入 localStorage，供请求拦截器在下次请求时自动注入 X-Tenant-Id 头。
     *
     * @param tenantId - 租户 ID
     * @param tenantName - 租户名称（可选，展示用）
     */
    function setActiveTenant(tenantId: string, tenantName?: string): void {
      activeTenantId.value = tenantId;
      activeTenantName.value = tenantName ?? activeTenantName.value;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TENANT_ID, tenantId);
        if (tenantName) {
          localStorage.setItem(STORAGE_KEY_TENANT_NAME, tenantName);
        }
      }
    }

    /**
     * 清除当前活跃租户（退出租户上下文）。
     */
    function clearActiveTenant(): void {
      activeTenantId.value = '';
      activeTenantName.value = '';
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_TENANT_ID);
        localStorage.removeItem(STORAGE_KEY_TENANT_NAME);
      }
    }

    /**
     * 从 localStorage 恢复租户上下文（应用启动时调用一次）。
     *
     * @returns 是否成功恢复了租户上下文
     */
    function restoreFromStorage(): boolean {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      const storedId = localStorage.getItem(STORAGE_KEY_TENANT_ID);
      const storedName = localStorage.getItem(STORAGE_KEY_TENANT_NAME) ?? '';
      if (storedId) {
        activeTenantId.value = storedId;
        activeTenantName.value = storedName;
        return true;
      }
      return false;
    }

    // 初始化：从 localStorage 恢复（如果存在）
    restoreFromStorage();

    // 同步监听：activeTenantId 变化时自动同步到 localStorage
    watch(activeTenantId, (newId) => {
      if (typeof localStorage !== 'undefined' && newId) {
        localStorage.setItem(STORAGE_KEY_TENANT_ID, newId);
      }
    });

    return {
      activeTenantId,
      activeTenantName,
      clearActiveTenant,
      isMultiTenant,
      restoreFromStorage,
      setActiveTenant,
    };
  },
);

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useTenantStore, hot));
}
