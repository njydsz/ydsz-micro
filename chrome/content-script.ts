/**
 * Content Script —— 微前端 DevTools 扩展的页面注入层
 *
 * 在匹配的 tab 页面中注入，承担两项职责：
 *
 * 1. Bridge 注入：向主文档注入 kernel-bridge.js，使页面侧 micro-kernel
 *    能够通过 `window.__sendToExtension()` 主动推送事件到扩展。
 *
 * 2. 双向消息中转（event page <-> extension page）：
 *    - page -> background：监听满足 channel 条件的 window message，转发到 chrome.runtime
 *    - background -> page：监听 chrome.runtime 消息，通过 window.postMessage 下发到页面
 *
 * 安全约束（内容脚本沙箱）：
 *    - 与页面 JS 隔离运行，仅能通过 DOM/CustomEvent 与页面交互
 *    - 无法直接访问页面闭包内的变量，因此需要 bridge 桥接
 *
 * @path chrome/content-script.ts
 * @author ydsz-team
 * @since 4.0.0
 */

export {};

interface KernelMessage {
  channel: string;
  source: string;
  type: string;
  payload?: unknown;
  _id?: string;
}

interface ExtensionMessage {
  target: string;
  type: string;
  payload?: unknown;
  _id?: string;
}

const CHANNEL = '__YDSZ_MICRO_KERNEL__CHANNEL';
const NS = '__YDSZ_MICRO_KERNEL__';

/* 1. 主文档注入 kernel-bridge.ts（让页面侧微内核可以主动推送事件到 Extension） */
function injectBridge(): void {
  if (document.contentType && document.contentType !== 'text/html') return;
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('kernel-bridge.js');
  s.onload = () => {
    s.remove();
  };
  (document.head ?? document.documentElement).appendChild(s);
}
injectBridge();

/* 2. page -> background（主动推送） */
window.addEventListener('message', (e: MessageEvent) => {
  if (e.source !== window || !e.data) return;
  const data = e.data as KernelMessage;
  if (data.channel !== CHANNEL) return;
  if (data.source !== 'page') return;
  void chrome.runtime
    .sendMessage<unknown>({
      target: 'background',
      type: data.type,
      payload: data.payload,
      _id: data._id,
    } as ExtensionMessage)
    .catch(() => {
      /* background 可能暂不可达 */
    });
});

window.addEventListener(NS + ':out', (e: Event) => {
  const detail = (e as CustomEvent<{ type: string; payload?: unknown }>).detail;
  if (!detail) return;
  void chrome.runtime
    .sendMessage<unknown>({
      target: 'background',
      type: detail.type,
      payload: detail.payload,
    } as ExtensionMessage)
    .catch(() => {
      /* ignore */
    });
});

/* 3. background -> page（命令转发） */
chrome.runtime.onMessage.addListener(
  (
    msg: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): void => {
    if (msg.target !== 'content-script') return;
    window.postMessage(
      {
        channel: CHANNEL,
        source: 'extension',
        type: msg.type,
        payload: msg.payload,
        _id: msg._id,
      },
      '*'
    );
    sendResponse({ ok: true });
  }
);

/* 4. 页面就绪通知 background */
const report = (): void => {
  void chrome.runtime
    .sendMessage<unknown>({
      target: 'background',
      type: 'content-script:ready',
      payload: { url: location.href, ts: Date.now() },
    } as ExtensionMessage)
    .catch(() => {
      /* ignore */
    });
};
window.addEventListener('load', report);
setTimeout(report, 100);
