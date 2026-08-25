/**
 * iframe 桥接脚本注入
 *
 * 从 iframe-sandbox.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/iframe-bridge.ts
 * @author ydsz-team
 * @since 3.6.0
 */

import { BRIDGE_MARK } from './iframe-types';

/**
 * 在 iframe 内注入桥接监听器脚本。
 *
 * 注入的脚本在 iframe realm 中执行，监听 `message` 事件：
 * - 收到 `state-sync` 消息时，将 payload 写入 `window.__MICRO_GLOBAL_STATE__`
 * - 暴露 `window.__MICRO_SET_GLOBAL_STATE__(patch)` 供子应用调用，
 *   该方法通过 postMessage 回传 `state-set` 给主应用
 * - 暴露 `window.__MICRO_CALL_MAIN__(method, args)`：子 → 主 RPC 调用（Promise 化）
 * - 暴露 `window.__MICRO_REGISTER_API__(handlers)`：注册子应用 API，供主应用调用
 * - 监听 `rpc-call` 消息：主 → 子 RPC 调用，匹配已注册的 handler 并回传结果
 *
 * 子应用代码通过 `mountProps.iframeWindow.__MICRO_GLOBAL_STATE__` 读取同步过来的状态，
 * 通过 `mountProps.iframeWindow.__MICRO_SET_GLOBAL_STATE__({ key: value })` 回写，
 * 通过 `mountProps.iframeWindow.__MICRO_CALL_MAIN__('method', [args])` 调用主应用能力。
 *
 * v4.3.0 安全加固：postMessage targetOrigin 由通配 `'*'` 收敛为宿主精确 origin。
 * 注入脚本时在主 realm 计算 `window.location.origin`（即宿主 origin），
 * 子 → 主消息一律携带该精确 targetOrigin，杜绝任意第三方页面注入消息。
 * about:blank iframe 继承宿主 origin，devUrl（跨源）模式下 targetOrigin 同样为
 * 宿主 origin（浏览器按目标窗口真实 origin 校验），两种模式均正确。
 *
 * @since 3.6.0
 * @param iframeWin - iframe 的 contentWindow
 */
export function injectBridgeScript(iframeWin: Window): void {
  // 在 iframe document 中注入 <script>，确保代码在 iframe realm 执行
  const iframeDoc = iframeWin.document;
  // v4.3.0: 宿主精确 origin（file:// / sandbox 等 origin 为 'null' 时回退 '*'）
  const origin = window.location.origin;
  const targetOrigin = origin && origin !== "null" ? origin : "*";
  const script = iframeDoc.createElement("script");
  script.textContent = `
    (function() {
      // 当前 globalState 快照（由主应用同步过来）
      window.__MICRO_GLOBAL_STATE__ = {};

      // v4.3.0: 子 → 主消息目标 origin（主 realm 注入，精确到宿主 origin）
      var __TARGET_ORIGIN__ = ${JSON.stringify(targetOrigin)};

      // 子应用调用此方法回写状态到主应用
      window.__MICRO_SET_GLOBAL_STATE__ = function(patch) {
        window.parent.postMessage({
          ${BRIDGE_MARK}: true,
          type: 'state-set',
          payload: patch
        }, __TARGET_ORIGIN__);
      };

      // ===== RPC 协议 v3.6.1 增强 =====
      // 子应用注册给主应用调用的 API 处理器
      window.__MICRO_REGISTERED_API__ = {};
      window.__MICRO_REGISTER_API__ = function(handlers) {
        window.__MICRO_REGISTERED_API__ = handlers || {};
      };

      // 子应用 → 主应用 RPC 调用（返回 Promise）
      var __rpcSeq__ = 0;
      var __pendingCalls__ = {};
      window.__MICRO_CALL_MAIN__ = function(method, args) {
        return new Promise(function(resolve, reject) {
          var callId = 'm' + (++__rpcSeq__);
          __pendingCalls__[callId] = { resolve: resolve, reject: reject };
          window.parent.postMessage({
            ${BRIDGE_MARK}: true,
            type: 'rpc-call',
            payload: { method: method, args: args || [], callId: callId }
          }, __TARGET_ORIGIN__);
        });
      };

      // 主 → 子 RPC 调用处理：执行后回传结果
      window.__MICRO_EXECUTE_RPC__ = function(payload) {
        var handler = window.__MICRO_REGISTERED_API__[payload.method];
        var result;
        var ok = true;
        var error;
        if (typeof handler !== 'function') {
          ok = false;
          error = 'RPC method not found: ' + payload.method;
        } else {
          try {
            result = handler.apply(null, payload.args || []);
          } catch (e) {
            ok = false;
            error = String(e && e.message || e);
          }
        }
        // 支持 Promise 返回值
        if (ok && result && typeof result.then === 'function') {
          result.then(function(value) {
            window.parent.postMessage({
              ${BRIDGE_MARK}: true,
              type: 'rpc-result',
              payload: { callId: payload.callId, ok: true, result: value }
            }, __TARGET_ORIGIN__);
          }).catch(function(err) {
            window.parent.postMessage({
              ${BRIDGE_MARK}: true,
              type: 'rpc-result',
              payload: { callId: payload.callId, ok: false, error: String(err && err.message || err) }
            }, __TARGET_ORIGIN__);
          });
          return;
        }
        window.parent.postMessage({
          ${BRIDGE_MARK}: true,
          type: 'rpc-result',
          payload: { callId: payload.callId, ok: ok, result: result, error: error }
        }, __TARGET_ORIGIN__);
      };

      // 监听主应用发来的消息（v4.3.0: 校验消息来源为父窗口）
      window.addEventListener('message', function(event) {
        if (event.source !== window.parent) return;
        var data = event.data;
        if (!data || data.${BRIDGE_MARK} !== true) return;
        if (data.type === 'state-sync') {
          window.__MICRO_GLOBAL_STATE__ = data.payload || {};
        } else if (data.type === 'rpc-call') {
          window.__MICRO_EXECUTE_RPC__(data.payload);
        } else if (data.type === 'rpc-result') {
          var pending = __pendingCalls__[data.payload.callId];
          if (pending) {
            delete __pendingCalls__[data.payload.callId];
            if (data.payload.ok) {
              pending.resolve(data.payload.result);
            } else {
              pending.reject(new Error(data.payload.error || 'RPC call failed'));
            }
          }
        }
      });
    })();
  `;
  iframeDoc.head.append(script);
  script.remove();
}
