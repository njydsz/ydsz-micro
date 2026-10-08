/**
 * 运行时工厂 + 内核注册机制
 *
 * 内核实现通过 registerKernel 注册，
 * createRuntime 按 name 选择内核并返回 MicroRuntime 实例。
 *
 * 主应用 bootstrap.ts 中调用 createRuntime({ kernel: 'micro-kernel' })
 * 即可启动微前端运行时，切换内核只需改一个字面量。
 *
 * @path comm/effects/micro-runtime/src/create-runtime.ts
 * @author ydsz-team
 * @since 3.0.0
 */

import type { MicroRuntime } from './types';

import { createLogger } from '@ydsz-core/shared/utils';
const logger = createLogger('create-runtime');

/**
 * 已知内核名称。
 *
 * @remarks
 * - `'micro-kernel'`：自研 ESM 动态导入内核（唯一生产可用实现）
 * - `'qiankun'`：已废弃，qiankun 内核从未接入；保留此字面量仅为类型兼容，
 *   生产代码请使用 `'micro-kernel'`
 */
export type KernelName =
  | 'micro-kernel'
  | /** @deprecated 使用 'micro-kernel' 替代。qiankun 内核从未接入，将在后续版本移除。 */ 'qiankun'
  | string;

/** 内核工厂注册表 */
const kernelRegistry = new Map<KernelName, () => MicroRuntime>();

/**
 * 注册内核实现
 *
 * @example
 * registerKernel('micro-kernel', () => createKernel());
 */
export function registerKernel(name: KernelName, factory: () => MicroRuntime): void {
  if (kernelRegistry.has(name)) {
    logger.warn(`[MicroRuntime] Kernel "${name}" is already registered, overwriting.`);
  }
  kernelRegistry.set(name, factory);
}

/**
 * 创建运行时实例（单例）
 *
 * @example
 * const runtime = createRuntime({ kernel: 'micro-kernel' });
 * runtime.registerApps(microApps);
 * runtime.start({ sandbox: { styleIsolation: true }, prefetch: false });
 */
export function createRuntime(options: { kernel: KernelName }): MicroRuntime {
  if (options.kernel === 'qiankun') {
    logger.warn(
      '[MicroRuntime] The "qiankun" kernel was never implemented and is deprecated. ' +
      'Falling back to "micro-kernel". Please update your bootstrap configuration.',
    );
    options = { kernel: 'micro-kernel' };
  }
  const factory = kernelRegistry.get(options.kernel);
  if (!factory) {
    throw new Error(
      `[MicroRuntime] Kernel "${options.kernel}" is not registered. ` +
      `Available: ${[...kernelRegistry.keys()].join(', ')}`,
    );
  }
  return factory();
}

/** 获取已注册的内核列表（调试用） */
export function getRegisteredKernels(): KernelName[] {
  return [...kernelRegistry.keys()];
}
