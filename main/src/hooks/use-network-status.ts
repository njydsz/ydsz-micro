/**
 * 网络状态感知 composable（v4.0）
 *
 * 为 UI 提供：
 * - isOnline: 是否联网
 * - isSlow: 是否慢速网络
 * - isSaveData: 是否开启省流量模式
 * - effectiveType: 实际网络类型（4g/3g/2g/slow-2g）
 * - downlink: 估算带宽（Mbps）
 * - rtt: 往返延迟（ms）
 *
 * 用法：在 NetworkAlert 组件或任意 setup 内 useNetworkStatus()
 *
 * @path main/src/hooks/use-network-status.ts
 * @since 4.0.0
 */
import { ref, readonly, onMounted, onUnmounted } from 'vue';

/**
 * 网络连接有效类型
 *
 * 对应 Network Information API 的 effectiveType 字段。
 *
 * @since 4.0.0
 */
export type EffectiveType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

/**
 * 网络状态信息
 *
 * 描述当前设备的网络连接状态与质量指标。
 *
 * @since 4.0.0
 */
export interface NetworkStatus {
  /** 是否联网 */
  isOnline: boolean;
  /** 是否慢速网络（3g/2g/slow-2g） */
  isSlow: boolean;
  /** 是否开启省流量模式（Save-Data） */
  isSaveData: boolean;
  /** 实际网络类型（4g/3g/2g/slow-2g/unknown） */
  effectiveType: EffectiveType;
  /** 估算下行带宽（Mbps） */
  downlink: number;
  /** 估算往返延迟（ms） */
  rtt: number;
}

const STATUS_KEY = '__MICRO_NETWORK_STATUS__';

function readNavigatorConnection(): NetworkStatus {
  const nav = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
      downlink?: number;
      rtt?: number;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };
  };
  const conn = nav.connection;
  const type = (conn?.effectiveType || '4g') as EffectiveType;
  const isSlow = ['slow-2g', '2g', '3g'].includes(type);
  const isSaveData = conn?.saveData === true;
  return {
    isOnline: navigator.onLine, isSlow, isSaveData,
    effectiveType: type, downlink: conn?.downlink ?? 10, rtt: conn?.rtt ?? 50,
  };
}

// 单例：多组件共享
let stateInitialized = false;
let refInstance: ReturnType<typeof ref<NetworkStatus>> | undefined;
const listeners: Set<() => void> = new Set();

function initState() {
  if (refInstance) return refInstance;
  refInstance = ref<NetworkStatus>(readNavigatorConnection());
  const update = () => {
    if (!refInstance) return;
    refInstance.value = readNavigatorConnection();
    listeners.forEach((fn) => fn());
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  if ((navigator as any).connection?.addEventListener) {
    (navigator as any).connection.addEventListener('change', update);
  }
  return refInstance;
}

/**
 * 响应式网络状态 composable
 *
 * 基于 Network Information API 提供响应式网络状态感知能力。
 * 主/子应用共享单例状态，避免重复监听。
 *
 * @returns 网络状态与工具方法
 * @returns networkStatus - 只读的响应式网络状态对象
 * @returns isOnline - 获取是否联网的函数
 * @returns isSlow - 获取是否慢速网络的函数
 * @returns isSaveData - 获取是否省流量模式的函数
 * @returns onChange - 注册网络状态变化回调（自动在组件卸载时清理）
 *
 * @example
 * ```ts
 * const { networkStatus, isOnline } = useNetworkStatus();
 * // 模板中直接使用 networkStatus.isOnline
 * // 或监听变化
 * onChange(() => {
 *   if (!isOnline()) message.warning('网络已断开');
 * });
 * ```
 *
 * @since 4.0.0
 */
export function useNetworkStatus() {
  if (!stateInitialized && !refInstance) { initState(); stateInitialized = true; }
  const state = refInstance ?? initState()!;
  const onChange = (fn: () => void) => { listeners.add(fn); onUnmounted(() => listeners.delete(fn)); };
  return {
    networkStatus: readonly(state),
    isOnline: () => state.value.isOnline,
    isSlow: () => state.value.isSlow,
    isSaveData: () => state.value.isSaveData,
    onChange,
  };
}

/**
 * 判断是否应跳过预加载
 *
 * 在慢网络（3g/2g/slow-2g）、省流量模式（Save-Data）或离线时返回 true，
 * 供 prefetch 调度器在注入 Speculation Rules 前调用，避免消耗用户流量。
 *
 * @returns 是否应跳过预加载
 *
 * @example
 * ```ts
 * if (shouldSkipPrefetchDueToNetwork()) {
 *   return; // 不注入预加载规则
 * }
 * injectSpeculationRules(prefetchUrls);
 * ```
 *
 * @since 4.0.0
 */
export function shouldSkipPrefetchDueToNetwork(): boolean {
  const s = readNavigatorConnection();
  return !s.isOnline || s.isSlow || s.isSaveData;
}

export { STATUS_KEY };
