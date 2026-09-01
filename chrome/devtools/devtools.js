/**
 * DevTools Entry —— Chrome DevTools 自定义面板注册入口
 *
 * 在 Chrome DevTools 中创建名为 "Micro Kernel" 的自定义面板，承载 panel.html。
 * 面板（panel.js）独立运行在此 sandbox 中，通过 chrome.runtime 与 background 通信。
 *
 * 职责：
 *   - 注册面板并定义图标（panel.html）
 *   - 监听后台推送给 devtools target 的消息
 *   - 在面板显示/隐藏时触发后台的 subscribe / lost-focus 事件
 *
 * 消息流（简化）：
 *   background ──► devtools.js runtime.onMessage ──► postMessage ──► inspectedWindow.eval ──► panel.js
 *
 * 注意：DevTools Panel 与 background 隔离，消息必须经过 inspectedWindow.eval 转发。
 *
 * @path chrome/devtools/devtools.js
 * @author ydsz-team
 * @since 4.0.0
 */
chrome.devtools.panels.create(
  'Micro Kernel',
  '',
  'devtools/panel.html',
  function (panel) {
    console.log('[YDSZ] Micro Kernel panel created');

    // 监听 Extension -> DevTools 的消息
    chrome.runtime.onMessage.addListener(function (msg) {
      if (msg.target !== 'devtools') return;
      // 通过 inspectedWindow.eval 转发到页面（因 DevTools Panel 与 background 隔离）
      var jsonStr = JSON.stringify(msg).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      var code = "window.postMessage({ source: 'ext-bg', detail: " + jsonStr + " }, '*')";
      chrome.devtools.inspectedWindow.eval(code).catch(function () {});
    });

    // Panel 可见性变化
    panel.onShown.addListener(function () {
      // 拉取最新缓存
      chrome.runtime.sendMessage({
        target: 'background',
        type: 'devtools:subscribe',
        tabId: chrome.devtools.inspectedWindow.tabId
      });
    });
    panel.onHidden.addListener(function () {
      chrome.runtime.sendMessage({ target: 'background', type: 'devtools:lost-focus' });
    });
  }
);
