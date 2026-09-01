/**
 * 应用运行时配置的环境变量解析器。
 *
 * 区分生产/开发环境，从全局变量或 import.meta.env 中提取接口地址、
 * 钉钉鉴权配置等信息，构造统一的 ApplicationConfig 对象。
 *
 * @path comm\effects\hooks\src\use-app-config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  ApplicationConfig,
  YDSZAdminProAppConfigRaw,
} from '@ydsz/types/global';

/**
 * 由 vite-inject-app-config 注入的全局配置。
 *
 * @param env - import.meta.env 环境变量对象
 * @param isProduction - 是否生产构建
 * @returns 解析后的应用配置（apiURL / auth 等）
 */
export function useAppConfig(
  env: Record<string, string>,
  isProduction: boolean,
): ApplicationConfig {
  // 生产环境下，直接使用 window._YDSZ_ADMIN_PRO_APP_CONF_ 全局变量
  const config = isProduction
    ? window._YDSZ_ADMIN_PRO_APP_CONF_
    : (env as YDSZAdminProAppConfigRaw);

  const {
    VITE_GLOB_API_URL,
    VITE_GLOB_AUTH_DINGDING_CORP_ID,
    VITE_GLOB_AUTH_DINGDING_CLIENT_ID,
  } = config;

  const applicationConfig: ApplicationConfig = {
    apiURL: VITE_GLOB_API_URL,
    auth: {},
  };
  if (VITE_GLOB_AUTH_DINGDING_CORP_ID && VITE_GLOB_AUTH_DINGDING_CLIENT_ID) {
    applicationConfig.auth.dingding = {
      clientId: VITE_GLOB_AUTH_DINGDING_CLIENT_ID,
      corpId: VITE_GLOB_AUTH_DINGDING_CORP_ID,
    };
  }

  return applicationConfig;
}
