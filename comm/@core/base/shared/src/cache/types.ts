/**
 * 缓存层类型契约定义，约束存储管理器的接口形态。
 *
 * @path comm\@core\base\shared\src\cache\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */
type StorageType = 'localStorage' | 'sessionStorage';

interface StorageValue<T> {
  data: T;
  expiry: null | number;
}

interface IStorageCache {
  clear(): void;
  getItem<T>(key: string): null | T;
  key(index: number): null | string;
  length(): number;
  removeItem(key: string): void;
  setItem<T>(key: string, value: T, expiryInMinutes?: number): void;
}

export type { IStorageCache, StorageType, StorageValue };
