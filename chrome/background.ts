/**
 * Background Service Worker（MV3）
 *
 * 微前端 DevTools 扩展的后台核心，职责：
 * 1. 维护已注入 content-script 的 tab 连接池（conns Map）
 * 2. 缓存来自页面的 micro-kernel 运行时状态快照（cache Map，TTL 30s）
 * 3. 接收 content-script 转发来的诊断事件，统一广播到所有已连接的 DevTools 面板
 * 4. 路由 DevTools 面板下发的命令到指定 tab 的 content-script
 *
 * 消息协议（统一通道 "__YDSZ_MICRO_KERNEL__CHANNEL"）：
 *   page  ──► content-script ──► background ──► DevTools panel
 *   DevTools ──► background ──► content-script ──► page
 *
 * 关键事件：
 *   - content-script:content-script:ready: content-script 注入完成
 *   - kernel:state:response / kernel:event: 运行时状态与生命周期事件
 *   - devtools:command: 用户从面板触发的操作（卸载/重载/清缓存/健康检查）
 *
 * @path chrome/background.ts
 * @author ydsz-team
 * @since 4.0.0
 */

export {};

interface ConnectionRecord {
  url: string | undefined;
  ts: number;
}

const conns = new Map<number, ConnectionRecord>();
const cache = new Map<string, Record<string, unknown> & { _t: number }>();

function getCached(): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  const now = Date.now();
  cache.forEach((v, k) => {
    if (now - v._t < 30000) o[k] = v;
  });
  return o;
}

function bcast(type: string, payload: unknown, _id?: string): void {
  void chrome.runtime
    .sendMessage<unknown>({ target: 'devtools', type, payload, _id } as never)
    .catch(() => {
      /* DevTools panel 可能已关闭，忽略 */
    });
}

interface BackgroundMessage {
  target: string;
  type: string;
  payload?: Record<string, unknown>;
  tabId?: number;
  _id?: string;
}

chrome.runtime.onMessage.addListener(
  (
    msg: BackgroundMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): boolean | void => {
    if (msg.target !== 'background') return false;

    switch (msg.type) {
      case 'content-script:ready': {
        if (sender.tab && sender.tab.id) {
          conns.set(sender.tab.id, {
            url: msg.payload?.url as string | undefined,
            ts: Date.now(),
          });
          bcast('kernel:tab:activated', { tabId: sender.tab.id });
        }
        sendResponse({ ok: true });
        break;
      }
      case 'kernel:state:response':
      case 'kernel:health:response':
      case 'kernel:event':
      case 'kernel:memory': {
        if (msg.payload && msg.payload.appName) {
          const key = String(msg.payload.appName);
          const existing = cache.get(key) ?? {};
          cache.set(key, Object.assign(existing, msg.payload, { _t: Date.now() }) as never);
        } else {
          cache.set('aggregate', Object.assign({}, msg.payload, { _t: Date.now() }) as never);
        }
        bcast(msg.type, msg.payload, msg._id);
        sendResponse({ ok: true });
        break;
      }
      case 'devtools:command': {
        const tabId = msg.tabId;
        if (tabId === undefined) {
          sendResponse({ ok: false, error: 'missing tabId' });
          break;
        }
        void chrome.tabs
          .sendMessage<unknown>(
            tabId,
            { target: 'content-script', type: msg.type, payload: msg.payload } as never
          )
          .then(sendResponse)
          .catch((e: Error) => {
            sendResponse({ ok: false, error: e.message });
          });
        return true; // 保持消息通道异步开启
      }
      case 'devtools:subscribe': {
        sendResponse({ ok: true, cached: getCached() });
        break;
      }
      default: {
        sendResponse({ ok: false, error: `unknown: ${msg.type}` });
      }
    }
  }
);

chrome.tabs.onRemoved.addListener((id) => {
  conns.delete(id);
  bcast('kernel:tab:deactivated', { tabId: id });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'micro-kernel-devtools') return;
  port.onMessage.addListener((m: { type: string }) => {
    if (m.type === 'ping') port.postMessage({ type: 'pong' });
    if (m.type === 'getState') port.postMessage({ type: 'state:snapshot', data: getCached() });
  });
});

/* 监听 tab 激活时推送快照 */
chrome.tabs.onActivated.addListener((activeInfo) => {
  const snap = getCached();
  if (Object.keys(snap).length > 0) {
    bcast('kernel:state:response', { aggregate: snap, _fromTab: activeInfo.tabId });
  }
});
