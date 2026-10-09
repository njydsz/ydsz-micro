/**
 * use-dict-sse —— 字典变更 SSE 订阅 Composable
 *
 * <p>封装 shared-auth 的 {@link streamRequest}，订阅后端字典变更 SSE 端点，
 * 收到事件后通过 {@link emitDictChange} 广播到本地事件总线，驱动字典组件自动刷新缓存。
 *
 * <p>连接管理特性：
 * <ul>
 *   <li>指数退避自动重连（最大 5 次重试）</li>
 *   <li>浏览器 online/offline 感知</li>
 *   <li>单例引用计数 —— 多组件共享底层 SSE 连接</li>
 *   <li>Bearer Token 自动注入（HttpOnly Cookie 模式自动跳过）</li>
 * </ul>
 *
 * <p><b>注意：</b>本 composable 应在应用根组件或 layout 层调用一次，
 * 消费型组件通过 {@link onDictChange} 监听变更。
 *
 * <p><b>后端事件格式（DictSseEmitterController）：</b>
 * <pre>{@code
 * data: {"dictCode":"GENDER","eventType":"UPDATE","items":[...]}
 * }</pre>
 *
 * @path comm\effects\shared-business\src\composables\use-dict-sse.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { onMounted, onUnmounted, readonly, ref } from 'vue';

import { calculateRetryDelay, createLogger } from '@ydsz/utils';
import { streamRequest, type SseEvent } from '@ydsz/shared-auth';

import { emitDictChange } from './use-dict-event';

/** 模块级日志器 */
const logger = createLogger('DictSSE');

/** SSE 端点（环境变量覆盖，默认 /api/v1/dict/sse 对齐后端 DictSseEmitterController） */
const SSE_URL = import.meta.env.VITE_DICT_SSE_URL ?? '/api/v1/dict/sse';

/** 最大重连次数 */
const MAX_RECONNECT_ATTEMPTS = 5;

/** 基础退避延迟（ms） */
const BASE_RECONNECT_DELAY = 2000;

// =====================================================================
// 类型定义
// =====================================================================

/** 后端字典变更 SSE 事件载荷 */
export interface DictSsePayload {
  /** 变更的字典编码 */
  dictCode: string;
  /** 事件类型（UPDATE / DELETE / CREATE） */
  eventType: string;
  /** 变更的字典项列表（可选） */
  items?: DictSseItem[];
}

/** 字典项变更详情 */
export interface DictSseItem {
  /** 字典项编码 */
  itemCode?: string;
  /** 字典项标签 */
  itemLabel?: string;
  /** 字典项值 */
  itemValue?: string;
}

/** 连接状态枚举 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// =====================================================================
// 单例管理（引用计数）
// =====================================================================

/** 引用计数 */
let refCount = 0;

/** 共享 SSE 连接实例 */
let sharedInstance: {
  stop: () => void;
  connectionStatus: ReturnType<typeof ref<ConnectionStatus>>;
} | null = null;

/**
 * 全局回调注册表 —— 所有已注册的字典变更回调。
 *
 * <p>模块级单例，独立于 composable 调用生命周期，
 * 确保 share instance 重连后已注册的回调依然有效。
 */
const globalCallbacks = new Set<DictSseCallback>();

// =====================================================================
// SSE 帧解析
// =====================================================================

/**
 * 解析 SSE 原始数据帧为字典事件载荷（容错返回 null）。
 */
function parseDictSseFrame(raw: string): DictSsePayload | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (value === null || typeof value !== 'object') {
      return null;
    }
    const record = value as Record<string, unknown>;
    // 必须包含 dictCode 和 eventType 才视为有效字典变更事件
    if (typeof record.dictCode !== 'string' || typeof record.eventType !== 'string') {
      return null;
    }
    const payload: DictSsePayload = {
      dictCode: record.dictCode,
      eventType: record.eventType,
    };
    // 可选字段：items 数组
    if (Array.isArray(record.items)) {
      payload.items = record.items.filter(
        (item): item is DictSseItem =>
          item !== null &&
          typeof item === 'object' &&
          (typeof item.itemCode === 'string' ||
            typeof item.itemLabel === 'string' ||
            typeof item.itemValue === 'string'),
      );
    }
    return payload;
  } catch {
    return null;
  }
}

// =====================================================================
// SSE 连接工厂
// =====================================================================

/**
 * 创建底层 SSE 连接，返回停止函数与连接状态 ref。
 */
