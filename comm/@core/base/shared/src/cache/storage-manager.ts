/**
 * 类型安全的前端存储管理器，在原生 Storage 之上封装了 TTL 过期与命名空间隔离。
 *
 * 设计取舍：
 *   1. 过期采用「惰性删除」——只在 getItem 命中时判定并移除，不引入定时器轮询，
 *      避免后台标签页被定时器唤醒带来的额外开销。
 *   2. 值统一包装为 `{ value, expiry }` 再 JSON 序列化，因此 null / undefined /
 *      日期等类型可原样存取，代价是每个键多一层包装与少量体积。
 *   3. 命名空间靠 prefix 前缀实现，clear / clearExpiredItems 只处理本 prefix 下的键，
 *      保证多应用共享同一 origin 存储时互不干扰。
 *
 * 已知限制：超出浏览器配额（QuotaExceededError）时仅记录日志，不做 LRU 淘汰，
 * 写入会静默失败；容量敏感场景需调用方主动调用 clearExpiredItems 回收空间。
 *
 * @path comm\@core\base\shared\src\cache\storage-manager.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// v4.3.1 修复循环自引用：包内模块改相对导入，避免经包名绕回 index 形成环
import { createLogger } from '../utils/logger';
const logger = createLogger('storage-manager');
type StorageType = 'localStorage' | 'sessionStorage';

interface StorageManagerOptions {
  prefix?: string;
  storageType?: StorageType;
}

interface StorageItem<T> {
  expiry?: number;
  value: T;
}

class StorageManager {
  private prefix: string;
  private storage: Storage;

  /**
 * 构造存储管理器
 *
 * @param options.prefix - 键名前缀，用于多租户隔离
 * @param options.storageType - 底层存储引擎，默认 `localStorage`
 */
  constructor({
    prefix = '',
    storageType = 'localStorage',
  }: StorageManagerOptions = {}) {
    this.prefix = prefix;
    // 直接取 window 上的 Storage 实例而不做存在性保护：本包定位为纯前端工具，
    // SSR / 无 window 环境下应提前短路调用方，而不是在此静默降级为内存 Map
    this.storage =
      storageType === 'localStorage'
        ? window.localStorage
        : window.sessionStorage;
  }

  /**
 * 清空所有以当前 prefix 开头的存储项。
 */
  clear(): void {
    // 先收集再统一删除：Storage 的 key(i) 索引随 removeItem 实时前移，
    // 边遍历边删除会漏掉紧随被删键之后的那个键
    const keysToRemove: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => this.storage.removeItem(key));
  }

  /**
 * 清理所有已过期的 storage 项（通过 getItem 内部的过期判定触发）。
 */
  clearExpiredItems(): void {
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const shortKey = key.replace(this.prefix, '');
        // 借 getItem 的惰性过期判定顺带删除过期项，使过期规则只在 getItem 一处实现，
        // 避免两处判定规则漂移
        // FIXME(ydsz-team): 本方法当前无法真正清理过期项，需修复后移除说明 ——
        //  1) getItem 删除键后索引前移，而 i 仍自增，相邻过期项会被跳过；
        //  2) getFullKey 用 `${prefix}-${key}` 拼接，此处却只剥掉 prefix 未剥掉连接符，
        //     非空 prefix 时短键会残留前导 '-'，回查到的是 `prefix--key`（恒不存在）。
        // 修复方向：先收集键名再倒序删除，并改为剥离 `${prefix}-` 整体；需补非空 prefix 的用例
        this.getItem(shortKey);
      }
    }
  }

  /**
 * 获取存储项，自动处理过期与反序列化。
 *
 * @param key - 键名（不含前缀）
 * @param defaultValue - 不存在或已过期时返回的默认值
 * @returns 反序列化后的值，或默认值
 */
  getItem<T>(key: string, defaultValue: null | T = null): null | T {
    const fullKey = this.getFullKey(key);
    const itemStr = this.storage.getItem(fullKey);
    if (!itemStr) {
      return defaultValue;
    }

    try {
      const item: StorageItem<T> = JSON.parse(itemStr);
      if (item.expiry && Date.now() > item.expiry) {
        this.storage.removeItem(fullKey);
        return defaultValue;
      }
      return item.value;
    } catch (error) {
      logger.error(`Error parsing item with key "${fullKey}":`, error);
      // 解析失败即删除：脏数据无自愈可能，留存只会持续触发解析异常并占用配额，
      // 直接回收让下一次 setItem 重新写入干净结构
      this.storage.removeItem(fullKey);
      return defaultValue;
    }
  }

  /**
 * 移除指定存储项。
 *
 * @param key - 键名（不含前缀）
 */
  removeItem(key: string): void {
    const fullKey = this.getFullKey(key);
    this.storage.removeItem(fullKey);
  }

  /**
 * 写入存储项，可选设置 TTL 过期时间。
 *
 * @param key - 键名（不含前缀）
 * @param value - 值（会被 JSON 序列化）
 * @param ttl - 存活时间（毫秒），不传则永不过期
 */
  setItem<T>(key: string, value: T, ttl?: number): void {
    const fullKey = this.getFullKey(key);
    // 注意 ttl 走真值判断：传 0 会被当作「不设置过期」而永久保留，
    // 并非「立即过期」，需要立即失效请直接调用 removeItem
    const expiry = ttl ? Date.now() + ttl : undefined;
    const item: StorageItem<T> = { expiry, value };
    // 写入失败（多为 QuotaExceededError，Safari 无痕模式配额为 0）只记日志不抛出：
    // 存储属于可降级能力，抛错会中断调用方主流程，代价高于丢一条缓存
    try {
      this.storage.setItem(fullKey, JSON.stringify(item));
    } catch (error) {
      logger.error(`Error setting item with key "${fullKey}":`, error);
    }
  }

  /**
   * 获取完整的存储键
   * @param key 原始键
   * @returns 带前缀的完整键
   */
  private getFullKey(key: string): string {
    return `${this.prefix}-${key}`;
  }
}

export { StorageManager };
