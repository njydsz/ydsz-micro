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
 * @path chrome/background.js
 * @author ydsz-team
 * @since 4.0.0
 */
var conns = new Map();
var cache = new Map();

function getCached() {
  var o = {}; var now = Date.now();
  cache.forEach(function (v, k) { if (now - v._t < 30000) o[k] = v; });
  return o;
}
function bcast(type, payload, _id) {
  chrome.runtime.sendMessage({ target: 'devtools', type: type, payload: payload, _id: _id }).catch(function () {});
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.target !== 'background') return false;
  switch (msg.type) {
    case 'content-script:ready':
      if (sender.tab && sender.tab.id) {
        conns.set(sender.tab.id, { url: msg.payload && msg.payload.url, ts: Date.now() });
        bcast('kernel:tab:activated', { tabId: sender.tab.id });
      }
      sendResponse({ ok: true });
      break;
    case 'kernel:state:response':
    case 'kernel:health:response':
    case 'kernel:event':
    case 'kernel:memory':
      if (msg.payload && msg.payload.appName) {
        var existing = cache.get(msg.payload.appName) || {};
        cache.set(msg.payload.appName, Object.assign(existing, msg.payload, { _t: Date.now() }));
      } else {
        cache.set('aggregate', Object.assign({}, msg.payload, { _t: Date.now() }));
      }
      bcast(msg.type, msg.payload, msg._id);
      sendResponse({ ok: true });
      break;
    case 'devtools:command': {
      var tabId = msg.tabId;
      chrome.tabs.sendMessage(tabId, { target: 'content-script', type: msg.type, payload: msg.payload })
        .then(sendResponse)
        .catch(function (e) { sendResponse({ ok: false, error: e.message }); });
      return true;
    }
    case 'devtools:subscribe':
      sendResponse({ ok: true, cached: getCached() });
      break;
    default:
      sendResponse({ ok: false, error: 'unknown: ' + msg.type });
  }
});

chrome.tabs.onRemoved.addListener(function (id) {
  conns.delete(id);
  bcast('kernel:tab:deactivated', { tabId: id });
});

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name !== 'micro-kernel-devtools') return;
  port.onMessage.addListener(function (m) {
    if (m.type === 'ping') port.postMessage({ type: 'pong' });
    if (m.type === 'getState') port.postMessage({ type: 'state:snapshot', data: getCached() });
  });
});

/* 监听 tab 激活时推送快照 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
  var snap = getCached();
  if (Object.keys(snap).length) bcast('kernel:state:response', { aggregate: snap, _fromTab: activeInfo.tabId });
});
