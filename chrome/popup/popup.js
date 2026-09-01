/**
 * Popup —— 微前端 DevTools 扩展的快速触达入口
 *
 * 点击扩展图标时弹出的微型面板，提供概览信息和跳转入口。
 * 与 DevTools Panel 相比，Popup 无需打开 DevTools 即可查看运行时摘要。
 *
 * 功能：
 *   - 查询当前 active tab 并请求 micro-kernel 状态快照
 *   - 显示：连接状态、活跃应用、Keep-Alive 数、总应用数、内存占用
 *   - "打开面板"按钮：引导用户按 F12 打开 DevTools（Chrome 安全限制下无法自动打开）
 *
 * 技术约束：
 *   - Popup 在关闭时销毁，不能保持长连接，仅拉取一次快照
 *   - 选择器 `$` 必须在此作用域内定义（2026-09-01 P0-3 修复 `$` 未定义错误）
 *
 * @path chrome/popup/popup.js
 * @author ydsz-team
 * @since 4.0.0
 */
;(function () {
  /* mini 选择器：此前 $ 未定义，popup 打开即 ReferenceError（2026-09-01 P0-3 修复） */
  var $ = function (sel) { return document.querySelector(sel); };

  /* 查询当前 tab 的快照状态 */
  function queryActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0] || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, { target: 'content-script', type: 'kernel:state:request' }).catch(function () {});
      setTimeout(pullSnapshot, 600);
    });
  }

  function pullSnapshot() {
    chrome.runtime.sendMessage({ target: 'background', type: 'devtools:subscribe' }, function (res) {
      if (!res || !res.cached) return;
      var agg = res.cached.aggregate || res.cached;
      var vs = $('#vs'), sa = $('#sa'), kl = $('#kl'), na = $('#na'), mem = $('#mem');

      if (agg.totalApps > 0 || agg.activeApp) {
        vs.innerHTML = '<span class="dot on"></span>已连接'; vs.className = 'value ok';
      } else {
        vs.innerHTML = '<span class="dot off"></span>等待连接'; vs.className = 'value';
      }
      if (agg.activeApp) sa.textContent = agg.activeApp;
      if (agg.keepAlive != null) kl.textContent = agg.keepAlive;
      if (agg.totalApps) na.textContent = agg.totalApps;
      if (agg.memory) mem.textContent = agg.memory;
    });
  }

  /* 打开 DevTools Panel */
  $('#open').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { target: 'content-script', type: 'kernel:state:request' });
        // DevTools 需要用户在当前 tab 主动按 F12；Extension 无法直接打开 F12（安全限制）
      }
    });
    window.close();
  });

  queryActiveTab();
  /* 定期刷新（popup 关闭时停止） */
  var timer = setInterval(queryActiveTab, 3000);
  window.addEventListener('unload', function () { clearInterval(timer); });
})();
