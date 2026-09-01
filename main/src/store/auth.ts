/**
 * Auth Pinia Store —— 复用 createSharedAuthStore 工厂并注入跨标签页登出回调
 *
 * @path main\src\store\auth.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { createSharedAuthStore } from '@ydsz/shared-auth';

import { CROSS_TAB_EVENTS, notifyCrossTab } from '#/hooks/use-cross-tab-sync';

/** 认证状态管理 Store（Pinia，含跨标签页登出同步回调） */
export const useAuthStore = createSharedAuthStore({
  onLogout: (redirect) => notifyCrossTab(CROSS_TAB_EVENTS.LOGOUT, { redirect }),
});
