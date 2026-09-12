/**
 * 系统管理 Web 子应用 —— 请求 / 响应拦截器扩展
 *
 * <p>响应错误拦截器职责：捕获 SECONDARY_AUTH_REQUIRED 业务错误码时，
 * 弹窗要求用户完成二次身份验证，验证通过后自动重放原请求。
 *
 * <p>注册时机：在 main.ts 中 onLoad 阶段追加，保证 requestClient 已被
 * initSharedRequest() 初始化。
 *
 * @path apps\system-web\src\api\interceptors.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RequestClientConfig, ResponseInterceptorConfig } from '@ydsz/request';

import { isBusinessError, requestClient } from '@ydsz/request';
import axios from 'axios';
import type { AxiosError } from 'axios';

import { createLogger } from '@ydsz-core/shared/utils';

import { secondaryAuthApi } from './secondary-auth';
import { openSecondaryAuthModal } from '#/composables/useSecondaryAuth';

/** 模块日志器 */
const logger = createLogger('system-interceptors');

/** 二次认证业务错误码 —— 需用户输入当前登录密码完成二次身份验证 */
const SECONDARY_AUTH_CODES = new Set([
  'A20123',
  'SECONDARY_AUTH_REQUIRED',
]);

/** X-Secondary-Auth 请求头键名常量 */
const HEADER_SECONDARY_AUTH = 'X-Secondary-Auth';

/**
 * 判断错误是否为 SECONDARY_AUTH_REQUIRED 业务错误。
 *
 * @param error - axios 拦截器抛出的源错误
 * @returns 是否为二次认证错误
 */
function isSecondaryAuthError(error: unknown): {
  authHint?: string;
  scene?: string;
} | null {
  if (!isBusinessError(error)) return null;
  const code = error.code;
  if (!code || !SECONDARY_AUTH_CODES.has(code)) return null;

  // 后端将 authHint / scene 放在 data.data 中
  const data = error.data as
    | { data?: { authHint?: string; scene?: string } }
    | undefined;

  return {
    authHint: data?.data?.authHint,
    scene: data?.data?.scene,
  };
}

/**
 * 二次认证响应错误拦截器工厂。
 *
 * <p>处理流程：
 * 1. 判断业务错误码是否为 SECONDARY_AUTH_REQUIRED（A20123）
 *    — 是 → 弹出二次认证弹窗，用户输入密码后调 API /api/auth/secondary-auth
 *           → 获取 token 后在原请求 header 注入 X-Secondary-Auth 并重放请求
 *    — 否 → 原样抛出，由后续拦截器处理
 *
 * <p>边界：
 * - 用户取消弹窗 → Promise reject 原始错误，不做重放
 * - 密码校验失败 → 弹窗再次显示，最多 3 次尝试，超次后 reject
 *
 * @returns ResponseInterceptorConfig —— 可注册到 requestClient.addResponseInterceptor()
 */
export function createSecondaryAuthResponseInterceptor(): ResponseInterceptorConfig {
  return {
    rejected: async (error: unknown) => {
      const authInfo = isSecondaryAuthError(error);
      if (!authInfo) {
        // 非二次认证错误，原样抛出
        return Promise.reject(error);
      }

      const axiosError = error as AxiosError;
      const originalConfig = axiosError.config as
        | (RequestClientConfig & { __secondaryAuthRetry?: boolean })
        | undefined;

      // 防止二次认证本身还再次触发 4xx/二次认证 无限循环
      if (!originalConfig || originalConfig.__secondaryAuthRetry) {
        logger.warn('二次认证请求本身未通过认证，终止重放');
        return Promise.reject(error);
      }

      // 记录重试标记
      originalConfig.__secondaryAuthRetry = true;

      try {
        const password = await openSecondaryAuthModal(authInfo.authHint);

        if (!password) {
          // 用户取消弹窗 → reject 原始错误，流程终止
          logger.debug('用户取消二次认证弹窗，终止重放');
          return Promise.reject(error);
        }

        // 调用二次认证 API，获取 token
        const authResult = await secondaryAuthApi({
          password,
          scene: authInfo.scene,
        });

        // 注入 token 到原请求 header 并放行重试
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers[HEADER_SECONDARY_AUTH] = authResult.token;

        logger.debug('二次认证通过，重放原始请求');

        // 使用 axios 实例直接 re-dispatch，避免进入 RequestClient.request 的拦截器链再次触发同一逻辑
        return axios.request(originalConfig);
      } catch (secondaryAuthError) {
        logger.warn('二次认证弹窗或 API 调用异常', secondaryAuthError);
        return Promise.reject(error);
      }
    },
  };
}

/**
 * 注册二次认证响应错误拦截器到共享 requestClient。
 *
 * <p>需在 initSharedRequest() 之后调用（即 setupAuth / onSetup 阶段）。
 *
 * @returns 拦截器清理函数（调用即移除拦截器）
 */
export function registerSecondaryAuthInterceptor(): () => void {
  const interceptorId = requestClient.addResponseInterceptor(
    createSecondaryAuthResponseInterceptor(),
  );

  logger.info('二次认证响应错误拦截器已注册');

  return () => {
    requestClient.removeResponseInterceptor(interceptorId);
    logger.info('二次认证响应错误拦截器已移除');
  };
}
