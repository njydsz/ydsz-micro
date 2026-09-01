/**
 * 请求客户端配置 —— 复用 @ydsz/shared-auth 共享客户端并注入鉴权与刷新回调
 *
 * P2-3: 消除主应用与 shared-auth 的重复代码。
 * 主应用只需提供 doReAuthenticate 和 doRefreshToken 回调，
 * 其余拦截器配置（successCode="A00000" + Bearer Token + refreshToken）由 shared-auth 统一管理。
 *
 * 导出两个客户端：
 *   - requestClient: 携带鉴权拦截器（自动注入 Bearer Token + 401 自动刷新）
 *   - baseRequestClient: 不含鉴权拦截器，用于登录、刷新令牌等公共接口
 *
 * @path main\src\api\request.ts
 * @author ydsz-team
 * @since 4.0.0
 */
import type { RequestClientOptions } from '@ydsz/request';

import { preferences } from '@ydsz/preferences';
import { useAccessStore, useTokenStore } from '@ydsz/stores';
import {
  CROSS_TAB_EVENTS,
  createSharedBaseClient,
  createSharedRequestClient,
  notifyCrossTab,
} from '@ydsz/shared-auth';

import { createLogger } from '@YDSZ-core/shared/utils';

import { useAuthStore } from '#/store/auth';

/** 模块级日志器 */
const logger = createLogger('MainRequest');

const options: RequestClientOptions = {
  responseReturn: 'data',
};

/**
 * 访问令牌失效时的重新认证回调。
 *
 * shared-auth 判定 accessToken / refreshToken 失效或过期时触发：清空本地令牌，
 * 若配置为弹窗模式且已完成首次访问校验则弹出登录过期提示，否则直接登出。
 */
async function doReAuthenticate() {
  logger.warn('Access token or refresh token is invalid or expired. ');
  const accessStore = useAccessStore();
  const tokenStore = useTokenStore();
  tokenStore.setAccessToken(null);
  // 同步清空过期时间戳，避免登出后仍触发会话超时预警
  tokenStore.setExpiresAt(null);
  if (
    preferences.app.loginExpiredMode === 'modal' &&
    accessStore.isAccessChecked
  ) {
    tokenStore.setLoginExpired(true);
  } else {
    const authStore = useAuthStore();
    await authStore.logout();
  }
}

/**
 * 刷新访问令牌回调。
 *
 * 使用 useTokenStore 的 refreshToken 调用后端刷新接口，成功则更新 accessToken；
 * 无 refreshToken 时返回 null，交由 shared-auth 触发 {@link doReAuthenticate}。
 */
async function doRefreshToken() {
  const tokenStore = useTokenStore();
  const refreshToken = tokenStore.refreshToken;
  if (!refreshToken) {
    return null;
  }
  // 延迟引用避免 request ↔ core/auth 初始化期循环依赖（仅在刷新令牌时加载）
  const { refreshTokenApi } = await import('./core/auth');
  const resp = await refreshTokenApi(refreshToken);
  // baseRequestClient responseReturn='data'，resp 即 RefreshTokenResult（无 .data 包装）
  const newToken = resp?.accessToken ?? '';
  let newExpiresAt: null | number = null;
  if (newToken) {
    tokenStore.setAccessToken(newToken);
  }
  // 续期后同步刷新绝对过期时间戳（供会话超时预警使用）
  const expiresIn = resp?.expiresIn;
  if (typeof expiresIn === 'number' && expiresIn > 0) {
    newExpiresAt = Date.now() + expiresIn * 1000;
    tokenStore.setExpiresAt(newExpiresAt);
  }
  // D4: 广播 token 刷新成功事件到其它标签页，
  //     避免其它标签页同时 401 时重复刷新导致 refreshToken 竞态
  if (newToken) {
    notifyCrossTab(CROSS_TAB_EVENTS.TOKEN_REFRESHED, {
      accessToken: newToken,
      expiresAt: newExpiresAt,
    });
  }
  return newToken || null;
}

/** 主应用共享请求客户端：携带鉴权拦截器，响应统一只返回 data 字段。 */
export const requestClient = createSharedRequestClient(
  doReAuthenticate,
  doRefreshToken,
  options,
);

/** 基础请求客户端：不含鉴权拦截器，用于登录、刷新令牌等公共接口。 */
export const baseRequestClient = createSharedBaseClient();
