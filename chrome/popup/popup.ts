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
 * @path chrome/popup/popup.ts
 * @author ydsz-team
 * @since 4.0.0
 */

export {};

interface PopupState {
  activeApp?: string;
  keepAlive?: number;
  totalApps?: number;
  memory?: string;
}

const $ = (sel: string): HTMLElement | null => document.querySelector(sel);

/* 查询当前 tab 的快照状态 */
function queryActiveTab(): void {
  void chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;
    void chrome.tabs
      .sendMessage<unknown>(tab.id, { target: 'content-script', type: 'kernel:state:request' } as never)
      .catch(() => {
        /* tab 可能未注入 content-script */
      });
    setTimeout(pullSnapshot, 600);
  });
}

function pullSnapshot(): void {
  void chrome.runtime.sendMessage(
    { target: 'background', type: 'devtools:subscribe' } as never,
    (res: unknown) => {
      const response = res as { ok?: boolean; cached?: Record<string, PopupState> } | undefined;
      if (!response?.cached) return;

      // aggregate 子树是最终快照；若无则退化为遍历顶层第一个值
      const cached = response.cached;
      const agg: PopupState =
        (cached.aggregate as PopupState | undefined) ??
        (cached[Object.keys(cached)[0] ?? ''] as PopupState | undefined) ??
        {};

      const vsEl = $('#vs');
      const saEl = $('#sa');
      const klEl = $('#kl');
      const naEl = $('#na');
      const memEl = $('#mem');

      if ((agg.totalApps ?? 0) > 0 || agg.activeApp) {
        if (vsEl) {
          vsEl.innerHTML = '<span class="dot on"></span>已连接';
          vsEl.className = 'value ok';
        }
      } else if (vsEl) {
        vsEl.innerHTML = '<span class="dot off"></span>等待连接';
        vsEl.className = 'value';
      }
      if (agg.activeApp && saEl) saEl.textContent = agg.activeApp;
      if (agg.keepAlive != null && klEl) klEl.textContent = String(agg.keepAlive);
      if (agg.totalApps && naEl) naEl.textContent = String(agg.totalApps);
      if (agg.memory && memEl) memEl.textContent = agg.memory;
    }
  );
}

/* 打开 DevTools Panel */
$('#open')?.addEventListener('click', () => {
  void chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.id) {
      void chrome.tabs.sendMessage<unknown>(
        tab.id,
        { target: 'content-script', type: 'kernel:state:request' } as never
      );
      // DevTools 需要用户在当前 tab 主动按 F12；Extension 无法直接打开 F12（安全限制）
    }
  });
  window.close();
});

queryActiveTab();
/* 定期刷新（popup 关闭时停止） */
const timer = setInterval(queryActiveTab, 3000);
window.addEventListener('unload', () => {
  clearInterval(timer);
});
