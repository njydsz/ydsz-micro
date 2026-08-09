/**
 * retry.ts — 轻量指数退避重试工具
 *
 * 原设计从 `@YDSZ-core/shared/utils/retry` 导入，但该路径在 shared 包中并不存在
 * （shared 只导出 ./utils 聚合模块）。此处落地为 micro-kernel 本地实现，消除
 * 对不存在子路径的悬空依赖，供 loader 的 fetch / ESM import 重试使用。
 *
 * 特性：
 * - 指数退避：delay = baseDelay * 2^attempt
 * - 抖动（jitter）：在 [delay*(1-j), delay*(1+j)] 区间随机化，避免惊群
 * - onRetry 回调暴露 (error, attempt, delay) 供日志埋点
 *
 * @path comm/effects/micro-kernel/src/retry.ts
 * @author ydsz-team
 * @since 4.1.0
 */

/** 重试选项 */
export interface RetryOptions {
  /** 最大重试次数（不含首次执行） */
  maxRetries: number;
  /** 基础退避延迟（ms） */
  baseDelay: number;
  /** 退避策略，当前仅支持 exponential */
  backoff: 'exponential';
  /** 抖动比例（0~1），默认 0.25 */
  jitter?: number;
  /** 每次重试前的回调 */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

/** 计算第 attempt 次重试的退避延迟（含 jitter 随机化） */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  jitter = 0.25,
): number {
  const raw = baseDelay * 2 ** attempt;
  const half = raw * jitter;
  // 在 [raw - half, raw + half] 之间均匀随机，抵消共享相位避免惊群
  return Math.round(raw - half + Math.random() * (half * 2));
}

/**
 * 带指数退避与抖动重试的执行器。
 *
 * 首次执行即尝试；失败后按 maxRetries 重试，每次延迟指数递增并加随机抖动。
 * 重试耗尽后抛出最后一次异常。
 */
export async function retryOperation<T>(
  fn: () => Promise<T> | T,
  options: RetryOptions,
): Promise<T> {
  const { maxRetries, baseDelay, jitter = 0.25, onRetry } = options;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = calculateRetryDelay(attempt, baseDelay, jitter);
      onRetry?.(error, attempt, delay);
      await sleep(delay);
      attempt += 1;
    }
  }
}

/** 简易延迟辅助 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}