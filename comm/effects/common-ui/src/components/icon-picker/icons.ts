/**
 * 图标选择器的图标数据源：从 Iconify 拉取图标集并按前缀缓存。
 *
 * 存在的意义是把「图标数据获取」从选择器组件中剥离，顺带解决两个问题：
 * - **并发去重**：页面上常有多个图标选择器同时指向同一图标集，
 *   用 PENDING_REQUESTS 缓存 Promise 本身（而非结果），让并发调用共享一次网络请求；
 * - **跨实例共享**：ICONS_MAP 是模块级缓存，一次会话内同一前缀只拉一次，
 *   重复开关选择器不再走网络。
 *
 * 本模块不感知 Vue，可独立于 UI 层替换为本地图标清单或内网图标服务。
 *
 * @path comm\effects\common-ui\src\components\icon-picker\icons.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Recordable } from '@ydsz/types';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('icons');
/**
 * 一个缓存对象，在不刷新页面时，无需重复请求远程接口
 */
export const ICONS_MAP: Recordable<string[]> = {};

interface IconifyResponse {
  prefix: string;
  total: number;
  title: string;
  uncategorized?: string[];
  categories?: Recordable<string[]>;
  aliases?: Recordable<string>;
}

const PENDING_REQUESTS: Recordable<Promise<string[]>> = {};

/**
 * 通过Iconify接口获取图标集数据。
 * 同一时间多个图标选择器同时请求同一个图标集时，实际上只会发起一次请求（所有请求共享同一份结果）。
 * 请求结果会被缓存，刷新页面前同一个图标集不会再次请求
 * @param prefix 图标集名称
 * @returns 图标集中包含的所有图标名称
 */
export async function fetchIconsData(prefix: string): Promise<string[]> {
  if (Reflect.has(ICONS_MAP, prefix) && ICONS_MAP[prefix]) {
    return ICONS_MAP[prefix];
  }
  if (Reflect.has(PENDING_REQUESTS, prefix) && PENDING_REQUESTS[prefix]) {
    return PENDING_REQUESTS[prefix];
  }
  PENDING_REQUESTS[prefix] = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000 * 10);
      // @infra-fetch 基础设施层直用：Iconify 外部第三方 CDN 图标元数据拉取，
      // 无统一请求客户端上下文（跨域外部域 + AbortController 超时控制），云顶规范 §6.1 例外条款。
      const response: IconifyResponse = await fetch(
        `https://api.iconify.design/collection?prefix=${prefix}`,
        { signal: controller.signal },
      ).then((res) => res.json());
      clearTimeout(timeoutId);
      const list = response.uncategorized || [];
      if (response.categories) {
        for (const category in response.categories) {
          list.push(...(response.categories[category] || []));
        }
      }
      ICONS_MAP[prefix] = list.map((v) => `${prefix}:${v}`);
    } catch (error) {
      logger.error(`Failed to fetch icons for prefix ${prefix}:`, error);
      return [] as string[];
    }
    return ICONS_MAP[prefix];
  })();
  return PENDING_REQUESTS[prefix];
}
