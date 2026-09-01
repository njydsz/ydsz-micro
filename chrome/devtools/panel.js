/**
 * DevTools Panel —— 微前端运行时诊断面板主逻辑
 *
 * 负责在 Chrome DevTools "Micro Kernel" 面板中渲染 micro-kernel 的实时状态，
 * 并提供命令下发入口（卸载/重载/清缓存/刷新注册表/健康检查）。
 *
 * 功能模块：
 *   - render(): 渲染总览指标（活跃应用、Keep-Alive 数、总应用数、内存、内核版本、健康状态）
 *   - renderApps(): 渲染每个子应用卡片（状态点、沙盒类型、加载耗时、卸载按钮）
 *   - renderLog(): 渲染最近事件 + 错误日志（环形缓冲，最多 50 条）
 *   - 命令按钮交互：向 background 发送 devtools:command 并在回调中刷新面板
 *
 * 数据更新机制：
 *   - 面板初始化时从 port 接收快照
 *   - 后台通过 chrome.runtime 主动推送（事件驱动）
 *   - 用户操作触发命令后，等待后台广播最新状态再重渲染
 *
 * @path chrome/devtools/panel.js
 * @author ydsz-team
 * @since 4.0.0
 */
;(function () {
  'use strict';

  var port = chrome.runtime.connect({ name: 'micro-kernel-devtools' });
  var state = { activeApp: null, keepAlive: 0, total: 0, memory: 'N/A', apps: [], caps: {}, healthy: null };
  var $ = function (s) { return document.querySelector(s); };
  var al = $('#al'), elog = $('#elog'), kv = $('#kv');
  var logCollapsed = false;

  /* === 渲染 === */
  function render() {
    $('#sa').textContent = state.activeApp || '—';
    $('#kl').textContent = state.keepAlive;
    $('#mem').textContent = state.memory;
    $('#na').textContent = state.total;
    if (state.caps && state.caps.kernelVersion) kv.textContent = 'v' + state.caps.kernelVersion;

    var badge = $('#health-badge');
    if (state.healthy === true) { badge.className = 'health-badge health-ok'; badge.textContent = '运行正常'; }
    else if (state.healthy === false) { badge.className = 'health-badge health-err'; badge.textContent = '异常'; }
    else { badge.className = 'health-badge health-warn'; badge.textContent = '等待心跳'; }

    if (!state.apps || !state.apps.length) {
      al.innerHTML = '<div class="empty">未检测到 micro-kernel 运行时<br><small>请确认页面已加载主应用</small></div>';
      return;
    }

    var html = '';
    for (var i = 0; i < state.apps.length; i++) {
      var a = state.apps[i];
      var dur = a.loadDuration ? '<span style="color:#bfbfbf;font-size:10px">'+a.loadDuration+'ms</span>' : '';
      var featured = a.status === 'MOUNTED' ? '★ ' : '';
      html += '<div class="ar" data-app="'+a.name+'">' +
        '<span class="dot '+a.status+'"></span>' +
        '<span class="an" title="'+(a.entry||'')+'">'+featured+escapeHtml(a.name)+'</span>' +
        '<span class="as">'+a.status+'</span>' +
        '<span class="sandbox">'+(a.sandboxType||'snapshot')+'</span>' +
        dur +
        '<button class="act danger" data-act="unmount">卸载</button>' +
        '<button class="act primary" data-act="reload">重载</button>' +
      '</div>';
    }
    al.innerHTML = html;

    /* 绑定按钮 */
    var btns = al.querySelectorAll('button[data-act]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener('click', (function (btn) {
        return function () {
          var name = btn.parentElement.getAttribute('data-app');
          var act = btn.getAttribute('data-act');
          send({ type: act === 'unmount' ? 'kernel:unmount' : 'kernel:reload', payload: { appName: name } });
        };
      })(btns[j]));
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  /* === 日志 === */
  function log(text, lv) {
    lv = lv || 'info';
    var el = document.createElement('div');
    el.className = 'le ' + lv;
    var ts = document.createElement('span'); ts.className = 'ts';
    ts.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    var body = document.createElement('span'); body.textContent = text;
    el.appendChild(ts); el.appendChild(body);
    elog.appendChild(el);
    elog.scrollTop = elog.scrollHeight;
    while (elog.children.length > 80) elog.removeChild(elog.firstChild);
  }

  /* === 通信 === */
  function send(msg) { chrome.runtime.sendMessage({ target: 'background', type: msg.type, payload: msg.payload, _id: msg._id }).catch(function () {}); }

  function handleBgMessage(m) {
    if (!m) return;
    switch (m.type) {
      case 'kernel:state:response':
        state = Object.assign({}, state, m.payload);
        if (m.payload && m.payload._fromTab) delete state._fromTab;
        render();
        break;
      case 'kernel:health:response':
        var h = m.payload || {};
        state.healthy = !h.error;
        if (h.kernelVersion) state.caps.kernelVersion = h.kernelVersion;
        if (h.capabilities) state.caps.capabilities = h.capabilities;
        if (h.metrics) state.metrics = h.metrics;
        render();
        log('健康检查: ' + (h.error ? '失败 '+h.error : 'OK v'+h.kernelVersion));
        break;
      case 'kernel:memory':
        state.memory = (m.payload.usedMB || '?') + 'MB';
        render();
        break;
      case 'kernel:event':
        var ev = m.payload || {};
        log((ev.eventName || 'event') + (ev.appName ? ' → '+ev.appName : ''), ev.error ? 'err' : 'warn');
        break;
      case 'kernel:tab:activated':
        log('Tab #' + (m.payload && m.payload.tabId) + ' kernel 就绪', 'info');
        break;
      case 'kernel:tab:deactivated':
        log('Tab #' + (m.payload && m.payload.tabId) + ' 离线', 'err');
        break;
      default: break;
    }
  }

  chrome.runtime.onMessage.addListener(function (m) { if (m.target === 'devtools') handleBgMessage(m); });

  window.addEventListener('message', function (e) {
    if (e.source !== window || !e.data || e.data.source !== 'ext-bg') return;
    handleBgMessage(e.data.detail);
  });

  /* === 操作按钮 === */
  $('#br').addEventListener('click', function () {
    send({ type: 'kernel:refresh-registry' });
    send({ type: 'kernel:state:request' });
    log('已触发注册表刷新', 'info');
  });

  $('#bc').addEventListener('click', function () {
    send({ type: 'kernel:clear-cache' });
    log('已触发缓存清理', 'warn');
  });

  $('#bh').addEventListener('click', function () {
    send({ type: 'kernel:health:request' });
    log('已发送健康检查', 'info');
  });

  /* 折叠日志 */
  $('#log-toggle').addEventListener('click', function () {
    logCollapsed = !logCollapsed;
    this.classList.toggle('collapsed', logCollapsed);
    elog.classList.toggle('collapsed', logCollapsed);
  });

  /* 心跳 */
  setInterval(function () { port.postMessage({ type: 'ping' }); }, 20000);

  /* 初始 */
  setTimeout(function () { send({ type: 'kernel:state:request' }); }, 200);
  setTimeout(function () { send({ type: 'kernel:health:request' }); }, 500);
  log('Panel 已启动，等待 micro-kernel 推送...', 'info');
})();
