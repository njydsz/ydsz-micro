/**
 * iframe 沙箱 — 基于 iframe contentWindow 的强隔离兜底方案
 *
 * **设计定位**：
 * 快照沙箱（防意外污染）和 Proxy 沙箱（fakeWindow 数据隔离）均运行在主窗口
 * 同一 realm，无法隔离 CSS 与 DOM 全局选择器。iframe 沙箱通过创建独立的
 * 浏览上下文（browsing context）提供 **CSS + DOM + window** 三重隔离，
 * 作为强隔离需求的兜底方案。
 *
 * **ESM 边界说明**：
 * 与 Proxy 沙箱相同，子应用通过 ESM `dynamic import()` 加载，模块代码在
 * 主 realm 执行而非 iframe 内。因此 iframe 沙箱在本项目中提供：
 * - **CSS 隔离**：将子应用挂载容器移入 iframe document，样式选择器天然隔离
 * - **DOM 隔离**：iframe 有独立 document，querySelector 等不跨域
 * - **fakeWindow**：iframe 的 contentWindow 可作为 mountProps 注入的隔离 window
 *
 * **跨 realm 通信（v3.6.0 新增）**：
 * 由于 iframe 有独立 realm，主应用直接传给子应用的 `_globalState` 对象
 * 在跨 realm 调用时可能引发异常（如 instanceof 失效、原型链不一致）。
 * 本沙箱内置 postMessage 桥接协议：
 * - 主侧通过 `postToChild(payload)` 发送 globalState 快照
 * - 子侧通过监听 `message` 事件接收，并回传 `setGlobalState` 调用
 * - 协议消息含 `__MICRO_KERNEL_BRIDGE__: true` 标记 + `type` + `payload`
 * - 主侧维护 childMessageHandler，由 kernel 注入 globalState 同步逻辑
 *
 * 为控制单文件行数，RPC 桥接实现已提取至 iframe-rpc.ts，
 * 本文件专注于沙箱 DOM 管理与实例生命周期。
 *
 * **适用场景**：
 * - 子应用使用全局 CSS 选择器（如 `body { ... }`）可能与主应用冲突时
 * - 需要完全独立的 document 环境的第三方子应用
 * - snapshot/proxy 沙箱隔离不足时的兜底降级
 *
 * **限制**：
 * - iframe 创建有额外开销（首次约 10-30ms）
 * - 弹窗/抽屉等 fixed 定位元素会被限制在 iframe 视口内
 *
 * **对标实现**：
 * - wujie（iframe + webcomponent 方案，本项目精简为纯 iframe 容器）
 * - micro-app（webcomponent + iframe scope，本项目仅取 iframe window 隔离）
 *
 * @path comm/effects/micro-kernel/src/iframe-sandbox.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import {
  DEFAULT_RPC_CONFIG,
  IFRAME_STYLE,
  type IframeRpcConfig,
  type IframeSandboxInstance,
} from "./iframe-types";
import { injectBridgeScript } from "./iframe-bridge";
import { createIframeRpc } from "./iframe-rpc";
import { createLogger } from "@YDSZ-core/shared/utils";

// 重新导出类型，保持向后兼容
export type {
  IframeSandboxInstance,
  IframeRpcConfig,
} from "./iframe-types";
export type {
  BridgeMessage,
  BridgeMessageType,
  RpcCallPayload,
  RpcResultPayload,
} from "./iframe-types";

const logger = createLogger("MicroKernel:IframeSandbox");

/**
 * 创建 iframe 沙箱实例。
 *
 * 在指定的父容器内创建一个隐藏 iframe，iframe 加载空白文档后，
 * 将主应用的基础样式（CSS 变量、reset 等）注入 iframe document，
 * 并在 iframe 内创建一个挂载容器元素供子应用渲染。
 *
 * P2-1: 支持 `devUrl` 参数 — 在 dev 模式下加载子应用 dev server 入口，
 * 使子应用在独立 realm 完整运行（独立 dev server + HMR），方便调试。
 *
 * @param appName - 子应用名称（用于调试与 iframe title 属性）
 * @param parentEl - 父容器元素，iframe 将挂载到此元素内
 * @param devUrl - 【可选】开发模式下子应用 dev server 的完整 URL（如 //localhost:5601/）
 *   传入时 iframe 将加载此地址而非 about:blank，子应用在 iframe 内独立运行
 * @param rpcConfig - RPC 配置（超时、重试策略）
 * @returns iframe 沙箱实例
 */
