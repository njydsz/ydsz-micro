/**
 * React 子应用适配器的类型定义。
 *
 * @path comm/effects/micro-runtime/src/types-react-sub-app.ts
 * @author ydsz-ai
 * @since 5.0.0
 */

/**
 * React 子应用挂载上下文。
 *
 * 传递给 mount 回调——React 组件树应挂载到 container，
 * 通过 callMain 调用主应用暴露的能力。
 */
export interface ReactSubAppMountContext {
  /** iframe 内的容器 div（React 组件树应挂载到此） */
  container: HTMLElement;
  /** 全局状态快照（由主应用同步，只读） */
  globalState: Record<string, unknown>;
  /** 调用主应用通过 registerMainApi 注册的方法 */
  callMain: (method: string, args?: unknown[]) => Promise<unknown>;
}

/**
 * React 子应用 mount 回调。
 *
 * 在 iframe 沙箱已创建并注入桥接脚本后调用，
 * 返回 unmount 清理函数。
 */
export type ReactSubAppMountFn = (
  ctx: ReactSubAppMountContext,
) => (() => void) | Promise<() => void>;

/**
 * createReactSubApp 配置选项。
 */
export interface ReactSubAppOptions {
  /** 子应用名称（唯一标识） */
  name?: string;
  /**
   * React 挂载回调。
   *
   * 在 iframe 沙箱就绪后调用，应完成 React 组件树挂载。
   * 返回的清理函数将在 unmount 时被调用。
   */
  mount: ReactSubAppMountFn;
  /**
   * 可选的样式表 URLs（注入 iframe 以保证视觉一致性）。
   *
   * 传入时将自动注入到 iframe 的 head 中。
   */
  stylesheets?: string[];
}

/**
 * React 子应用句柄（与 micro-runtime 子应用生命周期接口兼容）。
 */
export interface ReactSubAppHandle {
  /** 应用名 */
  name: string;
  /** 挂载 */
  mount: (props?: Record<string, unknown>) => Promise<void>;
  /** 卸载 */
  unmount: (props?: Record<string, unknown>) => Promise<void>;
  /** 更新 props */
  update?: (props?: Record<string, unknown>) => Promise<void>;
}
