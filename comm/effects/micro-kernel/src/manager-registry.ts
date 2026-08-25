import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('manager-registry');
/**
 * 微内核管理器注册表
 *
 * P0-A1: 将分散在各模块的可变状态（scheduler 实例集 / keepalive 参数 /
 * 路由预测器 / 消息预加载管理器）统一收归注册表，由闭包在单次
 * createKernel 内持有，确保多实例/HMR 场景状态完全隔离。
 *
 * 设计决策：
 * 1. 在 createKernel 闭包内创建 registry 实例
 * 2. 各 manager（SchedulerFacade / RoutePredictor / PreloadManager ...）
 *    在 registry 上注册自己
 * 3. _stop() 调用 registry.disposeAll() 一次性重置/清理
 * 4. 模块仍各自 export 工具函数，内部从 shared 变量读取 facade/单例
 *    （最小化 API 改动，向后兼容）
 *
 * P0-1 (v4.2): 支持管理器间依赖声明，disposeAll() 按拓扑顺序释放，
 * 消除潜在的依赖竞态（如预加载管理器先于 scheduler 释放的时序问题）。
 *
 * @path comm/effects/micro-kernel/src/manager-registry.ts
 * @author ydsz-team
 * @since 4.0.1
 */

/**
 * 可释放的管理器接口。
 *
 * 所有纳入 ManagerRegistry 统一生命周期的组件需实现此接口。
 */
export interface DisposableManager {
  /** 管理器唯一标识 */
  readonly name: string;
  /**
   * 声明此管理器依赖的其他管理器名称列表。
   *
   * disposeAll() 将确保**被依赖**的管理器**先**释放，依赖方后释放。
   * 未声明依赖时按注册顺序的逆序释放。
   *
   * @example
   * // preload-manager 依赖 scheduler（卸载预加载前需先停止调度器）
   * { name: 'preload-strategy', dependsOn: ['scheduler'], dispose() { ... } }
   */
  readonly dependsOn?: string[];
  /**
   * 释放管理器持有的状态。
   *
   * - 对"重置型"管理器：清理内部缓存、计数器、监听器
   * - 对"销毁型"管理器：额外释放 DOM 引用、断开桥接
   */
  dispose(): Promise<void> | void;
}

/**
 * 管理器注册表
 *
 * 集中管理微内核各子模块的可变状态生命周期。
 */
export class ManagerRegistry {
  private disposed = false;
  private managers = new Map<string, DisposableManager>();

  /**
   * 释放全部已注册管理器。
   *
   * P0-1: 使用拓扑排序，确保依赖关系正确：
   * 1. 被依赖的 manager 先释放（出度为 0 的节点优先）
   * 2. 依赖方后释放
   * 3. 循环依赖时退化为逆序释放并打印警告
   *
   * 若管理器未声明 dependsOn，则按注册逆序释放（向后兼容）。
   */
  async disposeAll(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

    const releaseOrder = this.topologicalSort();
    for (const manager of releaseOrder) {
      try {
        await manager.dispose();
      } catch {
        // 单个管理器释放失败不影响其他
      }
    }
    this.managers.clear();
  }

  /**
   * 获取已注册的管理器（供内部使用）。
   *
   * @param name - 管理器标识
   */
  get<T extends DisposableManager>(name: string): T | undefined {
    return this.managers.get(name) as T | undefined;
  }

  /**
   * 获取所有管理器名称（供 DevTools 展示）。
   */
  getManagerNames(): string[] {
    return [...this.managers.keys()];
  }

  /**
   * 检查是否已释放。
   */
  isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * 注册一个管理器。
   *
   * 同名管理器重复注册将覆盖（后注册的先释放）。
   *
   * @param manager - 管理器实例
   */
  register(manager: DisposableManager): void {
    // 若同名已存在，先释放旧的
    const existing = this.managers.get(manager.name);
    if (existing) {
      void existing.dispose();
    }
    this.managers.set(manager.name, manager);
  }

  /**
   * 拓扑排序：根据 dependsOn 依赖关系计算释放顺序。
   *
   * 使用 Kahn 算法（BFS），时间复杂度 O(V + E)。
   * 若存在循环依赖，将剩余节点按注册逆序追加并警告。
   */
  private topologicalSort(): DisposableManager[] {
    const allManagers = [...this.managers.values()];

    // 快速路径：无依赖声明时直接返回逆序
    const hasDeps = allManagers.some(
      (m) => m.dependsOn && m.dependsOn.length > 0,
    );
    if (!hasDeps) {
      return allManagers.reverse();
    }

    // 构建邻接表：依赖方 → 被依赖方（边从依赖方指向被依赖方）
    // 释放顺序要求：被依赖方先释放（入度为 0 的节点先输出）
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>(); // 被依赖方 → 依赖它的管理器列表

    for (const m of allManagers) {
      inDegree.set(m.name, inDegree.get(m.name) ?? 0);
      if (m.dependsOn) {
        for (const dep of m.dependsOn) {
          if (!this.managers.has(dep)) continue; // 依赖未注册，跳过
          inDegree.set(m.name, (inDegree.get(m.name) ?? 0) + 1);
          if (!dependents.has(dep)) dependents.set(dep, []);
          dependents.get(dep)!.push(m.name);
        }
      }
    }

    // Kahn 算法
    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) queue.push(name);
    }

    const result: DisposableManager[] = [];
    while (queue.length > 0) {
      const name = queue.shift()!;
      const manager = this.managers.get(name);
      if (manager) result.push(manager);

      // 将依赖此管理器的节点入度减 1
      for (const dependent of dependents.get(name) ?? []) {
        const newDegree = (inDegree.get(dependent) ?? 0) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) queue.push(dependent);
      }
    }

    // 检测循环依赖
    if (result.length < allManagers.length) {
      // 将未处理的节点按注册逆序追加
      const releasedNames = new Set(result.map((m) => m.name));
      const remaining = allManagers
        .filter((m) => !releasedNames.has(m.name))
        .reverse();
      if (typeof console !== "undefined") {
        const cycleNames = remaining.map((m) => m.name).join(", ");
        logger.warn(
          `[ManagerRegistry] Circular dependency detected among: ${cycleNames}. ` +
            `Falling back to reverse-registration order.`,
        );
      }
      result.push(...remaining);
    }

    return result;
  }
}

/**
 * 实例化注册表（由 createKernel 闭包调用）。
 */
export function createManagerRegistry(): ManagerRegistry {
  return new ManagerRegistry();
}
