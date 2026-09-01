/**
 * importmap 缓存辅助函数
 *
 * CDN 模式下，jspm Generator 的安装结果会被缓存到
 * `node_modules/.cache/importmap/<hash>.json`，依赖列表未变时
 * 直接复用，跳过公网 CDN 解析。TTL 默认 7 天，可通过环境变量
 * `IMPORTMAP_CACHE_TTL`（毫秒）调整，`IMPORTMAP_NO_CACHE=1` 可强制跳过。
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { consola as logger } from 'consola';

import type { pluginOptions } from './importmap';

/** 默认 CDN 供应商，未显式指定时使用 */
export const DEFAULT_PROVIDER = 'jspm.io';

/** importmap 缓存目录（相对项目根） */
export const CACHE_DIR = path.join('node_modules', '.cache', 'importmap');
/** 缓存默认 TTL：7 天（毫秒） */
export const DEFAULT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 计算依赖列表的缓存键。
 *
 * 键由依赖名+range、provider、env、inputMap 共同决定，
 * 任一变化都会生成不同的键，确保缓存与依赖声明一致。
 */
export function getCacheKey(
  deps: Array<{ name: string; range?: string }>,
  options: pluginOptions,
): string {
  const payload = {
    deps: deps
      .map((d) => `${d.name}@${d.range || 'latest'}`)
      .sort()
      .join(','),
    provider: options.defaultProvider || DEFAULT_PROVIDER,
    env: options.env,
    inputMap: options.inputMap,
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

/**
 * 读取缓存的 importmap（若存在且未过期）。
 *
 * @returns 缓存的 importmap 对象，或 null（无缓存/已过期/解析失败）
 */
export function readCachedImportMap(cacheKey: string): unknown | null {
  const cacheFile = path.join(process.cwd(), CACHE_DIR, `${cacheKey}.json`);
  if (!existsSync(cacheFile)) return null;

  try {
    const raw = JSON.parse(readFileSync(cacheFile, 'utf-8')) as {
      cachedAt: number;
      importmap: unknown;
    };
    const ttl = Number(process.env.IMPORTMAP_CACHE_TTL) || DEFAULT_CACHE_TTL_MS;
    if (Date.now() - raw.cachedAt > ttl) {
      logger.debug(`Cache expired for key ${cacheKey}`);
      return null;
    }
    return raw.importmap;
  } catch (err) {
      logger.warn(`Failed to read cache:`, err);
    return null;
  }
}

/**
 * 将 importmap 写入磁盘缓存。
 *
 * 静默失败：缓存写入不应阻断构建流程。
 */
export function writeCachedImportMap(cacheKey: string, importmap: unknown): void {
  try {
    const cacheDir = path.join(process.cwd(), CACHE_DIR);
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    const cacheFile = path.join(cacheDir, `${cacheKey}.json`);
    writeFileSync(
      cacheFile,
      JSON.stringify({ cachedAt: Date.now(), importmap }, null, 2),
    );
    logger.debug(`Cache written: ${cacheFile}`);
  } catch (err) {
    logger.warn(`Failed to write cache:`, err);
  }
}

/** 是否跳过缓存（环境变量 IMPORTMAP_NO_CACHE=1 时为 true） */
export function isCacheDisabled(): boolean {
  return process.env.IMPORTMAP_NO_CACHE === '1';
}
