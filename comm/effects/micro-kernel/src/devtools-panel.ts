/**
 * 微前端 DevTools 管理面板（开发态）
 *
 * 通过 Alt+Shift+M 切换面板，可视化展示：
 * - 所有子应用注册状态（NOT_LOADED/LOADING/LOADED/MOUNTED/UNMOUNTED）
 * - 当前 keepAlive 缓存数 / 内存占用
 * - globalState 实时快照
 * - 手动操作按钮（强制卸载/重载/降级/刷新注册表）
 *
 * P2-3 (v4.2): 支持可插拔 Tab — 通过 registerDevToolsTab() 注册自定义 Tab，
 * 第三方开发者可以扩展面板功能，无需修改本模块源码。
 *
 * Tab 注册表与内置 Tab 实现已提取至 devtools-tabs.ts，
 * 本文件专注于面板 DOM 渲染与生命周期管理。
 *
 * @path comm/effects/micro-kernel/src/devtools-panel.ts
 * @author ydsz-team
 * @since 3.7.0
 */

import { createLogger } from "@YDSZ-core/shared/utils";

import { clearKernelMarks } from "./performance-utils";
import { refreshRegistry } from "./registry-adapter";
import {
  activeTabId,
  clearCustomTabs,
  getRegisteredTabs,
  registerDevToolsTab,
  renderTabButton,
  renderTabContent,
  setActiveTab,
  unregisterDevToolsTab,
} from "./devtools-tabs";

// 重新导出 Tab 相关 API，保持向后兼容
export type { DevToolsTab } from "./devtools-tabs";
export {
  registerDevToolsTab,
  unregisterDevToolsTab,
  getRegisteredTabs,
} from "./devtools-tabs";

const logger = createLogger("MicroKernel");

/** 面板 id，用于去重 */
const PANEL_ID = "micro-kernel-devtools";

/** 面板当前是否可见 */
let panelVisible = false;

/** 刷新定时器 */
let refreshTimer: null | ReturnType<typeof setInterval> | undefined;

/** 渲染面板 HTML */
function renderPanel(): string {
  return `
    <div id="${PANEL_ID}-content" style="font-family:monospace;font-size:12px;color:#303133">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>🛠 Micro Kernel DevTools</strong>
        <span style="color:#909399">${new Date().toLocaleTimeString()}</span>
      </div>
      <!-- P2-3 (v4.2): Tab 分页栏（动态渲染） -->
      <div style="display:flex;gap:2px;margin-bottom:12px;border-bottom:1px solid #ebeef5;flex-wrap:wrap">
        ${[...getRegisteredTabs()].map(renderTabButton).join("")}
      </div>
      <div id="${PANEL_ID}-tab-content">
        ${renderTabContent()}
      </div>
    </div>
  `;
}

/** 挂载面板 DOM */
function mountPanel(): HTMLDivElement {
  const el = document.createElement("div");
  el.id = PANEL_ID;
  el.style.cssText = `
    position: fixed; right: 16px; bottom: 16px; z-index: 99999;
    width: 380px; max-height: 70vh; overflow-y: auto;
    background: #fff; border: 1px solid #dcdfe6; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12); padding: 16px;
    display: none;
  `;
  document.body.append(el);
  return el;
}

/** 绑定面板内按钮事件 */
function bindPanelEvents(el: HTMLDivElement): void {
  el.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    // P2-3: Tab 点击切换
    const tabId = target.dataset.tab;
    if (tabId) {
      const tabs = getRegisteredTabs();
      if (tabs.some((t) => t.id === tabId)) {
        setActiveTab(tabId);
        refreshPanel(el);
        return;
      }
    }

    const action = target.dataset.act;
    const appName = target.dataset.app;

    if (action === "unmount" && appName) {
      window.dispatchEvent(
        new CustomEvent("micro-kernel:devtools:unmount", {
          detail: { appName },
        }),
      );
    } else if (action === "reload" && appName) {
      window.dispatchEvent(
        new CustomEvent("micro-kernel:devtools:reload", {
          detail: { appName },
        }),
      );
    }
  });

  el.querySelector(`#${PANEL_ID}-refresh-registry`)?.addEventListener(
    "click",
    () => {
      void refreshRegistry().then(() => refreshPanel());
    },
  );
  el.querySelector(`#${PANEL_ID}-clear-cache`)?.addEventListener(
    "click",
    () => {
      window.dispatchEvent(
        new CustomEvent("micro-kernel:devtools:clear-cache"),
      );
    },
  );
  el.querySelector(`#${PANEL_ID}-perf-clear`)?.addEventListener("click", () => {
    clearKernelMarks();
    refreshPanel(el);
  });
  el.querySelector(`#${PANEL_ID}-close`)?.addEventListener("click", () => {
    toggleDevTools(false);
  });
}

