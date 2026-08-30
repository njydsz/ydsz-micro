/**
 * 多级缓存实现
 *
 * <p>L1（内存 LRU）→ L2（Redis）→ L3（源数据）三级缓存架构。
 * <p>用于 BFF 层或前端高频数据的缓存优化。
 *
 * <p>使用方式:
 * <pre>{@code
 *   const cache = new MultiLevelCache({
 *     l1TTL: 5 * 60 * 1000,  // 5 分钟
 *     l2TTL: 15 * 60 * 1000, // 15 分钟
 *     prefix: 'bff:dashboard',
 *   });
 *
 *   const data = await cache.get('overview', async () => {
 *     return await fetchDashboardOverview();
 *   });
 * }</pre>
 *
 * @path comm/effects/request/src/multi-level-cache.ts
 * @author ydsz-team
 * @since 4.0.0
 * @see docs/bff-layer-design.md
 */

import type { Redis } from 'ioredis';

/**
 * LRU 缓存节点
 */
interface LRUNode<T> {
  key: string;
  value: T;
  timestamp: number;
  prev: LRUNode<T> | null;
  next: LRUNode<T> | null;
}

/**
 * 多级缓存配置
 */
export interface MultiLevelCacheOptions {
  /** L1 内存缓存 TTL（毫秒），默认 5 分钟 */
  l1TTL?: number;
  /** L2 Redis 缓存 TTL（毫秒），默认 15 分钟 */
  l2TTL?: number;
  /** L1 最大条目数，默认 100 */
  l1MaxSize?: number;
  /** 缓存 key 前缀 */
  prefix?: string;
  /** Redis 客户端实例 */
  redis?: Redis;
  /** 是否启用 L1 缓存 */
  enableL1?: boolean;
  /** 是否启用 L2 缓存 */
  enableL2?: boolean;
}

/**
 * 缓存命中来源
 */
export type CacheHitSource = 'L1_HIT' | 'L2_HIT' | 'L3_MISS';

/**
 * 缓存结果
 */
export interface CacheResult<T> {
  data: T;
  source: CacheHitSource;
  duration: number;
}

/**
 * 多级缓存实现
 *
 * <p>提供 L1（内存 LRU）→ L2（Redis）→ L3（回源）三级缓存。
 * <p>符合云顶编码规范 §5 性能规范。
 */
export class MultiLevelCache {
  private readonly l1TTL: number;
  private readonly l2TTL: number;
  private readonly l1MaxSize: number;
  private readonly prefix: string;
  private readonly redis?: Redis;
  private readonly enableL1: boolean;
  private readonly enableL2: boolean;

  // L1 LRU 缓存
  private l1Cache: Map<string, LRUNode<unknown>>;
  private l1Head: LRUNode<unknown>;
  private l1Tail: LRUNode<unknown>;

  constructor(options: MultiLevelCacheOptions = {}) {
    this.l1TTL = options.l1TTL ?? 5 * 60 * 1000;
    this.l2TTL = options.l2TTL ?? 15 * 60 * 1000;
    this.l1MaxSize = options.l1MaxSize ?? 100;
    this.prefix = options.prefix ?? 'bff';
    this.redis = options.redis;
    this.enableL1 = options.enableL1 ?? true;
    this.enableL2 = options.enableL2 ?? !!options.redis;

    // 初始化 LRU 双向链表
    this.l1Cache = new Map();
    this.l1Head = { key: '', value: null, timestamp: 0, prev: null, next: null };
    this.l1Tail = { key: '', value: null, timestamp: 0, prev: null, next: null };
    this.l1Head.next = this.l1Tail;
    this.l1Tail.prev = this.l1Head;
  }

  /**
   * 获取缓存数据
   *
   * @param key 缓存 key
   * @param fetcher 回源函数
   * @returns 缓存结果
   */
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<CacheResult<T>> {
    const startTime = Date.now();
    const fullKey = this.buildKey(key);

    // L1 查询
    if (this.enableL1) {
      const l1Value = this.getL1<T>(fullKey);
      if (l1Value !== undefined) {
        return {
          data: l1Value,
          source: 'L1_HIT',
          duration: Date.now() - startTime,
        };
      }
    }

    // L2 查询
    if (this.enableL2 && this.redis) {
      const l2Value = await this.getL2<T>(fullKey);
      if (l2Value !== undefined) {
        // 回填 L1
        this.setL1(fullKey, l2Value);
        return {
          data: l2Value,
          source: 'L2_HIT',
          duration: Date.now() - startTime,
        };
      }
    }

    // L3 回源
    const data = await fetcher();

    // 回填缓存
    this.setL1(fullKey, data);
    await this.setL2(fullKey, data);

    return {
      data,
      source: 'L3_MISS',
      duration: Date.now() - startTime,
    };
  }

