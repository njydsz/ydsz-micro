/**
 * 主子应用国际化运行时同步 composable
 *
 * 解决微前端场景下主应用切换语言后子应用 i18n 不同步的问题。
 * 基于观察者模式：主应用注册为 provider，注册为 consumer 的子应用自动跟随。
 *
 * 使用方式：
 * - 主应用：
 *   ```ts
 *   import { useLocaleSync } from '@ydsz/micro-kernel/composables';
 *   const { locale } = useLocaleSync({ i18n });
 *   // locale 变更时所有子应用自动同步
 *   ```
 *
 * - 子应用：
 *   ```ts
 *   import { useLocaleSync } from '@ydsz/micro-kernel/composables';
 *   const { locale } = useLocaleSync({
 *     i18n,
 *     initialLocale: props.context?.locale,
 *   });
 *   ```
 *
 * 流程：
 * 1. 主应用初始化时注册 provider，向所有已注册 consumer 广播当前 locale
 * 2. consumer 端通过 waitingResolvers 队列解析初始化期间 getLocale() 的 await
 * 3. provider 端 locale 变更时广播到所有 consumer
 *
 * @path comm/effects/micro-kernel/src/composables/use-locale-sync.ts
 * @author ydsz-team
 * @since 4.2.0
 */

import type { Composer } from "vue-i18n";

import { onUnmounted, ref, watch } from "vue";

import { useSimpleLocale } from "@YDSZ-core/composables";

// ==================== 模块级共享状态 ====================

/**
 * 跨应用共享状态单例。
 *
 * @remarks
 * 微前端场景下主应用与子应用通过 ESM 共享同一个 @ydsz/micro-kernel 模块实例，
 * 因此模块级变量可作为跨应用的"隐蔽总线"——不经过消息中间件，零延迟同步。
 * 对于 iframe 沙箱等真正隔离的场景，需额外通过 BroadcastChannel 桥接。
 */
const shared = {
  /** 已注册的 locale provider（主应用，有且仅有一个） */
  provider: null as null | { getLocale: () => string },

  /** 等待 provider 就绪的 consumer 队列 */
  waitingResolvers: [] as Array<(locale: string) => void>,

  /** 已注册的 consumer 回调集合 */
  consumers: new Set<(locale: string) => void>(),
};

// ==================== 主应用 Provider ====================

/**
 * 注册 locale provider（主应用调用一次）。
 *
 * 此后 provider 端的 i18n.locale 变化会广播到所有 consumer。
 */
export function registerLocaleProvider(i18n: Composer): () => void {
  const provider = {
    getLocale: () => i18n.locale.value as string,
  };
  shared.provider = provider;

  // 向正在等待的 consumer 派发当前 locale
  const currentLocale = provider.getLocale();
  flushWaitingResolvers(currentLocale);

  return () => {
    shared.provider = null;
  };
}

// ==================== Consumer 注册 ====================

/**
 * 向等待队列与 consumer 注册表注册子应用 locale 监听。
 *
 * @param callback - locale 变更回调
 * @returns 取消注册函数
 */
export function onLocaleChange(callback: (locale: string) => void): () => void {
  // provider 已存在：立即同步
  const current = shared.provider?.getLocale();
  if (current) {
    callback(current);
  }

  shared.consumers.add(callback);
  return () => {
    shared.consumers.delete(callback);
  };
}

// ==================== 内部工具 ====================

/**
 * 刷新等待队列：将所有等待中的 resolver 执行并清空队列。
 */
function flushWaitingResolvers(locale: string): void {
  const resolvers = shared.waitingResolvers.splice(0);
  for (const resolve of resolvers) {
    resolve(locale);
  }
}

// ==================== 主 Composable ===========================

/**
 * useLocaleSync 配置选项
 */
export interface UseLocaleSyncOptions {
  /** vue-i18n Composer 实例（主/子应用各自的 i18n.global） */
  i18n: Composer;

  /** 子应用初始 locale（来自 mountProps.context.locale） */
  initialLocale?: string;

  /** 是否在 provider 未就绪时回退到本地 i18n.locale（默认 true） */
  fallbackToLocal?: boolean;

  /**
   * 未就绪时等待超时（毫秒）。超时后回退到 initialLocale 或本地 locale。
   * 设 0 则禁用超时（一直等待 provider 就绪）。
   */
  providerReadyTimeout?: number;
}

/**
 * useLocaleSync 返回类型
 */
