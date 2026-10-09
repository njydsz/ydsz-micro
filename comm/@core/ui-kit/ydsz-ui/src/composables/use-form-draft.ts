/**
 * useFormDraft —— 表单草稿自动保存 composable。
 *
 * <p>对标飞书审批/钉钉 OA，防止用户关页/崩溃导致表单数据丢失。
 *
 * <p>设计要点：
 * <ul>
 *   <li>key 隔离：每个 formId 独立存储，前缀 ydsz:form-draft:{formId}</li>
 *   <li>过期策略：默认 7 天自动过期，避免脏数据长期残留</li>
 *   <li>容错静默：JSON 解析失败、localStorage 不可用时静默降级</li>
 *   <li>定时保存：setInterval 周期写入 + onBeforeUnmount 清理</li>
 *   <li>onChange 模式：监听表单变化后重置倒计时（可选）</li>
 * </ul>
 *
 * <p>典型用法：
 * <pre>
 *   const draft = useFormDraft({
 *     formId: 'leave-apply',
 *     getData: () => formValues.value,
 *     setData: (d) => { formValues.value = d as typeof formValues.value },
 *   });
 *   // 挂载后启动自动保存
 *   onMounted(() => draft.start());
 *   // 恢复草稿
 *   onMounted(() => { draft.restore(); });
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-form-draft.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { onBeforeUnmount, ref, type Ref } from 'vue';

/* ============================================================ */
/* 常量                                                          */
/* ============================================================ */

/** localStorage key 前缀 */
const STORAGE_PREFIX = 'ydsz:form-draft:';

/** 默认自动保存间隔（毫秒）—— 30 秒 */
const DEFAULT_INTERVAL_MS = 30 * 1000;

/** 默认过期时间（毫秒）—— 7 天 */
const DEFAULT_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;

/** onChange 防抖延迟（毫秒）—— 变化后等待 1s 再重置倒计时 */
const CHANGE_RESET_DEBOUNCE_MS = 1000;

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 草稿数据结构（localStorage 存储形态） */
interface DraftPayload<T> {
  /** 表单数据 */
  data: T;
  /** 更新时间戳（毫秒级 Date.now()） */
  updatedAt: number;
  /** 过期时间戳（毫秒级 Date.now()） */
  expireAt: number;
}

/** useFormDraft 参数 */
export interface UseFormDraftOptions<T = Record<string, unknown>> {
  /** 唯一标识，用于 localStorage key */
  formId: string;
  /** 获取表单数据的函数 */
  getData: () => T;
  /** 设置表单数据的函数 */
  setData: (data: T) => void;
  /**
   * 自动保存间隔（毫秒），默认 30000ms（30s）。
   * 传入 0 则禁用自动周期性保存，仅手动调用 save() 保存。
   */
  interval?: number;
  /** localStorage key 前缀，默认 'ydsz:form-draft:' */
  keyPrefix?: string;
  /** 过期时间（毫秒），默认 7 天 */
  expireMs?: number;
  /**
   * 是否启用 onChange 模式。
   * 开启后，当表单数据变化时重置自动保存倒计时，实现"用户活跃时更频繁保存"。
   * 默认 false。
   */
  resetOnChange?: boolean;
}

/** useFormDraft 返回句柄 */
export interface UseFormDraftReturn {
  /** 是否有有效草稿 */
  hasDraft: Ref<boolean>;
  /** 草稿更新时间戳（毫秒），无草稿时为 null */
  draftTime: Ref<number | null>;
  /** 手动保存草稿 */
  save: () => void;
  /** 清除草稿 */
  clear: () => void;
  /**
   * 恢复草稿。
   * @return 恢复成功返回 true，无有效草稿返回 false
   */
  restore: () => boolean;
  /** 启动自动保存定时器 */
  start: () => void;
  /** 停止自动保存定时器 */
  stop: () => void;
  /** 清理资源（清除定时器），建议在 onBeforeUnmount 中调用 */
  dispose: () => void;
  /**
   * 通知表单数据已变化（仅在 resetOnChange=true 时需要）。
   * 应在表单数据变化的 watch 回调中调用此方法。
   */
  notifyChanged: () => void;
}

/* ============================================================ */
/* 工具函数                                                       */
/* ============================================================ */

/**
 * 安全读取 localStorage。
 *
 * @param key - 完整 key
 * @return 原始字符串或 null
 */
function safeReadStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage 不可用时（隐私模式、SSR 等）静默降级
    return null;
  }
}

/**
 * 安全写入 localStorage。
 *
 * @param key - 完整 key
 * @param value - 序列化后的字符串
 */
function safeWriteStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // quota exceeded 等写入失败时静默降级
  }
}

/**
 * 安全移除 localStorage 项。
 *
 * @param key - 完整 key
 */
function safeRemoveStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * 解析草稿数据。
 *
 * @param raw - JSON 字符串
 * @param expireMs - 过期时间（毫秒），用于计算是否过期
 * @return 解析后的 DraftPayload 或 null
 */