function createDictSseConnection(): {
  stop: () => void;
  connectionStatus: ReturnType<typeof ref<ConnectionStatus>>;
} {
  const ac = new AbortController();
  const connectionStatus = ref<ConnectionStatus>('connecting');

  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** 清理并中止连接 */
  const stop = (): void => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (!ac.signal.aborted) {
      ac.abort();
    }
  };

  /**
   * 调度重连（指数退避 + 抖动）。
   */
  function scheduleReconnect(): void {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.warn(
        `[SSE] Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up.`,
      );
      connectionStatus.value = 'error';
      return;
    }
    if (navigator.onLine === false) {
      logger.info('[SSE] Offline, defer reconnection until online.');
      connectionStatus.value = 'disconnected';
      return;
    }

    const delay = calculateRetryDelay(reconnectAttempts, {
      baseDelay: BASE_RECONNECT_DELAY,
      backoff: 'exponential',
      jitter: 0.25,
    });

    reconnectTimer = setTimeout(() => {
      reconnectAttempts++;
      logger.info(
        `[SSE] Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`,
      );
      void runStream();
    }, delay);
  }

  /**
   * 发起 SSE 流请求并逐帧处理。
   */
  async function runStream(): Promise<void> {
    if (navigator.onLine === false) {
      logger.info('[SSE] Offline, skip connection attempt.');
      connectionStatus.value = 'disconnected';
      return;
    }

    connectionStatus.value = 'connecting';

    try {
      await streamRequest({
        url: SSE_URL,
        method: 'GET',
        signal: ac.signal,
        onEvent: (event: SseEvent) => {
          handleDictSseFrame(event);
        },
      });
      // 流正常结束（后端关闭连接）→ 尝试重连
      connectionStatus.value = 'disconnected';
      reconnectAttempts = 0;
      scheduleReconnect();
    } catch (error: unknown) {
      if (ac.signal.aborted) return;
      connectionStatus.value = 'error';
      logger.error('[SSE] Stream error:', error);
      scheduleReconnect();
    }
  }

  /**
   * 处理 SSE 帧：解析 → 广播到本地事件总线。
   */
  function handleDictSseFrame(evt: SseEvent): void {
    const payload = parseDictSseFrame(evt.data);
    if (!payload) return;

    // 首次有效帧标记连接已建立
    if (connectionStatus.value !== 'connected') {
      connectionStatus.value = 'connected';
      reconnectAttempts = 0;
      logger.info('[SSE] Dict stream connected.');
    }

    // 复用 use-dict-event 的事件总线广播变更
    emitDictChange(payload.dictCode);

    // 分发到全局回调注册表
    for (const cb of globalCallbacks) {
      try {
        cb(payload);
      } catch (err) {
        logger.error('[SSE] Callback error:', err);
      }
    }

    logger.debug(
      `[SSE] Dict changed: code=${payload.dictCode}, event=${payload.eventType}, items=${payload.items?.length ?? 0}`,
    );
  }

  /**
   * 浏览器恢复在线时，重置重连计数并重新连接。
   */
  function onOnline(): void {
    logger.info('[SSE] Browser online, attempting reconnect.');
    reconnectAttempts = 0;
    void runStream();
  }

  /**
   * 浏览器离线，标记断开并清理重连定时器。
   */
  function onOffline(): void {
    logger.info('[SSE] Browser offline, stopping SSE.');
    connectionStatus.value = 'disconnected';
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // 启动流
  void runStream();

  return {
    stop: () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      stop();
    },
    connectionStatus,
  };
}

// =====================================================================
// Composable 公开接口
// =====================================================================

/**
 * 字典变更 SSE 订阅 Composable。
 *
 * <p>建立后端 SSE 长连接，自动解析字典变更事件并广播到本地事件总线。
 * 消费型组件通过 {@link onDictChange} 监听到变更后刷新字典缓存。
 *
 * <p>同一 composable 多次调用时共享底层 SSE 连接（引用计数管理）。
 *
 * @returns SSE 状态与控制接口
 *   - {@code connectionStatus}: 连接状态（只读: 'connecting' | 'connected' | 'disconnected' | 'error'）
 *   - {@code subscribe}: 注册字典变更回调（与 onDictChange 独立通道）
 *   - {@code unsubscribe}: 移除回调
 *   - {@code stop}: 手动断开 SSE 连接
 */
export function useDictSse(): {
  connectionStatus: Readonly<import('vue').Ref<ConnectionStatus>>;
  subscribe: (callback: DictSseCallback) => void;
  unsubscribe: (callback: DictSseCallback) => void;
  stop: () => void;
} {
  const localConnectionStatus = ref<ConnectionStatus>('connecting');
  let stopFn: (() => void) | null = null;

  /**
   * 注册字典变更回调。
   *
   * <p>回调函数在每次 SSE 收到字典变更事件时同步触发，
   * 参数为解析后的 {@link DictSsePayload}。
   *
   * <p>注意：回调不会随 composable 卸载自动移除，
   * 调用方需在适当时机调用 {@link unsubscribe} 手动清理。
   *
   * @param callback - 字典变更回调
   */
  function subscribe(callback: DictSseCallback): void {
    globalCallbacks.add(callback);
  }

  /**
   * 移除字典变更回调。
   *
   * @param callback - 之前注册的回调
   */
  function unsubscribe(callback: DictSseCallback): void {
    globalCallbacks.delete(callback);
  }

  onMounted(() => {
    refCount++;
    if (!sharedInstance) {
      sharedInstance = createDictSseConnection();
      stopFn = sharedInstance.stop;
    }
    localConnectionStatus.value = sharedInstance?.connectionStatus.value ?? 'connecting';
    if (!stopFn) {
      stopFn = sharedInstance?.stop ?? null;
    }
  });

  onUnmounted(() => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && sharedInstance) {
      if (stopFn) stopFn();
      sharedInstance = null;
      stopFn = null;
    }
  });

  const readonlyConnectionStatus = readonly(localConnectionStatus);

  return {
    connectionStatus: readonlyConnectionStatus,
    subscribe,
    unsubscribe,
    stop: () => {
      if (stopFn && sharedInstance) {
        stopFn();
        sharedInstance = null;
        stopFn = null;
        refCount = 0;
      }
    },
  };
}

/** 字典变更回调类型 */
export type DictSseCallback = (payload: DictSsePayload) => void;
