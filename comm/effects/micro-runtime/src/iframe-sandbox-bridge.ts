/**
 * iframe 沙箱工厂注册桥 — micro-runtime 与 micro-kernel 的依赖倒置点。
 *
 * **背景（依赖方向约束）**：
 * 分层上 micro-runtime 是底层契约层，micro-kernel 是高层实现层，
 * 依赖方向必须为 kernel → runtime 单向。历史上 create-react-sub-app
 * 直接静态 import kernel 的 createIframeSandbox，造成 package 级循环
 * 依赖，turbo 构建直接报错（Cyclic dependency detected）。
 *
 * **解决方案**：
 * runtime 仅定义沙箱工厂的结构化契约与注册表；kernel 在被加载时把
 * createIframeSandbox 注册进来。createReactSubApp 运行时从注册表
 * 取工厂，未注册时抛出带指引的错误。
 *
 * @path comm/effects/micro-runtime/src/iframe-sandbox-bridge.ts
 * @author ydsz-ai
 * @since 5.1.0
 */

/**
 * iframe 沙箱实例的最小结构契约（结构化类型，与 kernel 实现解耦）。
 *
 * 仅声明 createReactSubApp 实际消费的成员；kernel 侧的
 * IframeSandboxInstance 天然满足该结构。
 */
export interface IframeSandboxLike {
  /** iframe 内的挂载容器（ESM hosted 模式下由沙箱创建） */
  container: HTMLElement | null;
  /** iframe 的 contentWindow，用于读取桥接注入的全局状态 */
  contentWindow: Window | null;
  /** 激活沙箱（写入文档、注入桥接脚本等） */
  activate(): void;
  /** 停用沙箱 */
  deactivate(): void;
  /** 清理 DOM 与监听器 */
  cleanup(): void;
  /** 跨 realm RPC 调用主应用暴露的 API */
  callRpc(method: string, args: unknown[]): Promise<unknown>;
  /** 向 iframe 子环境发送消息 */
  postToChild(payload: unknown): void;
}

/** 沙箱工厂签名，对齐 kernel 的 createIframeSandbox(appName, parentEl) */
export type IframeSandboxFactory = (
  appName: string,
  parentEl: HTMLElement,
) => IframeSandboxLike;

let factory: IframeSandboxFactory | null = null;

/**
 * 注册 iframe 沙箱工厂（由 micro-kernel 在模块加载时调用）。
 *
 * @param impl - kernel 提供的 createIframeSandbox 实现
 */
export function registerIframeSandboxFactory(impl: IframeSandboxFactory): void {
  factory = impl;
}

/**
 * 获取已注册的 iframe 沙箱工厂。
 *
 * @throws 未注册时抛错，指引先加载 micro-kernel
 */
export function resolveIframeSandboxFactory(): IframeSandboxFactory {
  if (!factory) {
    throw new Error(
      "[ReactSubApp] iframe 沙箱工厂未注册：请确保应用已加载 @ydsz/micro-kernel" +
        "（其模块初始化会调用 registerIframeSandboxFactory），" +
        "或手动调用 registerIframeSandboxFactory 注入自定义实现。",
    );
  }
  return factory;
}

/** 测试/热更新场景重置注册表 */
export function resetIframeSandboxFactory(): void {
  factory = null;
}
