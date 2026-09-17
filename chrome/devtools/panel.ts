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
 * @path chrome/devtools/panel.ts
 * @author ydsz-team
 * @since 4.0.0
 */

interface AppInfo {
  name: string;
  status: string;
  entry?: string;
  sandboxType?: string;
  loadDuration?: number;
}

interface DevToolsState {
  activeApp: string | null;
  keepAlive: number;
  total: number;
  memory: string;
  apps: AppInfo[];
  caps: { kernelVersion?: string; capabilities?: string[] };
  healthy: boolean | null;
  metrics?: unknown;
}

interface BackgroundMsg {
  target?: string;
  type: string;
  payload?: Record<string, unknown> & {
    activeApp?: string;
    keepAlive?: number;
    totalApps?: number;
    memory?: string;
    apps?: AppInfo[];
    aggregate?: Record<string, unknown>;
    kernelVersion?: string;
    capabilities?: string[];
    error?: string;
    usedMB?: string | number;
    tabId?: number;
    _fromTab?: number;
    eventName?: string;
    appName?: string;
  };
}

const port = chrome.runtime.connect({ name: 'micro-kernel-devtools' });
let state: DevToolsState = {
  activeApp: null,
  keepAlive: 0,
  total: 0,
  memory: 'N/A',
  apps: [],
  caps: {},
  healthy: null,
};

const $ = (s: string): HTMLElement | null => document.querySelector(s);

let logCollapsed = false;

/* === 渲染 === */
function render(): void {
  const saEl = $('#sa');
  const klEl = $('#kl');
  const memEl = $('#mem');
  const naEl = $('#na');
  const kvEl = $('#kv');

  if (saEl) saEl.textContent = state.activeApp ?? '—';
  if (klEl) klEl.textContent = String(state.keepAlive);
  if (memEl) memEl.textContent = state.memory;
  if (naEl) naEl.textContent = String(state.total);

  if (state.caps?.kernelVersion && kvEl) {
    kvEl.textContent = `v${state.caps.kernelVersion}`;
  }

  const badge = $('#health-badge');
  if (badge) {
    if (state.healthy === true) {
      badge.className = 'health-badge health-ok';
      badge.textContent = '运行正常';
    } else if (state.healthy === false) {
      badge.className = 'health-badge health-err';
      badge.textContent = '异常';
    } else {
      badge.className = 'health-badge health-warn';
      badge.textContent = '等待心跳';
    }
  }

  const alEl = $('#al');
  if (!alEl) return;

  if (state.apps.length === 0) {
    alEl.innerHTML = '<div class="empty">未检测到 micro-kernel 运行时<br><small>请确认页面已加载主应用</small></div>';
    return;
  }

  let html = '';
  for (const a of state.apps) {
    const dur = a.loadDuration
      ? `<span style="color:#bfbfbf;font-size:10px">${a.loadDuration}ms</span>`
      : '';
    const featured = a.status === 'MOUNTED' ? '★ ' : '';
    html += `<div class="ar" data-app="${a.name}">` +
      `<span class="dot ${a.status}"></span>` +
      `<span class="an" title="${a.entry ?? ''}">${featured}${escapeHtml(a.name)}</span>` +
      `<span class="as">${a.status}</span>` +
      `<span class="sandbox">${a.sandboxType ?? 'snapshot'}</span>` +
      `${dur}` +
      '<button class="act danger" data-act="unmount">卸载</button>' +
      '<button class="act primary" data-act="reload">重载</button>' +
      '</div>';
  }
  alEl.innerHTML = html;

  /* 绑定按钮 */
  const btns = alEl.querySelectorAll<HTMLButtonElement>('button[data-act]');
  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.parentElement?.getAttribute('data-app');
      const act = btn.getAttribute('data-act');
      send({
        type: act === 'unmount' ? 'kernel:unmount' : 'kernel:reload',
        payload: { appName: name },
      });
    });
  });
}

function escapeHtml(s: string | null | undefined): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[c] ?? c;
  });
}

