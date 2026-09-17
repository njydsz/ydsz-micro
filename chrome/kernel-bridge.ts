/**
 * Page-Side Bridge —— 注入到主文档的微前端事件桥
 *
 * 负责将主应用 micro-kernel 的生命周期事件和运行时状态推送到 Chrome Extension。
 * 由 content-script.ts 通过 <script> 标签注入，运行在页面 JS 上下文中（非隔离沙箱），
 * 因此可访问 window / CustomEvent API 与 content-script 通信。
 *
 * 对外暴露的全局 API：
 *   - window.__sendToExtension(type, payload)      推送事件到扩展
 *   - window.__markExtensionActive()               标记扩展已就绪
 *   - window.__extensionPresent()                  检查扩展是否已注入
 *   - window.__KERNEL_BRIDGE__                     桥接配置（channel、NAMESPACE）
 *
 * 通信机制：
 *   1. postMessage + 自定义 CustomEvent（双通道冗余，确保事件不丢失）
 *   2. 所有消息通过 "__YDSZ_MICRO_KERNEL__CHANNEL" channel 标识
 *
 * @path chrome/kernel-bridge.ts
 * @author ydsz-team
 * @since 4.0.0
 */

const NS = '__YDSZ_MICRO_KERNEL__';
const CH = `${NS}_CHANNEL`;

interface BridgeConfig {
  channel: string;
  NAMESPACE: string;
}

interface KernelBridgeMessage {
  channel: string;
  source: 'page';
  type: string;
  payload?: unknown;
  _t: number;
}

interface BridgeGlobals {
  __sendToExtension(type: string, payload?: unknown): void;
  __markExtensionActive(): void;
  __extensionPresent(): boolean;
  __KERNEL_BRIDGE__: BridgeConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = window as typeof window & BridgeGlobals & { [key: string]: any };

g.__sendToExtension = (type: string, payload?: unknown): void => {
  const msg: KernelBridgeMessage = { channel: CH, source: 'page', type, payload, _t: Date.now() };
  g.postMessage(msg, '*');
  g.dispatchEvent(new g.CustomEvent(`${NS}:out`, { detail: { type, payload } }));
};

g.__markExtensionActive = (): void => {
  g[`${NS}_ACTIVE__`] = true;
};

g.__extensionPresent = (): boolean => {
  return !!g[`${NS}_ACTIVE__`];
};

g.__KERNEL_BRIDGE__ = { channel: CH, NAMESPACE: NS };
