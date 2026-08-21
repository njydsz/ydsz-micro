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
     * 设置用户信息（同步设置角色）
     */
    function setUserInfo(info: BasicUserInfo | null) {
      userInfo.value = info;
      const roles = info?.roles ?? [];
      setUserRoles(roles);
    }

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