/** 定时刷新面板数据 */
function startAutoRefresh(el: HTMLDivElement): void {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (panelVisible) refreshPanel(el);
  }, 2000);
}

/**
 * P2-7: 刷新面板内容。
 *
 * 已挂载时只更新内部 Tab 容器，避免重建整个面板导致 Tab 状态和焦点丢失；
 * 首次挂载或整体需要重建时回退为全量渲染。
 */
function refreshPanel(el?: HTMLDivElement): void {
  const target = el ?? document.getElementById(PANEL_ID);
  if (!target) return;
  // 已挂载态：仅更新 Tab 内容
  const tabContent = target.querySelector(`#${PANEL_ID}-tab-content`);
  if (tabContent) {
    tabContent.innerHTML = renderTabContent();
    return;
  }
  // 全量重建态
  const content = target.querySelector(`#${PANEL_ID}-content`);
  if (content) {
    content.innerHTML =
      renderPanel().match(
        /<div id="[^"]-content"[^>]*>([\s\S]*)<\/div>\s*<\/div>/,
      )?.[1] ?? "";
  }
}

/** 切换面板显示/隐藏 */
function toggleDevTools(forceVisible?: boolean): void {
  let el = document.getElementById(PANEL_ID);

  if (!el) {
    el = mountPanel();
    bindPanelEvents(el as HTMLDivElement);
  }

  panelVisible = forceVisible ?? !panelVisible;
  el.style.display = panelVisible ? "block" : "none";

  if (panelVisible) {
    el.innerHTML = renderPanel();
    bindPanelEvents(el as HTMLDivElement);
    startAutoRefresh(el as HTMLDivElement);
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }
}

/** 全局键盘监听（避免重复注册） */
let keyHandlerRegistered = false;

function registerKeyHandler(): void {
  if (keyHandlerRegistered || typeof document === "undefined") return;
  keyHandlerRegistered = true;

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && (e.key === "M" || e.key === "m")) {
      e.preventDefault();
      toggleDevTools();
    }
    if (e.key === "Escape" && panelVisible) {
      toggleDevTools(false);
    }
  });
}

/**
 * 启用 DevTools 面板。
 *
 * 仅在 import.meta.env.DEV 下生效。
 * 热键：Alt+Shift+M 切换面板，Esc 收起。
 *
 * @example
 * // main/src/bootstrap.ts
 * import { enableMicroDevTools } from '@ydsz/micro-kernel';
 * if (import.meta.env.DEV) enableMicroDevTools();
 */
export function enableMicroDevTools(): void {
  if (import.meta.env.PROD) return;
  registerKeyHandler();
  logger.info("DevTools enabled — press Alt+Shift+M to toggle panel");
}

/** 手动触发显示/隐藏（供外部按钮调用） */
export function toggleMicroDevTools(visible?: boolean): void {
  toggleDevTools(visible);
}

/** 销毁面板（测试/HMR场景） */
export function destroyMicroDevTools(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  document.getElementById(PANEL_ID)?.remove();
  panelVisible = false;
}

/**
 * P0-A1: 创建 devtools-panel 生命周期管理器。
 *
 * 纳入 ManagerRegistry 统一释放开发态面板资源。
 *
 * @since 4.1.0
 */
export function createDevToolsManager(): import("./manager-registry").DisposableManager {
  return {
    name: "devtools-panel",
    dispose(): void {
      destroyMicroDevTools();
      clearCustomTabs();
    },
  };
}
