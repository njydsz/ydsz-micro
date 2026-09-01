/**
 * 微前端子应用公共认证/请求/API 模块统一入口
 *
 * 消除 9 个子应用中重复的 request.ts / auth.ts / user.ts / menu.ts / store/auth.ts 代码。
 * 子应用只需 re-export 或直接引用本包即可获得与后端对齐的：
 * - RequestClient（successCode="A00000" + Bearer Token + refreshToken 自动刷新）
 * - Auth API（/api/v1/auth/* 登录/登出/刷新/权限码）
 * - User API（/api/v1/auth/userinfo）
 * - Menu API（/api/v1/menu/routes）
 * - Auth Store（完整 LoginVO + refreshToken + 登录/登出流程）
 *
 * @path comm\effects\shared-auth\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export type {
  AuthApi,
} from './types';

export {
  createSharedBaseClient,
  createSharedRequestClient,
} from './request';

export {
  baseRequestClient,
  initSharedRequest,
  requestClient,
} from './request-setup';

export {
  loginApi,
  logoutApi,
  refreshTokenApi,
  getAccessCodesApi,
} from './auth-api';

export {
  getUserInfoApi,
} from './user-api';

export {
  getAllMenusApi,
  getMenuTreeApi,
} from './menu-api';

export {
  createSharedAuthStore,
} from './auth-store';

export {
  setupSharedAuth,
} from './setup-shared-auth';

export {
  type SubAppConfig,
  createSubApp,
} from './create-sub-app';

export {
  type CreateSubAppI18nOptions,
  type SubAppI18nInstance,
  createSubAppI18n,
} from './i18n-setup';

export {
  type TokenRefreshedPayload,
  CROSS_TAB_CHANNEL,
  CROSS_TAB_EVENTS,
  notifyCrossTab,
} from './cross-tab';

export {
  createSubAppRouterGuard,
  initRoutes,
  setupAuthGuard,
  setupCommonGuard,
  setupPermissionGuard,
} from './guards';

export {
  createOpenApiClient,
} from './create-openapi-client';

export {
  type SseEvent,
  type StreamRequestOptions,
  parseSseChunk,
  streamRequest,
} from './sse';

// v4.4.0: SSE 连接生命周期封装（收敛 agent-web / message-web 的重复骨架）
export {
  openSseRequest,
  safeParseSseJson,
  type SseLifecycleHandlers,
  type SseRequestOptions,
} from './sse-lifecycle';
