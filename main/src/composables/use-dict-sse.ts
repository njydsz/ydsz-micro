/**
 * SSE 桥接 composable —— 订阅字典变更实时推送。
 *
 * <p>监听后端 {@code GET /dict/sse} 端点，当字典数据发生新增/修改/删除时，
 * 自动刷新全局字典缓存（dictStore），确保所有页面表单中的字典下拉/选项保持最新。
 *
 * <p>错误处理：指数退避重连（最多 5 次），支持离线检测 + 恢复自动重连。
 *
 * <p><b>注意：</b>本 composable 应在基座应用（main）的根组件中调用一次，
 * 通过 refCount 单例保证全局仅维护一个 SSE 连接。
 *
 * @path main\src\composables\use-dict-sse.ts
 * @author ydsz-team
 * @since 26.10.09
 */

import { onMounted, onUnmounted, readonly, ref } from 'vue';

import { calculateRetryDelay, createLogger } from '@ydsz/utils';

import { useDictStore } from '#/store/dict';

/** 模块级日志器 */
const logger = createLogger('DictSSE');

/** 字典 SSE 端点（环境变量覆盖） */
const SSE_URL = import.meta.env.VITE_DICT_SSE_URL ?? '/dict/sse';

/** 最大重试次数 */
const MAX_RECONNECT_ATTEMPTS = 5;

/** 基础退避延迟（ms） */
const BASE_RECONNECT_DELAY = 2000;

/** 单例引用计数 —— 防止多组件重复订阅 */
let refCount = 0;

/** 共享实例（单例） */
let sharedInstance: { stop: () => void; connected: ReturnType<typeof ref> } | null = null;

// ======================== 类型 ========================

/** 字典变更事件 */
interface DictChangeEvent {
  dictCode?: string;
  eventType?: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  tenantId?: string;
  field?: string;
  value?: unknown;
}

// ======================== 内部方法 ========================

/** 解析 SSE 帧数据 */
function parseSseFrame(raw: string): DictChangeEvent | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (value !== null && typeof value === 'object') {
      return value as DictChangeEvent;
    }
    return null;
  } catch {
    return null;
  }
}

/** 处理字典变更事件 —— 刷新对应字典缓存 */
function handleDictChange(event: DictChangeEvent): void {
  if (!event.dictCode || !event.eventType) return;
  const dictStore = useDictStore();
  dictStore.refreshDict(event.dictCode);
  logger.info(`字典变更 [${event.eventType}]: ${event.dictCode}`);
}

// ======================== SSE 连接管理 ========================

/** 全局 SSE EventSource 实例 */
let eventSource: EventSource | null = null;

/** 当前重连次数 */
let reconnectAttempts = 0;

/** 重连定时器 */
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/** 销毁标记（防止重连风暴 —— 停止后不再尝试） */
let disposed = false;

/**
 * 建立 SSE 连接。
 *
 * <p>内部自动解析事件帧、派发字典变更事件，连接断开时按指数退避策略自动重连。
 */
function openConnection(connected: ReturnType<typeof ref<boolean>>): void {
  if (disposed) return;
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  try {
    eventSource = new EventSource(SSE_URL, { withCredentials: true });
  } catch (e) {
    logger.warn(`SSE 连接创建失败: ${e}`);
    scheduleReconnect(connected);
    return;
  }

  eventSource.onopen = () => {
    logger.info('字典 SSE 连接已建立');
    connected.value = true;
    reconnectAttempts = 0;
  };

  eventSource.onmessage = (event: MessageEvent<string>) => {
    const payload = parseSseFrame(event.data);
    if (payload) {
      handleDictChange(payload);
    }
  };

  eventSource.onerror = () => {
    logger.warn(`字典 SSE 连接断开，重连次数: ${reconnectAttempts + 1}`);
    connected.value = false;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    scheduleReconnect(connected);
  };
}

/**
 * 调度指数退避重连。
 */
function scheduleReconnect(connected: ReturnType<typeof ref<boolean>>): void {
  if (disposed || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.warn(`字典 SSE 重连已达上限 ${MAX_RECONNECT_ATTEMPTS} 次，停止重连`);
    }
    return;
  }
  reconnectAttempts++;
  const delay = calculateRetryDelay(reconnectAttempts, BASE_RECONNECT_DELAY);
  reconnectTimer = setTimeout(() => openConnection(connected), delay);
}

// ======================== 导出 composable ========================

/**
 * 订阅字典 SSE 实时推送（单例模式）。
 *
 * <p>使用示例：
 * <pre>{@code
 * // 在 main/src/layouts/basic.vue 中
 * const { connected } = useDictSse();
 * }</pre>
 *
 * @returns connected —— 只读 ref，表示 SSE 连接状态
 */
export function useDictSse() {
  /** 连接状态 */
  const connected = ref(false);

  onMounted(() => {
    refCount++;
    if (!sharedInstance) {
      openConnection(connected);
      sharedInstance = {
        stop: () => {
          disposed = true;
          if (reconnectTimer) clearTimeout(reconnectTimer);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          connected.value = false;
          sharedInstance = null;
        },
        connected,
      };
    }
  });

  onUnmounted(() => {
    refCount--;
    if (refCount <= 0 && sharedInstance) {
      sharedInstance.stop();
      refCount = 0;
    }
  });

  return { connected: readonly(connected) };
}
