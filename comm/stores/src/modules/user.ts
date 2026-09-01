/**
 * user Pinia 状态管理
 *
 * 采用 Composition API（setup）语法，符合云顶编码规范 §8.1。
 *
 * @path comm\stores\src\modules\user.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { BasicUserInfo } from '@YDSZ-core/typings';

import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * @zh_CN 用户信息相关
 */
export const useUserStore = defineStore(
  'core-user',
  () => {
    /**
     * 用户信息
     */
    const userInfo = ref<BasicUserInfo | null>(null);
    /**
     * 用户角色
     */
    const userRoles = ref<string[]>([]);

    /**
     * 设置用户信息并同步更新角色列表。
     *
     * @param info - 用户登录信息，包含 roles 数组；传 null 表示清除登录态
     */
    function setUserInfo(info: BasicUserInfo | null) {
      userInfo.value = info;
      const roles = info?.roles ?? [];
      setUserRoles(roles);
    }

    /**
     * 单独设置当前用户的角色列表（不修改其他用户信息）。
     *
     * @param roles - 角色标识字符串数组（如 ['admin', 'editor']）
     */
    function setUserRoles(roles: string[]) {
      userRoles.value = roles;
    }

    return {
      userInfo,
      userRoles,
      setUserInfo,
      setUserRoles,
    };
  },
);

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}
