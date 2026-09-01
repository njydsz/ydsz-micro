/**
 * 功能开关远程加载器 — 内置「从后端配置接口拉取」的标准实现。
 *
 * <p>对标 LaunchDarkly / 美团 Raptor FeatureToggle：服务端为开关的事实来源，
 * 前端通过 HTTP 接口拉取并按客户端版本过滤，实现「灰度按版本精准放量」。
 *
 * <p>提供的远程加载器：
 * <ul>
 *   <li>{@link createApiFeatureLoader} — 从后端 `/api/v1/feature` 端点拉取版本绑定的开关配置</li>
 * </ul>
 *
 * <p>后端契约（{@code YdszResponse<FeatureFlagApiResponse>}）：
 * <pre>
 * {
 *   "code": 200,
 *   "data": {
 *     "version": "1.0",
 *     "flags": {
 *       "new-dashboard": { "enabled": true, "requireClientVersion": ">=2.0.0" },
 *       "v2-api":        { "enabled": true, "requireClientVersion": ">=2.0.0" },
 *       "beta-agent":    { "enabled": false }
 *     }
 *   }
 * }
 * </pre>
 *
 * @path comm/@core/feature-flags/src/remote-loader.ts
 * @author ydsz-team
 * @since 4.1.0 (P1-8)
 */

import type { FeatureFlagValue } from './types';

import { createLogger } from '@YDSZ-core/shared/utils';
import { dedupRequest } from '@ydsz/request/request-client';

/** 远程 Feature Flag API 响应结构 */
export interface FeatureFlagApiResponse {
  /** API 版本（语义化版本，用于兼容性判断） */
  version: string;
  /** 开关配置映射：flagName → 配置详情 */
  flags: Record<string, FeatureFlagRemoteConfig>;
}

/** 单个开关远程配置 */
export interface FeatureFlagRemoteConfig {
  /** 是否启用 */
  enabled: boolean;
  /**
   * 客户端版本限制（可选）。
   *
   * <p>语义化版本范围表达式（如 `>=2.0.0`、`~1.5.0`、`^1.0.0`）。
   * 当前客户端版本不满足此范围时，此开关视为 "关闭"。
   */
  requireClientVersion?: string;
}

/** 内置远程加载器选项 */
export interface CreateApiFeatureLoaderOptions {
  /** 拉取开关配置的 API endpoint */
  endpoint?: string;
  /** 当前前端客户端版本（如 '2.1.0'），用于版本匹配过滤 */
  clientVersion?: string;
  /** 是否启用请求去重（默认 true：并发调用时仅发一次 HTTP） */
  dedup?: boolean;
  /** 拉取超时（毫秒），默认 5000 */
  timeout?: number;
}

const logger = createLogger('feature-flags:remote');

/**
 * 语义化版本范围解析器（精简版，覆盖常见表达式）。
 *
 * <p>支持格式：
 * <ul>
 *   <li>{@code 1.2.3} — 精确匹配</li>
 *   <li>{@code >=1.2.3} — 左边界</li>
 *   <li>{@code >1.2.3} — 严格左边界</li>
 *   <li>{@code <=1.2.3} — 右边界</li>
 *   <li>{@code <1.2.3} — 严格右边界</li>
 *   <li>{@code ~1.2.3} — 近似范围 [1.2.3, 1.3.0)</li>
 *   <li>{@code ^1.2.3} — 兼容范围 [1.2.3, 2.0.0)</li>
 * </ul>
 *
 * @param version 当前版本
 * @param range 范围表达式
 * @returns 当前版本是否在范围内
 */
function satisfiesRange(version: string, range: string): boolean {
  const v = parseSemver(version);
  if (!v) return false;

  const trimmed = range.trim();

  // 精确匹配
  if (/^\d+\.\d+\.\d+$/.test(trimmed)) {
    const t = parseSemver(trimmed);
    return t ? v.major === t.major && v.minor === t.minor && v.patch === t.patch : false;
  }

  // 前缀操作符匹配
  const match = trimmed.match(/^(>=|>|<=<|<|~|\^)(\d+\.\d+\.\d+)$/);
  if (!match) return false;
  const [, op, verStr] = match;
  const t = parseSemver(verStr);
  if (!t) return false;

  const cmp = compareSemver(v, t);

  switch (op) {
    case '>=': return cmp >= 0;
    case '>': return cmp > 0;
    case '<=': return cmp <= 0;
    case '<': return cmp < 0;
    case '~': return cmp >= 0 && v.major === t.major && v.minor === t.minor;
    case '^': return cmp >= 0 && v.major === t.major;
    default: return false;
  }
}

