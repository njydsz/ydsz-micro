/**
 * 定时任务状态 SSE 推送 Composable
 *
 * 使用 EventSource 订阅 /cronjob/events/stream 端点，接收任务状态变更事件。
 * 支持指数退避重连，当收到状态变更事件时回调更新本地任务列表。
 *
 * @path apps/cronjob-web/src/composables/use-job-status-sse.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { onBeforeUnmount, ref } from 'vue';

/** 任务状态变更事件 */
export interface JobStatusChangeEvent {
  jobId: string;
  status: string;
  jobName?: string;
  timestamp?: string;
}

/** SSE 连接状态 */
export type SseConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

/** 回调函数类型 */
export type StatusChangeHandler = (event: JobStatusChangeEvent) => void;

/** SSE 端点路径 */
const SSE_ENDPOINT = '/cronjob/events/stream';

/** 最大重试次数 */
const MAX_RECONNECT_ATTEMPTS = 10;

/** 初始退避时间（毫秒） */
const INITIAL_BACKOFF_MS = 1000;

/** 最大退避时间（毫秒） */
const MAX_BACKOFF_MS = 30000;

/**
 * 定时任务状态 SSE 推送 Composable
 *
 * @param onStatusChange - 状态变更回调函数
 * @returns SSE 连接控制接口
 */
export function useJobStatusSse(onStatusChange?: StatusChangeHandler) {
  /** EventSource 实例 */
  let eventSource: EventSource | null = null;

  /** 当前重连次数 */
  let reconnectAttempts = 0;

  /** 当前退避时间 */
  let backoffMs = INITIAL_BACKOFF_MS;

  /** 重连定时器 */
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** 连接状态 */
  const connectionState = ref<SseConnectionState>('idle');

  /** 最后一次错误信息 */
  const lastError = ref<string>('');

  /**
   * 清除重连定时器
   */
  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  /**
   * 处理状态变更事件
   */
  function handleStatusChangeEvent(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as JobStatusChangeEvent;
      if (data.jobId && data.status && onStatusChange) {
        onStatusChange(data);
      }
    } catch {
      // 解析失败，忽略无效事件
    }
  }

  /**
   * 处理通用 SSE 事件（兼容非 message 事件名）
   */
  function handleNamedEvent(eventType: string): (e: MessageEvent) => void {
    return (e: MessageEvent) => {
      // status-change 事件使用 message 事件处理器
      if (eventType === 'status-change') {
        handleStatusChangeEvent(e);
      }
    };
  }

  /**
   * 建立 SSE 连接
   */
  function connect(): void {
    // 已有连接或正在连接中则不重复创建
    if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
      return;
    }

    connectionState.value = 'connecting';

    try {
      eventSource = new EventSource(SSE_ENDPOINT);

      eventSource.onopen = () => {
        connectionState.value = 'connected';
        reconnectAttempts = 0;
        backoffMs = INITIAL_BACKOFF_MS;
      };

      eventSource.onmessage = (event: MessageEvent) => {
        handleStatusChangeEvent(event);
      };

      // 监听自定义事件（如果后端使用 named events）
      eventSource.addEventListener('status-change', handleNamedEvent('status-change'));
      eventSource.addEventListener('job-status', handleNamedEvent('job-status'));

      eventSource.onerror = () => {
        // EventSource 在连接断开时会自动尝试重连，但我们需要额外的重试逻辑
        connectionState.value = 'disconnected';

        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // 指数退避重试
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          lastError.value = `SSE 连接断开，${backoffMs / 1000}s 后重试 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
          reconnectTimer = setTimeout(() => {
            connect();
          }, backoffMs);

          // 退避时间翻倍，但不超过最大值
          backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        } else {
          connectionState.value = 'error';
          lastError.value = `SSE 连接失败，已达到最大重试次数 (${MAX_RECONNECT_ATTEMPTS})`;
        }
      };
    } catch (err) {
      connectionState.value = 'error';
      lastError.value = err instanceof Error ? err.message : 'SSE 连接创建失败';
    }
  }

  /**
   * 断开 SSE 连接
   */
  function disconnect(): void {
    clearReconnectTimer();
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    connectionState.value = 'disconnected';
    reconnectAttempts = 0;
    backoffMs = INITIAL_BACKOFF_MS;
  }

  /**
   * 手动重连（重置退避计数并重新连接）
   */
  function reconnect(): void {
    disconnect();
    reconnectAttempts = 0;
    backoffMs = INITIAL_BACKOFF_MS;
    connect();
  }

  // 组件卸载时清理
  onBeforeUnmount(() => {
    disconnect();
  });

  return {
    connect,
    disconnect,
    reconnect,
    connectionState,
    lastError,
  };
}