export function createIframeSandbox(
  appName: string,
  parentEl: HTMLElement,
  devUrl?: string,
  rpcConfig?: IframeRpcConfig,
): IframeSandboxInstance {
  // P1-3: 合并 RPC 配置
  const rpc: Required<IframeRpcConfig> = {
    timeout: rpcConfig?.timeout ?? DEFAULT_RPC_CONFIG.timeout,
    retry: {
      enabled: rpcConfig?.retry?.enabled ?? DEFAULT_RPC_CONFIG.retry.enabled,
      maxRetries:
        rpcConfig?.retry?.maxRetries ?? DEFAULT_RPC_CONFIG.retry.maxRetries,
      baseDelay:
        rpcConfig?.retry?.baseDelay ?? DEFAULT_RPC_CONFIG.retry.baseDelay,
      isIdempotent:
        rpcConfig?.retry?.isIdempotent ?? DEFAULT_RPC_CONFIG.retry.isIdempotent,
    },
  };
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-label", `sub-app-${appName}`);
  iframe.dataset.microSandbox = "iframe";
  iframe.setAttribute("style", IFRAME_STYLE);

  // P2-1: dev 模式下加载子应用 dev server，实现独立 realm 完整运行
  const isDevUrl = devUrl && import.meta.env.DEV;
  if (isDevUrl) {
    iframe.setAttribute("src", devUrl);
    iframe.dataset.iframeMode = "standalone-dev";
  } else {
    // 使用 about:blank 避免额外网络请求，文档立即可用
    iframe.setAttribute("src", "about:blank");
    iframe.dataset.iframeMode = "esm-hosted";
  }

  parentEl.append(iframe);

  // 同步等待 iframe document 就绪（about:blank 在同源下立即可用）
  const contentWindow = iframe.contentWindow;
  // P2-1: dev 模式下 iframe 跨 realm，contentDocument 无法同步访问，需要异步等待
  const contentDocument = isDevUrl ? null : iframe.contentDocument;

  // P2-1: devUrl 模式下 contentDocument 为 null（跨 realm 异步加载），仅校验 contentWindow
  if (!contentWindow) {
    // 极端情况下 iframe 未就绪，移除并回退
    iframe.remove();
    throw new Error(
      `[IframeSandbox:${appName}] Failed to access iframe contentWindow`,
    );
  }

  // P2-1: dev 模式下 iframe 已加载子应用完整 SPA，无需注入桥接脚本和创建容器
  let container: HTMLElement | null = null;

  if (!isDevUrl) {
    // === ESM hosted 模式：about:blank + 主 realm 执行 ESM ===

    if (!contentDocument) {
      iframe.remove();
      throw new Error(
        `[IframeSandbox:${appName}] Failed to access iframe contentDocument`,
      );
    }

    // 写入基础 HTML 结构，确保有 body 可用
    contentDocument.open();
    contentDocument.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body></body></html>',
    );
    contentDocument.close();

    // 复制主应用的基础样式表到 iframe（CSS 变量、设计令牌等）
    // 仅复制 <style> 和 <link> 中带 data-shared-style 标记的，避免全量复制
    try {
      const sharedStyles = document.querySelectorAll(
        "style[data-shared-style], link[data-shared-style]",
      );
      sharedStyles.forEach((node) => {
        contentDocument.head.append(node.cloneNode(true));
      });
    } catch {
      // 样式复制失败不阻断沙箱创建
    }

    // 在 iframe body 内创建挂载容器
    container = contentDocument.createElement("div");
    container.setAttribute("id", "subapp-container");
    container.dataset.microApp = appName;
    contentDocument.body.append(container);

    // v3.6.0: 注入 postMessage 桥接脚本，建立跨 realm 通信通道
    injectBridgeScript(contentWindow);
  }
  // 注：dev 模式下 postMessage 桥接由子应用自行监听 message 事件处理

  // v3.6.0/v3.6.1: 创建 RPC 桥接子系统（跨 realm 通信核心）
  // v4.3.0: 通道加固 — 精确 targetOrigin + 接收侧 origin 白名单
  //   about:blank 模式：子窗口继承宿主 origin
  //   standalone-dev 模式：子窗口 origin 为 devUrl 的 origin
  const childOrigin = isDevUrl
    ? new URL(devUrl!, window.location.href).origin
    : window.location.origin;
  const rpcBridge = createIframeRpc(contentWindow, rpc, {
    targetOrigin: childOrigin,
    expectedOrigins: [childOrigin],
  });

  // 主侧监听 iframe 发来的消息（通过 postMessage 回传）
  window.addEventListener("message", rpcBridge.onMessage);

  let isActive = false;
  let cleaned = false;

  return {
    contentWindow,
    contentDocument,
    container,

    activate() {
      if (isActive || cleaned) return;
      isActive = true;
      if (!import.meta.env.PROD) {
        logger.debug(`[IframeSandbox:${appName}] Activated`);
      }
    },

    deactivate() {
      if (!isActive || cleaned) return;
      isActive = false;
      if (!import.meta.env.PROD) {
        logger.debug(`[IframeSandbox:${appName}] Deactivated`);
      }
    },

    cleanup() {
      if (cleaned) return;
      cleaned = true;
      isActive = false;

      // v3.6.0: 移除主侧 message 监听器，避免内存泄漏
      window.removeEventListener("message", rpcBridge.onMessage);
      // v3.6.1: 清理 RPC 子系统（含待响应请求 + childMessageHandlers）
      rpcBridge.cleanupRpc(appName);

      // P2-1: dev 模式下 contentDocument 不可访问，跳过清理
      if (!isDevUrl) {
        // 清空 iframe 内容并移除
        try {
          contentDocument?.write("");
          contentDocument?.close();
        } catch {
          // 忽略清理异常
        }
      }
      iframe.remove();

      if (!import.meta.env.PROD) {
        logger.debug(`[IframeSandbox:${appName}] Cleaned up`);
      }
    },

    // v3.6.0: 主 → 子 消息发送
    postToChild(payload: unknown): void {
      if (cleaned) return;
      rpcBridge.postToChild(payload);
    },

    // v3.6.0: 注册子 → 主 消息处理器
    onChildMessage(handler: (payload: unknown) => void): () => void {
      return rpcBridge.onChildMessage(handler);
    },

    // v3.6.1: 主应用调用子应用 RPC 方法
    callRpc(method: string, args: unknown[] = []): Promise<unknown> {
      if (cleaned || !contentWindow) {
        throw new Error(`[IframeSandbox:${appName}] Sandbox is closed`);
      }
      return rpcBridge.callRpc(method, args);
    },

    // v3.6.1: 注册主应用 API 供子应用调用
    registerMainApi(
      handlers: Record<string, (...args: any[]) => unknown>,
    ): () => void {
      return rpcBridge.registerMainApi(handlers);
    },
  };
}
