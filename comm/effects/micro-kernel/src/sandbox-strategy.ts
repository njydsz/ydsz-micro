/**
 * 沙箱策略接口（P3-1: SandboxStrategy 接口拆分）
 *
 * 三种沙箱模式（snapshot / proxy / iframe）的统一抽象，
 * 使得 AppInstance 可以用单一字段持有沙箱实例，
 * 消除 scheduler.ts 中按 sandboxType 分支判断的 if/switch。
 *
 * **设计原则**：
 * - 接口只抽象三种沙箱共有的生命周期行为（mount/unmount/activate/cleanup）
 * - 各沙箱特有能力（如 iframe 的 postMessage 桥、proxy 的 fakeWindow）
 *   —— 保留在各自适配器中，需要时通过类型断言访问
 * - 创建逻辑保留在各自的 create 函数中（sandbox.ts / proxy-sandbox.ts / iframe-sandbox.ts）
 *
 * **落地收益**：
 * - AppInstance 中 `sandbox` / `proxySandbox` / `iframeSandbox` 三字段
 *   合并为单一 `strategy: SandboxStrategy`
 * - scheduler.ts 无需 switch(sandboxType) 分支，单一调用 `strategy.mount()` / `strategy.unmount()`
 * - 后续增加新沙箱模式只需实现本接口 + 添加 create 函数，符合 OCP
 *
 * @path comm/effects/micro-kernel/src/sandbox-strategy.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import { enterSandbox, exitSandbox } from './sandbox';
import type { SandboxInstance } from './sandbox';
import type { GlobalStateBridge } from './scheduler';

// v4.2.1 N11: proxy / iframe 沙箱改为动态导入（按需加载）。
// snapshot 沙箱为默认路径保持静态，减少默认包体积。
// 类型仍以 type-only import 保留（不产生运行时依赖）。
import type { ProxySandboxInstance } from './proxy-sandbox';
import type { IframeSandboxInstance } from './iframe-sandbox';

/**
 * 沙箱公共生命周期操作。
 *
 * 三种沙箱模式必须实现的契约：
 * - mount: 进入沙箱（快照恢复、iframe 激活等）
 * - unmount: 退出沙箱（清理副作用、还原 window 等）
 * - activate: keep-alive 恢复时的轻量激活（DOM 节点重新挂载时）
 * - cleanup: 完全释放资源（应用被卸载销毁时）
 */
export interface SandboxStrategy {
  /** 沙箱类型标识 */
  readonly type: 'snapshot' | 'proxy' | 'iframe';
  /** 进入/重新挂载子应用（mount 前调用） */
  mount(): void;
  /** 子应用 unmount 后调用，清理本次挂载副作用 */
  unmount(): void;
  /** keep-alive 恢复时的轻量激活（DOM 节点重新挂载时） */
  activate(): void;
  /** 彻底销毁沙箱（应用从 kernel 移除时调用） */
  cleanup(): void;
}

// ==================== 适配器实现 ====================

/**
 * 快照沙箱适配器。
 *
 * 将 sandbox.ts 的 enterSandbox/exitSandbox 封装为 SandboxStrategy。
 * mount 时 enter，unmount 时 exit。
 */
export class SnapshotSandboxStrategy implements SandboxStrategy {
  readonly type = 'snapshot' as const;

  private sandbox: SandboxInstance | null = null;

  mount(): void {
    this.sandbox = enterSandbox();
  }

  unmount(): void {
    if (!this.sandbox) return;
    exitSandbox(this.sandbox);
    this.sandbox = null;
  }

  activate(): void {
    // 快照沙箱 keep-alive 不涉及"激活"逻辑（DOM 节点重新挂载即激活）
    // 此方法留空，保持接口统一
  }

  cleanup(): void {
    this.unmount();
  }

  /** 获取内部 SandboxInstance（供需要直接访问 snapshot 的场景） */
  getSandboxInstance(): SandboxInstance | null {
    return this.sandbox;
  }
}

/**
 * Proxy 沙箱适配器。
 *
 * 直接包装 ProxySandboxInstance 的生命周期方法。
 */
export class ProxySandboxStrategy implements SandboxStrategy {
  readonly type = 'proxy' as const;

  constructor(private readonly proxySandbox: ProxySandboxInstance) {}

  mount(): void {
    this.proxySandbox.activate();
  }

  unmount(): void {
    this.proxySandbox.deactivate();
  }

  activate(): void {
    this.proxySandbox.activate();
  }

  cleanup(): void {
    this.proxySandbox.cleanup();
  }

  /** 获取 fakeWindow（子应用 mountProps 注入用） */
  get fakeWindow(): Record<string, unknown> {
    return this.proxySandbox.fakeWindow;
  }
}

/**
 * iframe 沙箱适配器。
 *
 * 直接包装 IframeSandboxInstance 的生命周期方法。
 * 额外提供 globalState 跨 realm 桥接能力。
 */
export class IframeSandboxStrategy implements SandboxStrategy {
  readonly type = 'iframe' as const;

