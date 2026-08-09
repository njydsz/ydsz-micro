/**
 * lifecycle-hooks.ts — 生命周期钩子注册表
 *
 * 从 kernel.ts 提取的生命周期钩子管理，消除闭包内 Map 状态对 createKernel
 * 大函数的耦合，便于独立测试：
 * - 支持按 hookName 注册多个钩子
 * - 返回取消注册函数，防止泄漏
 * - error 钩子内部异常不影响后续钩子
 *
 * 用法：
 *   const hooks = createLifecycleHookRegistry();
 *   const off = hooks.add('beforeMount', (app) => { ... });
 *
 * @path comm/effects/micro-kernel/src/lifecycle-hooks.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import type {
  ErrorLifecycleHook,
  LifecycleHook,
  LifecycleHookName,
  MicroAppConfig,
} from '@ydsz/micro-runtime';

/**
 * 生命周期钩子注册表。
 *
 * 每次调用返回独立注册表，供 createKernel 闭包持有。
 * 与 createKernel 内的实例一一对应，多内核 / HMR 场景互不串扰。
 */
export interface LifecycleHookRegistry {
  /** 注册钩子，返回取消注册函数 */
  add(hookName: LifecycleHookName, hook: ErrorLifecycleHook | LifecycleHook): () => void;
  /** 依次执行普通生命周期钩子 */
  run(hookName: LifecycleHookName, app: MicroAppConfig): Promise<void>;
  /** 执行 error 钩子（内部异常隔离） */
  runError(app: MicroAppConfig, error: unknown): Promise<void>;
  /** 清空全部钩子（供 _stop 使用） */
  clear(): void;
}

/**
 * 创建生命周期钩子注册表。
 */
export function createLifecycleHookRegistry(): LifecycleHookRegistry {
  const lifecycleHooks = new Map<
    string,
    Array<LifecycleHook | ErrorLifecycleHook>
  >();

  function add(
    hookName: LifecycleHookName,
    hook: ErrorLifecycleHook | LifecycleHook,
  ): () => void {
    if (!lifecycleHooks.has(hookName)) {
      lifecycleHooks.set(hookName, []);
    }
    lifecycleHooks.get(hookName)!.push(hook);

    return () => {
      const list = lifecycleHooks.get(hookName);
      if (!list) return;
      const idx = list.indexOf(hook);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  async function run(hookName: LifecycleHookName, app: MicroAppConfig): Promise<void> {
    for (const hook of lifecycleHooks.get(hookName) || []) {
      await (hook as LifecycleHook)(app);
    }
  }

  async function runError(app: MicroAppConfig, error: unknown): Promise<void> {
    for (const hook of lifecycleHooks.get('error') || []) {
      try {
        await (hook as ErrorLifecycleHook)(app, error);
      } catch {
        /* 错误钩子内部的错误不应影响后续钩子 */
      }
    }
  }

  function clear(): void {
    lifecycleHooks.clear();
  }

  return { add, run, runError, clear };
}