export interface UseLocaleSyncReturn {
  /** 当前生效的 locale（响应式） */
  locale: ReturnType<typeof ref<string>>;

  /**
   * 设置 locale（仅主应用应调用）。
   * 直接修改 i18n.locale，watch 自动触发广播。
   */
  setLocale: (locale: string) => void;

  /**
   * 等待 provider locale 就绪（仅子应用需要）。
   * 若 provider 已注册则立即 resolve，否则等待就绪或超时。
   */
  whenReady: () => Promise<string>;
}

/**
 * 主子应用国际化运行时同步 composable。
 *
 * 主应用（provider）：监听 i18n.locale 变更，广播到所有子应用。
 * 子应用（consumer）：初始化时先应用 initialLocale，
 * 然后在 provider 就绪后切换到 provider 的 locale。
 *
 * @example
 * ```ts
 * // 主应用 main.ts
 * import { createI18n } from 'vue-i18n';
 * const i18n = createI18n({ ... });
 * app.use(i18n);
 * const { locale } = useLocaleSync({ i18n: i18n.global });
 * ```
 *
 * @example
 * ```ts
 * // 子应用 main.ts
 * import { useLocaleSync } from '@ydsz/micro-kernel/composables';
 * export async function mount(props) {
 *   const { locale } = useLocaleSync({
 *     i18n: i18n.global,
 *     initialLocale: props.context?.locale,
 *   });
 *   // locale 将自动跟随主应用变化
 * }
 * ```
 */
export function useLocaleSync(
  options: UseLocaleSyncOptions,
): UseLocaleSyncReturn {
  const {
    i18n,
    initialLocale,
    fallbackToLocal = true,
    providerReadyTimeout = 2000,
  } = options;

  const { setSimpleLocale } = useSimpleLocale();
  const locale = ref<string>(initialLocale || i18n.locale.value || "zh-CN");

  // 同步辅助：更新 i18n + 响应式 ref + SimpleLocale
  const applyLocale = (nextLocale: string): void => {
    if (nextLocale === locale.value) return;
    locale.value = nextLocale;
    i18n.locale.value = nextLocale;
    setSimpleLocale(nextLocale as "en-US" | "zh-CN");
  };

  // === Provider 注册：监听本地 i18n.locale 变化，广播到 all consumers ===
  let unregisterProvider: (() => void) | null = null;
  const stopWatch = watch(
    () => i18n.locale.value,
    (nextLocale) => {
      if (!nextLocale) return;
      locale.value = nextLocale as string;
      setSimpleLocale(nextLocale as "en-US" | "zh-CN");
      // 广播到所有 consumer
      for (const consumer of shared.consumers) {
        consumer(nextLocale as string);
      }
    },
  );

  // 尝试注册为 provider（若无 provider）
  if (shared.provider) {
    // 已有 provider → 作为 consumer：先同步 provider 当前 locale
    const providerLocale = shared.provider.getLocale();
    if (providerLocale) {
      applyLocale(providerLocale);
    }
    // 注册 consumer 回调
    const unsubscribe = onLocaleChange(applyLocale);
    onUnmounted(unsubscribe);
  } else {
    unregisterProvider = registerLocaleProvider(i18n);
  }

  // 若已有 provider 且 consumer 模式：异步等待 provider 就绪后追赶
  const whenReady = (): Promise<string> => {
    // provider 已就绪
    const current = shared.provider?.getLocale();
    if (current) {
      return Promise.resolve(current);
    }

    // 等待 provider 注册或超时
    if (providerReadyTimeout === 0) {
      return new Promise<string>((resolve) => {
        shared.waitingResolvers.push((loc) => {
          applyLocale(loc);
          resolve(loc);
        });
      });
    }

    return new Promise<string>((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        // 从等待队列移除
        const idx = shared.waitingResolvers.indexOf(resolveWaiting);
        if (idx !== -1) shared.waitingResolvers.splice(idx, 1);
        // 回退到本地值
        const fallback = initialLocale || i18n.locale.value || "zh-CN";
        applyLocale(fallback);
        resolve(fallback);
      }, providerReadyTimeout);

      const resolveWaiting = (loc: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        applyLocale(loc);
        resolve(loc);
      };

      shared.waitingResolvers.push(resolveWaiting);
    });
  };

  // 卸载清理
  onUnmounted(() => {
    stopWatch();
    unregisterProvider?.();
  });

  return {
    locale,
    setLocale: (next: string) => {
      applyLocale(next);
    },
    whenReady,
  };
}