function parseDraft<T>(raw: string | null, expireMs: number): DraftPayload<T> | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as DraftPayload<T>;
    // 结构校验
    if (!parsed || typeof parsed !== 'object' || typeof parsed.updatedAt !== 'number') {
      return null;
    }
    // 过期检查
    const expireTime = parsed.expireAt ?? parsed.updatedAt + expireMs;
    if (Date.now() > expireTime) {
      return null;
    }
    return parsed;
  } catch {
    // JSON 格式化失败时降级返回 null
    return null;
  }
}

/* ============================================================ */
/* useFormDraft                                                   */
/* ============================================================ */

/**
 * useFormDraft —— 表单草稿自动保存 composable。
 *
 * @param options - 配置项
 * @return 草稿管理 API
 */
export function useFormDraft<T = Record<string, unknown>>(
  options: UseFormDraftOptions<T>,
): UseFormDraftReturn {
  const {
    formId,
    getData,
    setData,
    interval = DEFAULT_INTERVAL_MS,
    keyPrefix = STORAGE_PREFIX,
    expireMs = DEFAULT_EXPIRE_MS,
    resetOnChange = false,
  } = options;

  const storageKey = `${keyPrefix}${formId}`;

  /* ----- 状态 ----- */
  const hasDraft = ref<boolean>(false);
  const draftTime = ref<number | null>(null);

  /* ----- 定时器 ----- */
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  let changeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /* ----- 内部方法 ----- */

  /**
   * 更新草稿状态标记（从 localStorage 读取）。
   */
  function refreshDraftMeta(): void {
    const raw = safeReadStorage(storageKey);
    const parsed = parseDraft<T>(raw, expireMs);
    if (parsed) {
      hasDraft.value = true;
      draftTime.value = parsed.updatedAt;
    } else {
      hasDraft.value = false;
      draftTime.value = null;
    }
  }

  /* ----- 公开方法 ----- */

  /** 手动保存草稿 */
  function save(): void {
    try {
      const data = getData();
      const now = Date.now();
      const payload: DraftPayload<T> = {
        data,
        updatedAt: now,
        expireAt: now + expireMs,
      };
      safeWriteStorage(storageKey, JSON.stringify(payload));
      hasDraft.value = true;
      draftTime.value = now;
    } catch {
      // 序列化失败时静默降级
    }
  }

  /** 清除草稿 */
  function clear(): void {
    safeRemoveStorage(storageKey);
    hasDraft.value = false;
    draftTime.value = null;
  }

  /**
   * 恢复草稿。
   *
   * @return 恢复成功返回 true，无有效草稿返回 false
   */
  function restore(): boolean {
    const raw = safeReadStorage(storageKey);
    const parsed = parseDraft<T>(raw, expireMs);
    if (!parsed) {
      // 过期或无效，尝试清除
      if (raw) {
        clear();
      }
      return false;
    }
    try {
      setData(parsed.data);
      hasDraft.value = true;
      draftTime.value = parsed.updatedAt;
      return true;
    } catch {
      // 恢复失败时降级
      return false;
    }
  }

  /**
   * 启动自动保存定时器。
   */
  function start(): void {
    // 避免重复启动
    if (autoSaveTimer !== null) {
      return;
    }
    if (interval <= 0) {
      return;
    }
    autoSaveTimer = setInterval(() => {
      save();
    }, interval);
    // 刷新草稿状态
    refreshDraftMeta();
  }

  /**
   * 停止自动保存定时器。
   */
  function stop(): void {
    if (autoSaveTimer !== null) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  /**
   * 通知表单数据已变化。
   *
   * <p>在 resetOnChange=true 时调用，会重置自动保存倒计时，
   * 实现"用户活跃期间更频繁保存"的效果。
   */
  function notifyChanged(): void {
    if (!resetOnChange || interval <= 0) {
      return;
    }
    // 保存后短暂防抖，避免频繁写入
    if (changeDebounceTimer !== null) {
      clearTimeout(changeDebounceTimer);
    }
    changeDebounceTimer = setTimeout(() => {
      save();
      changeDebounceTimer = null;
      // 如果定时器已启动，重置倒计时
      if (autoSaveTimer !== null) {
        stop();
        start();
      }
    }, CHANGE_RESET_DEBOUNCE_MS);
  }

  /**
   * 清理资源：停止定时器、清除防抖。
   */
  function dispose(): void {
    stop();
    if (changeDebounceTimer !== null) {
      clearTimeout(changeDebounceTimer);
      changeDebounceTimer = null;
    }
  }

  /* ----- 自动清理 ----- */
  onBeforeUnmount(() => {
    dispose();
  });

  /* ----- 初始化：读取当前草稿状态 ----- */
  refreshDraftMeta();

  return {
    clear,
    dispose,
    draftTime,
    hasDraft,
    notifyChanged,
    restore,
    save,
    start,
    stop,
  };
}