/* === 日志 === */
function log(text: string, lv = 'info'): void {
  const elogEl = $('#elog');
  if (!elogEl) return;
  const el = document.createElement('div');
  el.className = `le ${lv}`;
  const ts = document.createElement('span');
  ts.className = 'ts';
  ts.textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const body = document.createElement('span');
  body.textContent = text;
  el.appendChild(ts);
  el.appendChild(body);
  elogEl.appendChild(el);
  elogEl.scrollTop = elogEl.scrollHeight;
  while (elogEl.children.length > 80) {
    elogEl.removeChild(elogEl.firstChild!);
  }
}

/* === 通信 === */
function send(msg: { type: string; payload?: Record<string, unknown> }): void {
  void chrome.runtime
    .sendMessage<unknown>({ target: 'background', type: msg.type, payload: msg.payload, _id: undefined } as never)
    .catch(() => {
      /* ignore */
    });
}

function handleBgMessage(m: BackgroundMsg): void {
  if (!m) return;
  switch (m.type) {
    case 'kernel:state:response': {
      const payload = m.payload ?? {};
      state = {
        ...state,
        activeApp: (payload.activeApp as string | undefined) ?? state.activeApp,
        keepAlive: (payload.keepAlive as number | undefined) ?? state.keepAlive,
        total: (payload.totalApps as number | undefined) ?? state.total,
        memory: (payload.memory as string | undefined) ?? state.memory,
        apps: (payload.apps as AppInfo[] | undefined) ?? state.apps,
        caps: (payload.caps as DevToolsState['caps'] | undefined) ?? state.caps,
        healthy: (payload.healthy as boolean | null | undefined) ?? state.healthy,
      };
      render();
      break;
    }
    case 'kernel:health:response': {
      const h = m.payload ?? {};
      state.healthy = !h.error;
      if (h.kernelVersion) state.caps.kernelVersion = h.kernelVersion;
      if (h.capabilities) state.caps.capabilities = h.capabilities;
      if (h.metrics) state.metrics = h.metrics;
      render();
      log(`健康检查: ${h.error ? `失败 ${h.error}` : `OK v${h.kernelVersion ?? '?'}`}`);
      break;
    }
    case 'kernel:memory': {
      state.memory = `${m.payload?.usedMB ?? '?'}MB`;
      render();
      break;
    }
    case 'kernel:event': {
      const ev = m.payload ?? {};
      log(
        `${ev.eventName ?? 'event'}${ev.appName ? ` → ${ev.appName}` : ''}`,
        ev.error ? 'err' : 'warn'
      );
      break;
    }
    case 'kernel:tab:activated': {
      log(`Tab #${m.payload?.tabId ?? '?'} kernel 就绪`, 'info');
      break;
    }
    case 'kernel:tab:deactivated': {
      log(`Tab #${m.payload?.tabId ?? '?'} 离线`, 'err');
      break;
    }
    default:
      break;
  }
}

chrome.runtime.onMessage.addListener((m: BackgroundMsg) => {
  if (m.target === 'devtools') handleBgMessage(m);
});

window.addEventListener('message', (e: MessageEvent) => {
  if (e.source !== window || !e.data || e.data.source !== 'ext-bg') return;
  handleBgMessage(e.data.detail as BackgroundMsg);
});

/* === 操作按钮 === */
$('#br')?.addEventListener('click', () => {
  send({ type: 'kernel:refresh-registry' });
  send({ type: 'kernel:state:request' });
  log('已触发注册表刷新', 'info');
});

$('#bc')?.addEventListener('click', () => {
  send({ type: 'kernel:clear-cache' });
  log('已触发缓存清理', 'warn');
});

$('#bh')?.addEventListener('click', () => {
  send({ type: 'kernel:health:request' });
  log('已发送健康检查', 'info');
});

/* 折叠日志 */
$('#log-toggle')?.addEventListener('click', () => {
  logCollapsed = !logCollapsed;
  $('#log-toggle')?.classList.toggle('collapsed', logCollapsed);
  $('#elog')?.classList.toggle('collapsed', logCollapsed);
});

/* 心跳 */
setInterval(() => {
  port.postMessage({ type: 'ping' });
}, 20000);

/* 初始 */
setTimeout(() => {
  send({ type: 'kernel:state:request' });
}, 200);
setTimeout(() => {
  send({ type: 'kernel:health:request' });
}, 500);
log('Panel 已启动，等待 micro-kernel 推送...', 'info');
