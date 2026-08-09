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
   * 释放管理器持有的状态。
   *
   * - 对"重置型"管理器：清理内部缓存、计数器、监听器
   * - 对"销毁型"管理器：额外释放 DOM 引用、断开桥接
   */
  dispose(): void | Promise<void>;
}

/**
 * 管理器注册表
 *
 * 集中管理微内核各子模块的可变状态生命周期。
 */
export class ManagerRegistry {
  private managers = new Map<string, DisposableManager>();
  private disposed = false;

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
   * 获取已注册的管理器（供内部使用）。
   *
   * @param name - 管理器标识
   */
  get<T extends DisposableManager>(name: string): T | undefined {
    return this.managers.get(name) as T | undefined;
  }

  /**
   * 释放全部已注册管理器（按注册顺序的逆序）。
   *
   * 逆序释放确保"被依赖"的管理器先释放（如预加载管理器先于 scheduler）。
   */
  async disposeAll(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

    // 逆序释放
    const entries = Array.from(this.managers.entries()).reverse();
    for (const [, manager] of entries) {
      try {
        await manager.dispose();
      } catch {
        // 单个管理器释放失败不影响其他
      }
    }
    this.managers.clear();
  }

  /**
   * 获取所有管理器名称（供 DevTools 展示）。
   */
  getManagerNames(): string[] {
    return Array.from(this.managers.keys());
  }

  /**
   * 检查是否已释放。
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}

/**
 * 实例化注册表（由 createKernel 闭包调用）。
 */
export function createManagerRegistry(): ManagerRegistry {
  return new ManagerRegistry();
}
