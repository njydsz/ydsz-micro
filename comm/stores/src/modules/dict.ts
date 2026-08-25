/**
 * dict Pinia 状态管理 — 全局数据字典缓存
 *
 * 采用 Composition API（setup）语法，符合云顶编码规范 §8.1。
 *
 * @path comm\stores\src\modules\dict.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 提供按字典类型（typeCode）分组的全局缓存，支持：
 * - 懒加载：首次访问某字典类型时才请求
 * - TTL 过期：默认 10 分钟，过期后重新拉取
 * - 手动失效：字典维护后可调用 invalidate 清理缓存
 * - 多应用共享：所有子应用共用同一份缓存，避免重复请求
 *
 * 加载器通过 {@link setDictLoader} 注入（由应用层提供 requestClient 实现），
 * 保持本包不依赖 @ydsz/request，遵守包边界约束。
 */
import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('DictStore');

/** 字典项数据结构（对齐后端 DictItemVO） */
export interface DictItem {
  /** 主键 */
  id: string;
  /** 字典类型编码 */
  typeCode: string;
  /** 字典项编码 */
  itemCode: string;
  /** 字典项文本 */
  itemText: string;
  /** 字典项值 */
  itemValue: string;
  /** 排序 */
  sort: number;
  /** 状态：1 启用 0 禁用 */
  status?: number;
  /** 扩展字段（后端可能返回附加属性，避免索引签名丢失可读性） */
  [key: string]: unknown;
}

/** 字典加载器函数签名：传入类型编码，返回字典项数组 */
export type DictLoader = (typeCode: string) => Promise<DictItem[]>;

interface DictCacheEntry {
  /** 缓存数据 */
  items: DictItem[];
  /** 过期时间戳 */
  expiresAt: number;
  /** 是否正在加载（防止并发重复请求） */
  loading?: Promise<DictItem[]>;
}

/** 默认 TTL：10 分钟 */
const DEFAULT_TTL = 10 * 60 * 1000;

/**
 * @zh_CN 数据字典缓存 store
 */
export const useDictStore = defineStore(
  'core-dict',
  () => {
    /** typeCode → 缓存条目 */
    const cache = ref<Record<string, DictCacheEntry>>({});
    /** 正在加载的字典类型集合 */
    const loadingTypes = ref<Set<string>>(new Set());
    /** 注入的加载器 */
    const loader = ref<DictLoader | null>(null);

    /**
     * 获取某字典类型的缓存项（未加载返回空数组，不触发请求）
     */
    const getItems = computed(() => {
      return (typeCode: string): DictItem[] => {
        const entry = cache.value[typeCode];
        if (!entry || entry.expiresAt < Date.now()) {
          return [];
        }
        return entry.items;
      };
    });

    /**
     * 注入字典加载器（应用启动时调用一次）
     *
     * @param dictLoader - 根据 typeCode 返回字典项数组的异步函数
     */
    function setDictLoader(dictLoader: DictLoader) {
      loader.value = dictLoader;
    }

    /**
     * 确保某字典类型已加载；未加载或已过期时异步拉取。
     *
     * @param typeCode - 字典类型编码
     * @param force - 强制刷新（忽略缓存与 TTL）
     * @returns 字典项数组
     */
    async function ensureLoaded(typeCode: string, force = false): Promise<DictItem[]> {
      const cached = cache.value[typeCode];
      if (!force && cached && cached.expiresAt >= Date.now()) {
        return cached.items;
      }

      // 并发去重：同一字典类型同时只发一次请求
      if (cached?.loading) {
        return cached.loading;
      }

      if (!loader.value) {
        logger.warn('未注入字典加载器，请先调用 setDictLoader()');
        return [];
      }

      const loading = loader.value(typeCode)
        .then((items) => {
          cache.value[typeCode] = {
            items,
            expiresAt: Date.now() + DEFAULT_TTL,
          };
          return items;
        })
        .finally(() => {
          loadingTypes.value.delete(typeCode);
          delete cache.value[typeCode]?.loading;
        });

      // 先占位 loading，防止重复请求
      if (cache.value[typeCode]) {
        cache.value[typeCode].loading = loading;
      } else {
        cache.value[typeCode] = {
          items: [],
          expiresAt: 0,
          loading,
        };
      }
      loadingTypes.value.add(typeCode);

      return loading;
    }

    /**
     * 同步获取字典项；若未加载则异步拉取后返回（await 使用）。
     *
     * @param typeCode - 字典类型编码
     */
    async function getDictItems(typeCode: string): Promise<DictItem[]> {
      const cached = cache.value[typeCode];
      if (cached && cached.expiresAt >= Date.now()) {
        return cached.items;
      }
      return ensureLoaded(typeCode);
    }

    /**
     * 使某字典类型缓存失效（字典维护后调用）
     */
    function invalidate(typeCode?: string) {
      if (typeCode) {
        delete cache.value[typeCode];
      } else {
        cache.value = {};
      }
    }

    /**
     * 清理过期缓存条目
     */
    function prune() {
      const now = Date.now();
      for (const key of Object.keys(cache.value)) {
        const entry = cache.value[key];
        if (entry && entry.expiresAt < now && !entry.loading) {
          delete cache.value[key];
        }
      }
    }

    return {
      cache,
      ensureLoaded,
      getDictItems,
      getItems,
      invalidate,
      loader,
      loadingTypes,
      prune,
      setDictLoader,
    };
  },
);

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useDictStore, hot));
}
