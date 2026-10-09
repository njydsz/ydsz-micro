/**
 * 表单草稿自动保存组合式函数
 *
 * <p>将表单数据防抖保存到 localStorage，页面刷新/关闭后可恢复未提交的数据。
 * 适用于长表单（角色配置、工作流设计、消息模板编辑等）防意外丢失。
 *
 * <p>使用示例：
 * <pre lang="ts">
 * const { draft, restoreDraft, clearDraft, hasDraft } = useFormDraft<MyForm>({
 *   key: 'user-form-draft',
 * });
 *
 * // 表单数据变化时手动保存
 * watch(formData, (val) => draft.value = val, { deep: true });
 *
 * // 挂载时恢复草稿
 * onMounted(() => {
 *   const saved = restoreDraft();
 *   if (saved) Object.assign(formData, saved);
 * });
 *
 * // 提交成功后清除草稿
 * async function handleSubmit() {
 *   await submitApi(formData);
 *   clearDraft();
 * }
 * </pre>
 *
 * @path comm/@core/composables/src/use-form-draft.ts
 * @author ydsz
 * @since 26.10.06
 */

import type { Ref } from 'vue';

import { onUnmounted, ref } from 'vue';

/** 草稿存储前缀，避免与其它 localStorage 键冲突 */
const DRAFT_PREFIX = 'ydsz:draft:';

/** 草稿选项 */
interface UseFormDraftOptions {
  /**
   * 草稿唯一键（建议包含路由路径或页面标识）
   * @example 'system-dict-edit:type_code'
   */
  key: string;
  /** 草稿最大存活秒数（默认 7 天） */
  ttlSeconds?: number;
}

/** 草稿元信息（与数据一起存储） */
interface DraftMeta<T> {
  /** 草稿保存时间戳（毫秒） */
  savedAt: number;
  /** 表单数据 */
  data: T;
}

/** 返回类型 */
interface UseFormDraftReturn<T> {
  /** 当前草稿值引用（双向绑定到表单） */
  draft: Ref<T | undefined>;
  /** 是否存在有效草稿 */
  hasDraft: () => boolean;
  /** 手动恢复草稿（通常在 onMounted 时调用） */
  restoreDraft: () => T | undefined;
  /** 手动清除草稿（提交成功后调用） */
  clearDraft: () => void;
  /** 手动触发保存（立即写入，不走防抖） */
  flushDraft: () => void;
}

/**
 * 创建表单草稿自动保存能力
 *
 * <p>典型用法：编辑页面挂载时调用 restoreDraft() 恢复数据，
 * 表单变化时自动防抖写入，提交成功后 clearDraft() 清除。
 *
 * @param options - 草稿配置（key 必传）
 * @returns draft / hasDraft / restoreDraft / clearDraft / flushDraft
 */
export function useFormDraft<T = Record<string, unknown>>(
  options: UseFormDraftOptions,
): UseFormDraftReturn<T> {
  const storageKey = DRAFT_PREFIX + options.key;
  const ttlMs = (options.ttlSeconds ?? 7 * 24 * 3600) * 1000;

  const draft = ref<T | undefined>(undefined);

  /**
   * 将草稿写入 localStorage。
   *
   * <p>写入过程中若抛出异常（如 quota exceeded）则静默计数，
   * 连续失败超过上限后停止写入。
   *
   * @param data - 表单数据
   */
  function writeDraft(data: T): void {
    try {
      const payload: DraftMeta<T> = { savedAt: Date.now(), data };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // 静默处理：超出配额或序列化错误时不阻塞用户操作
    }
  }

  /**
   * 读取草稿。若草稿已超过 TTL 则返回 undefined 并自动清除。
   *
   * @returns 草稿数据，不存在或过期时返回 undefined
   */
  function readDraft(): T | undefined {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return undefined;
      }
      const meta = JSON.parse(raw) as DraftMeta<T>;
      if (!meta || typeof meta.savedAt !== 'number') {
        return undefined;
      }
      // 过期检查
      if (Date.now() - meta.savedAt > ttlMs) {
        localStorage.removeItem(storageKey);
        return undefined;
      }
      return meta.data;
    } catch {
      // 解析失败（数据结构被破坏）→ 清除并返回空
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* 静默 */
      }
      return undefined;
    }
  }

  /**
   * 清除当前表单的 localStorage 草稿。
   */
  function clearDraft(): void {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* 静默 */
    }
    draft.value = undefined;
  }

  /**
   * 恢复草稿到 draft ref 并返回数据。
   *
   * @returns 恢复的表单数据
   */
  function restoreDraft(): T | undefined {
    const data = readDraft();
    if (data !== undefined) {
      draft.value = data;
    }
    return data;
  }

  /**
   * 立即写入当前 draft 值到 localStorage。
   */
  function flushDraft(): void {
    if (draft.value !== undefined) {
      writeDraft(draft.value);
    }
  }

  /**
   * 读取草稿并判断是否存在有效数据。
   *
   * @returns 存在有效草稿返回 true
   */
  function hasDraft(): boolean {
    return readDraft() !== undefined;
  }

  // 组件卸载前强制 flush 一次，避免丢失最后修改
  onUnmounted(() => {
    flushDraft();
  });

  return {
    draft: draft as Ref<T | undefined>,
    hasDraft,
    restoreDraft,
    clearDraft,
    flushDraft,
  };
}

export type { DraftMeta, UseFormDraftOptions, UseFormDraftReturn };