/** 解析语义化版本字符串 */
function parseSemver(s: string): { major: number; minor: number; patch: number } | null {
  const m = s.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/** 比较两个语义化版本（返回 -1 / 0 / 1） */
function compareSemver(
  a: { major: number; minor: number; patch: number },
  b: { major: number; minor: number; patch: number },
): number {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  return 0;
}

/**
 * 创建基于后端 API 的远程开关加载器（带版本过滤）。
 *
 * <p>工作流：
 * <ol>
 *   <li>向后端 {@code /api/v1/feature} 发起 GET 请求（自动去重）</li>
 *   <li>解析响应，按当前客户端版本过滤 {@code requireClientVersion}</li>
 *   <li>归一化为插件内部 {@code Record<string, FeatureFlagValue>} 格式</li>
 * </ol>
 *
 * <p>失败处理（三级降级）：
 * <ul>
 *   <li>HTTP 错误：返回空 map（保留本地默认）</li>
 *   <li>解析错误：返回空 map 并警告</li>
 *   <li>超时：返回空 map</li>
 * </ul>
 *
 * @param options 配置选项
 * @returns 符合 FeatureFlagsOptions.remoteLoader 签名的异步函数
 *
 * @example
 * ```ts
 * // 在子应用 bootstrap 中
 * await initFeatureFlags({
 *   env: import.meta.env,
 *   remoteLoader: createApiFeatureLoader({
 *     clientVersion: __APP_VERSION__,  // 构建时注入
 *   }),
 * });
 * ```
 */
export function createApiFeatureLoader(
  options: CreateApiFeatureLoaderOptions = {},
): () => Promise<Record<string, FeatureFlagValue>> {
  const {
    endpoint = '/api/v1/feature',
    clientVersion,
    dedup = true,
    timeout = 5000,
  } = options;

  // 闭包内缓存：避免应用不重新 init 时重复拉取
  let cachedResult: Record<string, FeatureFlagValue> | null = null;
  let cacheTimestamp = 0;
  const CACHE_TTL = 5 * 60 * 1000; // 5 分钟（生产环境配置变更相对低频）

  return async (): Promise<Record<string, FeatureFlagValue>> => {
    const now = Date.now();
    if (cachedResult && now - cacheTimestamp < CACHE_TTL) {
      return cachedResult;
    }

    const executor = async (url: string): Promise<Record<string, FeatureFlagValue>> => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          logger.warn(`[FeatureFlags] HTTP ${response.status} from ${url}`);
          return {};
        }

        const json = await response.json();
        const data = json.data as FeatureFlagApiResponse | undefined;

        if (!data || !data.flags) {
          logger.warn(`[FeatureFlags] Invalid response shape from ${url}`);
          return {};
        }

        // 版本过滤 + 归一化
        const result: Record<string, FeatureFlagValue> = {};
        for (const [name, cfg] of Object.entries(data.flags)) {
          if (cfg.requireClientVersion && clientVersion) {
            if (!satisfiesRange(clientVersion, cfg.requireClientVersion)) {
              // 客户端版本不满足此开关要求 → 视为关闭
              result[name] = false;
              continue;
            }
          }
          result[name] = cfg.enabled ? 'on' : 'off';
        }

        cachedResult = result;
        cacheTimestamp = now;
        logger.debug(`[FeatureFlags] Loaded ${Object.keys(result).length} flags from backend`);
        return result;
      } catch (err) {
        if (err instanceof Error && err.name === 'TimeoutError') {
          logger.warn(`[FeatureFlags] Remote loader timeout after ${timeout}ms`);
        } else {
          logger.warn(`[FeatureFlags] Remote loader error:`, err);
        }
        return {};
      }
    };

    return dedup ? dedupRequest('GET', endpoint, undefined, executor) : executor(endpoint);
  };
}