  /** globalState 桥接的取消订阅函数 */
  private bridgeCleanupFn: (() => void) | null = null;

  constructor(private readonly iframeSandbox: IframeSandboxInstance) {}

  mount(): void {
    this.iframeSandbox.activate();
  }

  unmount(): void {
    this.iframeSandbox.deactivate();
  }

  activate(): void {
    this.iframeSandbox.activate();
  }

  cleanup(): void {
    // 先清理 globalState 桥接订阅
    this.removeGlobalStateBridge();
    this.iframeSandbox.cleanup();
  }

  /** 获取 contentWindow（子应用 mountProps 注入用） */
  get contentWindow(): Window | null {
    return this.iframeSandbox.contentWindow;
  }

  /** 获取 contentDocument */
  get contentDocument(): Document | null {
    return this.iframeSandbox.contentDocument;
  }

  /** 获取 iframe 内部挂载容器 */
  get container(): HTMLElement | null {
    return this.iframeSandbox.container;
  }

  /** 向子应用发送消息（globalState 同步） */
  postToChild(payload: unknown): void {
    this.iframeSandbox.postToChild(payload);
  }

  /** 注册子应用消息处理器 */
  onChildMessage(handler: (payload: unknown) => void): () => void {
    return this.iframeSandbox.onChildMessage(handler);
  }

  /** 主应用调用子应用 RPC 方法 */
  callRpc(method: string, args?: unknown[]): Promise<unknown> {
    return this.iframeSandbox.callRpc(method, args);
  }

  /** 注册主应用 API 供子应用调用 */
  registerMainApi(handlers: Record<string, (...args: unknown[]) => unknown>): () => void {
    return this.iframeSandbox.registerMainApi(handlers);
  }

  /**
   * 建立 globalState 跨 realm 桥接。
   *
   * 在 iframe 沙箱激活后调用，建立双向同步：
   * - 初始同步：把当前 globalState 快照发送给子应用
   * - 子 → 主：监听子应用回传的 setGlobalState 调用
   * - 主 → 子：订阅 globalState 变化，同步给子应用
   *
   * @param bridge - globalState 桥接接口
   * @param mountPropsProxy - 注入 mountProps 的代理 _globalState 对象
   * @returns 取消桥接函数（cleanup 时自动调用）
   */
  attachGlobalStateBridge(
    bridge: GlobalStateBridge,
    _mountPropsProxy: {
      getGlobalState: () => Record<string, unknown>;
      setGlobalState: (patch: Record<string, unknown>) => void;
      onGlobalStateChange: (listener: (state: Record<string, unknown>) => void, fireImmediately?: boolean) => () => void;
    },
  ): () => void {
    // 1. 初始同步：把当前 globalState 快照发送给子应用
    this.iframeSandbox.postToChild(bridge.getGlobalState());
    // 2. 子 → 主：监听子应用回传的 setGlobalState 调用
    const unsubChild = this.iframeSandbox.onChildMessage((patch) => {
      if (patch && typeof patch === 'object') {
        bridge.setGlobalState(patch as Record<string, unknown>);
      }
    });
    // 3. 主 → 子：订阅 globalState 变化，同步给子应用
    const unsubMain = bridge.onGlobalStateChange((state) => {
      this.iframeSandbox?.postToChild(state);
    });

    const cleanup = () => {
      unsubChild();
      unsubMain();
    };
    this.bridgeCleanupFn = cleanup;
    return cleanup;
  }

  /** 移除 globalState 桥接（cleanup 内部调用） */
  removeGlobalStateBridge(): void {
    if (this.bridgeCleanupFn) {
      this.bridgeCleanupFn();
      this.bridgeCleanupFn = null;
    }
  }
}

/**
 * 创建沙箱策略实例的工厂函数。
 *
 * v4.2.1 N11: 根据 sandboxType 选择对应沙箱：
 * - snapshot（默认）→ 静态创建，无额外加载
 * - proxy / iframe → 动态 import 对应模块（按需加载，减小默认包体积）
 *
 * 返回 Promise（动态导入异步）。
 *
 * @param type - 沙箱类型
 * @param appName - 应用名（传递给底层 create 函数）
 * @param parentEl - 父容器（iframe 沙箱需要）
 * @returns 统一的 SandboxStrategy 实例
 */
export async function createSandboxStrategy(
  type: 'snapshot' | 'proxy' | 'iframe',
  appName: string,
  parentEl: HTMLElement,
  devUrl?: string,
): Promise<SandboxStrategy> {
  switch (type) {
    case 'snapshot':
      return new SnapshotSandboxStrategy();
    case 'proxy': {
      const { createProxySandbox } = await import('./proxy-sandbox');
      return new ProxySandboxStrategy(createProxySandbox(appName));
    }
    case 'iframe': {
      const { createIframeSandbox } = await import('./iframe-sandbox');
      return new IframeSandboxStrategy(
        createIframeSandbox(appName, parentEl, devUrl),
      );
    }
    default:
      // 回退到快照沙箱
      return new SnapshotSandboxStrategy();
  }
}