  /**
   * 主动失效缓存
   *
   * @param key 缓存 key
   */
  async invalidate(key: string): Promise<void> {
    const fullKey = this.buildKey(key);

    // 清除 L1
    this.deleteL1(fullKey);

    // 清除 L2
    if (this.redis) {
      await this.redis.del(fullKey);
    }
  }

  /**
   * 批量失效缓存（按前缀）
   *
   * @param pattern key 模式
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const fullPattern = this.buildKey(pattern);

    // 清除 L1 匹配项
    for (const key of this.l1Cache.keys()) {
      if (key.includes(fullPattern)) {
        this.deleteL1(key);
      }
    }

    // 清除 L2 匹配项
    if (this.redis) {
      const keys = await this.redis.keys(`${fullPattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { l1Size: number; l1MaxSize: number } {
    return {
      l1Size: this.l1Cache.size,
      l1MaxSize: this.l1MaxSize,
    };
  }

  // ==================== L1 内存缓存 ====================

  /**
   * L1 获取
   */
  private getL1<T>(key: string): T | undefined {
    const node = this.l1Cache.get(key);
    if (!node) return undefined;

    // 检查是否过期
    if (Date.now() - node.timestamp > this.l1TTL) {
      this.deleteL1(key);
      return undefined;
    }

    // 移到链表头部（最近使用）
    this.moveToHead(node);
    return node.value as T;
  }

  /**
   * L1 设置
   */
  private setL1<T>(key: string, value: T): void {
    const existing = this.l1Cache.get(key);
    if (existing) {
      existing.value = value;
      existing.timestamp = Date.now();
      this.moveToHead(existing);
      return;
    }

    // 容量检查
    if (this.l1Cache.size >= this.l1MaxSize) {
      this.evictL1();
    }

    const node: LRUNode<unknown> = {
      key,
      value,
      timestamp: Date.now(),
      prev: null,
      next: null,
    };

    this.l1Cache.set(key, node);
    this.addToHead(node);
  }

  /**
   * L1 删除
   */
  private deleteL1(key: string): void {
    const node = this.l1Cache.get(key);
    if (node) {
      this.removeNode(node);
      this.l1Cache.delete(key);
    }
  }

  /**
   * L1 淘汰（移除最久未使用）
   */
  private evictL1(): void {
    const tail = this.l1Tail.prev;
    if (tail && tail !== this.l1Head) {
      this.removeNode(tail);
      this.l1Cache.delete(tail.key);
    }
  }

  // ==================== LRU 链表操作 ====================

  private addToHead(node: LRUNode<unknown>): void {
    node.prev = this.l1Head;
    node.next = this.l1Head.next;
    if (this.l1Head.next) {
      this.l1Head.next.prev = node;
    }
    this.l1Head.next = node;
  }

  private removeNode(node: LRUNode<unknown>): void {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
  }

  private moveToHead(node: LRUNode<unknown>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  // ==================== L2 Redis 缓存 ====================

  /**
   * L2 获取
   */
  private async getL2<T>(key: string): Promise<T | undefined> {
    if (!this.redis) return undefined;

    try {
      const raw = await this.redis.get(key);
      if (!raw) return undefined;

      const parsed = JSON.parse(raw) as { value: T; timestamp: number };

      // 检查是否过期
      if (Date.now() - parsed.timestamp > this.l2TTL) {
        await this.redis.del(key);
        return undefined;
      }

      return parsed.value;
    } catch {
      return undefined;
    }
  }

  /**
   * L2 设置
   */
  private async setL2<T>(key: string, value: T): Promise<void> {
    if (!this.redis) return;

    try {
      const data = JSON.stringify({
        value,
        timestamp: Date.now(),
      });
      await this.redis.setex(key, Math.floor(this.l2TTL / 1000), data);
    } catch {
      // Redis 写入失败不影响主流程
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 构建完整缓存 key
   */
  private buildKey(key: string): string {
    return `${this.prefix}:${key}`;
  }
}

/**
 * 创建多级缓存实例的工厂函数
 *
 * @param options 缓存配置
 * @returns MultiLevelCache 实例
 */
export function createMultiLevelCache(options: MultiLevelCacheOptions = {}): MultiLevelCache {
  return new MultiLevelCache(options);
}
