/**
 * DevTools 可插拔 Tab 注册表与内置 Tab 实现
 *
 * 从 devtools-panel.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-kernel/src/devtools-tabs.ts
 * @author ydsz-team
 * @since 3.7.0
 */

import type { AppStatus } from "./scheduler";

import { getPreloadManager } from "./preload-strategy";
import { getRoutePredictor } from "./route-predictor";
import { getAllInstances } from "./scheduler";
import { clearKernelMarks, getPerfStats } from "./performance-utils";

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('devtools-tabs');
// ==================== Tab 接口与注册表 ====================

/**
 * DevTools Tab 接口（P2-3 可插拔扩展点）。
 *
 * 实现此接口并调用 `registerDevToolsTab` 即可向 DevTools 面板添加自定义 Tab。
 */
export interface DevToolsTab {
  /** Tab 唯一标识（kebab-case，如 'my-app-health'） */
  readonly id: string;
  /** Tab 显示名（支持中文、英文或 i18n key） */
  readonly label: string;
  /**
   * 渲染 Tab 内容（返回 HTML 字符串）。
   *
   * 注意：
   * - 返回 innerHTML 字符串，使用 inline style（面板是独立 shadow-dom 环境）
   * - 需要交互时请使用 data-action 属性 + dataset 传递参数
   *
   * @returns HTML 字符串
   */
  render(): string;
}

/** Tab 注册表（有序） */
export const tabRegistry = new Map<string, DevToolsTab>();

/** 当前激活的 Tab id */
export let activeTabId: string = "overview";

/**
 * 注册一个 DevTools Tab（幂等：同 id 覆盖）。
 *
 * 内置 Tab 在模块初始化时注册，外部调用者可在应用启动阶段注册自定义 Tab。
 *
 * @param tab - Tab 实例
 *
 * @example
 * ```ts
 * import { registerDevToolsTab } from '@ydsz/micro-kernel';
 *
 * registerDevToolsTab({
 *   id: 'my-metrics',
 *   label: '业务指标',
 *   render() {
 *     return `<div>自定义内容: ${Date.now()}</div>`;
 *   },
 * });
 * ```
 */
export function registerDevToolsTab(tab: DevToolsTab): void {
  if (!tab?.id) {
    logger.warn("[DevTools] registerDevToolsTab: invalid tab (missing id)");
    return;
  }
  tabRegistry.set(tab.id, tab);
}

/**
 * 取消注册一个 DevTools Tab（内置 Tab 不可移除）。
 *
 * @param id - Tab id
 * @returns 是否成功移除
 */
export function unregisterDevToolsTab(id: string): boolean {
  // 内置 Tab 不允许移除
  if (
    id === "overview" ||
    id === "preload" ||
    id === "instances" ||
    id === "performance"
  ) {
    return false;
  }
  return tabRegistry.delete(id);
}

/**
 * 获取已注册的 Tab 列表（只读）。
 *
 * @returns Tab 列表（按注册顺序）
 */
export function getRegisteredTabs(): ReadonlyArray<DevToolsTab> {
  return [...tabRegistry.values()];
}

/**
 * 设置当前激活的 Tab。
 *
 * @param id - Tab id
 */
export function setActiveTab(id: string): void {
  activeTabId = id;
}

/**
 * 获取当前激活的 Tab id。
 */
export function getActiveTabId(): string {
  return activeTabId;
}

/**
 * 清理自定义 Tab 注册（HMR 场景防止重复注册）。
 *
 * 仅清理 registerDevToolsTab() 注册的自定义 Tab，
 * 内置 Tab（overview / preload / instances）保持不变。
 */
export function clearCustomTabs(): void {
  for (const id of tabRegistry.keys()) {
    if (
      id !== "overview" &&
      id !== "preload" &&
      id !== "instances" &&
      id !== "performance"
    ) {
      tabRegistry.delete(id);
    }
  }
}

// ==================== 内置 Tab 渲染函数 ====================

/** 获取内存使用（Chrome only） */
function getMemoryInfo(): string {
  const perf = (
    window as unknown as {
      performance?: {
        memory?: { jsHeapSizeLimit: number; usedJSHeapSize: number };
      };
    }
  ).performance;
  const mem = perf?.memory;
  if (!mem) return "N/A（仅 Chrome）";
  return `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB / ${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(0)} MB`;
}

/** 状态颜色 */
export function statusColor(status: AppStatus): string {
  switch (status) {
    case "LOADED": {
      return "#409eff";
    }
    case "LOADING": {
      return "#e6a23c";
    }
    case "MOUNTED": {
      return "#67c23a";
    }
    case "UNMOUNTED": {
      return "#909399";
    }
    case "NOT_LOADED":
    default: {
      return "#c0c4cc";
    }
  }
}

/**
 * P2-3 (v4.2): 生成 Tab 按钮 HTML 字符串。
 * 当前激活 Tab 高亮为主色，其余为灰色。
 */
export function renderTabButton(tab: DevToolsTab): string {
  const isActive = activeTabId === tab.id;
  return `<button data-tab="${tab.id}" style="padding:4px 10px;font-size:11px;cursor:pointer;border:none;border-bottom:2px solid ${isActive ? "var(--el-color-primary,#409eff)" : "transparent"};background:transparent;color:${isActive ? "var(--el-color-primary,#409eff)" : "#909399"};font-weight:${isActive ? 600 : 400}">${tab.label}</button>`;
}

/** P2-7: 渲染预加载可视化 Tab 内容 */
export function renderPreloadContent(): string {
  const preload = getPreloadManager();
  const predictor = getRoutePredictor();
  const usageStats = preload.getAllUsageStats();

  // 构建 top predictions（取当前活跃应用的下一步预测）
  const allInstances = getAllInstances();
  const activeApp = allInstances.find((i) => i.status === "MOUNTED");
  const predictions = activeApp
    ? predictor.predict(activeApp.config.name, 5)
    : [];

  const predRows =
    predictions.length > 0
      ? predictions
          .map((p) => {
            const pct = Math.round(p.probability * 100);
            return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0">
            <div style="width:${Math.max(pct, 5)}%;min-width:4px;height:8px;background:var(--el-color-primary,#409eff);border-radius:2px"></div>
            <span style="flex:1">${p.appName}</span>
            <span style="color:#303133;font-weight:600">${pct}%</span>
            <span style="color:#909399">(${p.sampleSize})</span>
          </div>`;
          })
          .join("")
      : '<span style="color:#c0c4cc">暂无预测数据</span>';

  // 频率 top
  const freqRows =
    usageStats.length > 0
      ? usageStats
          .slice(0, 6)
          .map(
            (s) => `
        <div style="display:flex;justify-content:space-between;padding:2px 0">
          <span>${s.appName}</span>
          <span style="color:#909399">${s.visitCount} 次</span>
        </div>`,
          )
          .join("")
      : '<span style="color:#c0c4cc">暂无数据</span>';

  return `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div>
        <div style="margin-bottom:6px;color:#606266;font-weight:600">
          🔮 路由预测 ${activeApp ? `(${activeApp.config.name})` : "(无活跃应用)"}
        </div>
        <div style="padding:6px;background:#f5f7fa;border-radius:4px">
          ${predRows || '<span style="color:#c0c4cc">暂无预测数据</span>'}
        </div>
      </div>
      <div>
        <div style="margin-bottom:6px;color:#606266;font-weight:600">📈 访问频率</div>
        <div style="padding:6px;background:#f5f7fa;border-radius:4px">
          ${freqRows}
        </div>
      </div>
    </div>
  `;
}

/** P2-7: Overview Tab 内容（原面板主体信息） */
export function renderOverviewContent(): string {
  const instances = getAllInstances();
  const activeApp = instances.find((i) => i.status === "MOUNTED");
  const keepAliveCount = instances.filter(
    (i) => i.keepAlive && i.status === "UNMOUNTED" && i.cachedRoot,
  ).length;

  // P1-7: 性能测量数据
  const perfStats = getPerfStats();
  const topMeasures = perfStats.measures
    .filter((m) => m.duration > 0)
    .slice(0, 8)
    .map(
      (
        m,
      ) => `<div style="display:flex;justify-content:space-between;padding:2px 0">
        <span style="color:#606266;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px">${m.name.replace("kernel:", "")}</span>
        <span style="color:#303133;font-variant-numeric:tabular-nums">${m.duration}ms</span>
      </div>`,
    )
    .join("");

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div style="padding:6px;background:#f5f7fa;border-radius:4px">
        <div style="color:#909399">活跃应用</div>
        <div style="font-weight:600">${activeApp?.config.name ?? "无"}</div>
      </div>
      <div style="padding:6px;background:#f5f7fa;border-radius:4px">
        <div style="color:#909399">KeepAlive</div>
        <div style="font-weight:600">${keepAliveCount} / ${instances.length}</div>
      </div>
      <div style="padding:6px;background:#f5f7fa;border-radius:4px">
        <div style="color:#909399">JS 内存</div>
        <div style="font-weight:600">${getMemoryInfo()}</div>
      </div>
      <div style="padding:6px;background:#f5f7fa;border-radius:4px">
        <div style="color:#909399">注册表</div>
        <div style="font-weight:600">${instances.length} 应用</div>
      </div>
    </div>
    <!-- P1-7: 性能指标区块 -->
    <div style="margin-bottom:8px">
      <div style="margin-bottom:4px;color:#606266">
        ⚡ 性能 (kernel:*, ${perfStats.measureCount} measures, buffer ${perfStats.markCount})
      </div>
      <div style="padding:6px;background:#f5f7fa;border-radius:4px;max-height:160px;overflow-y:auto">
        ${topMeasures || '<span style="color:#c0c4cc">暂无数据</span>'}
      </div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button id="micro-kernel-devtools-refresh-registry" style="padding:4px 10px;font-size:11px;cursor:pointer;background:#f0f9eb;border:1px solid #c2e7b0;border-radius:3px;color:#67c23a">刷新注册表</button>
      <button id="micro-kernel-devtools-clear-cache" style="padding:4px 10px;font-size:11px;cursor:pointer;background:#fdf6ec;border:1px solid #f5dab1;border-radius:3px;color:#e6a23c">清缓存</button>
      <button id="micro-kernel-devtools-perf-clear" style="padding:4px 10px;font-size:11px;cursor:pointer;background:#f4f4f5;border:1px solid #d3d4d6;border-radius:3px;color:#909399">清 perf</button>
      <button id="micro-kernel-devtools-close" style="padding:4px 10px;font-size:11px;cursor:pointer;background:#f4f4f5;border:1px solid #d3d4d6;border-radius:3px;color:#909399">收起</button>
    </div>
  `;
}

/**
 * v4.2.1 N7: 性能 Tab 内容。
 *
 * - kernel:* measures 按类型聚合（样本数 / P50 / P95）
 * - 预加载命中率（PreloadManager.debugInfo）
 */
export function renderPerformanceContent(): string {
  const { measures, measureCount, markCount } = getPerfStats();

  // 按 measure 名称分组聚合（同类型多次采样）
  const groups = new Map<string, number[]>();
  for (const m of measures) {
    if (m.duration <= 0) continue;
    const key = m.name.replace(/:\d+$/, ""); // 去除序号后缀便于分组
    const list = groups.get(key) ?? [];
    list.push(m.duration);
    groups.set(key, list);
  }

  // 计算 P50 / P95
  const percentile = (sorted: number[], p: number): number => {
    if (sorted.length === 0) return 0;
    const idx = Math.min(
      sorted.length - 1,
      Math.ceil((p / 100) * sorted.length) - 1,
    );
    return sorted[idx]!;
  };

  const rows = [...groups.entries()]
    .map(([name, durations]) => {
      const sorted = [...durations].sort((a, b) => a - b);
      const p50 = percentile(sorted, 50);
      const p95 = percentile(sorted, 95);
      return `<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f0f2f5">
        <span style="color:#606266;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px" title="${name}">${name.replace("kernel:", "")}</span>
        <span style="color:#909399;font-variant-numeric:tabular-nums">n=${durations.length}</span>
        <span style="color:#303133;font-variant-numeric:tabular-nums">P50 ${Math.round(p50)}ms</span>
        <span style="color:#e6a23c;font-variant-numeric:tabular-nums">P95 ${Math.round(p95)}ms</span>
      </div>`;
    })
    .join("");

  // 预加载命中率
  const preload = getPreloadManager();
  const preloadInfo = preload.debugInfo();
  const hitRate = preloadInfo.hitRate;

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div style="padding:6px;background:#f5f7fa;border-radius:4px">
        <div style="color:#909399">measures</div>
        <div style="font-weight:600">${measureCount}</div>
      </div>
      <div style="padding:6px;background:#f5f7fa;border-radius:4px">
        <div style="color:#909399">marks</div>
        <div style="font-weight:600">${markCount}</div>
      </div>
      <div style="padding:6px;background:#f5f7fa;border-radius:4px">
        <div style="color:#909399">预加载命中率</div>
        <div style="font-weight:600">${hitRate}%
          <span style="color:#909399;font-weight:400">(${preloadInfo.consumedCount}/${preloadInfo.preloadCount})</span>
        </div>
      </div>
      <div style="padding:6px;background:#f5f7fa;border-radius:4px">
        <div style="color:#909399">缓存应用</div>
        <div style="font-weight:600">${preloadInfo.preloadCache.length}</div>
      </div>
    </div>
    <div style="margin-bottom:4px;color:#606266;font-weight:600">⚡ 耗时聚合 (P50/P95)</div>
    <div style="padding:6px;background:#f5f7fa;border-radius:4px;max-height:36vh;overflow-y:auto">
      ${rows || '<span style="color:#c0c4cc">暂无数据</span>'}
    </div>
  `;
}

/** P2-7: Instances Tab 内容（子应用详情） */
export function renderInstancesContent(): string {
  const instances = getAllInstances();
  return `
    <div style="margin-bottom:4px;color:#606266;font-weight:600">子应用状态</div>
    <div style="max-height:50vh;overflow-y:auto">
      ${instances
        .map(
          (inst) => `
        <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #ebeef5">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${statusColor(inst.status)}"></span>
          <span style="flex:1">${inst.config.name}</span>
          <span style="color:${statusColor(inst.status)};font-weight:600">${inst.status}</span>
          ${inst.loadMetrics ? `<span style="color:#909399">${Math.round(inst.loadMetrics.duration)}ms</span>` : ""}
          <button data-act="unmount" data-app="${inst.config.name}" style="padding:2px 6px;font-size:11px;cursor:pointer;background:#f5f7fa;border:1px solid #dcdfe6;border-radius:3px">卸载</button>
          <button data-act="reload" data-app="${inst.config.name}" style="padding:2px 6px;font-size:11px;cursor:pointer;background:#ecf5ff;border:1px solid #c6e2ff;border-radius:3px;color:#409eff">重载</button>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

/** P2-3 (v4.2): 渲染当前激活 Tab 的内容。 */
export function renderTabContent(): string {
  const tab = tabRegistry.get(activeTabId);
  if (!tab) return '<div style="color:#c0c4cc">Tab 未找到</div>';
  try {
    return tab.render();
  } catch (error) {
    return `<div style="color:#f56c6c">Tab 渲染错误: ${String(error)}</div>`;
  }
}

// ==================== 内置 Tab 注册 ====================

const overviewTab: DevToolsTab = {
  id: "overview",
  label: "概览",
  render: () => renderOverviewContent(),
};

const preloadTab: DevToolsTab = {
  id: "preload",
  label: "预加载",
  render: () => renderPreloadContent(),
};

const instancesTab: DevToolsTab = {
  id: "instances",
  label: "子应用",
  render: () => renderInstancesContent(),
};

// v4.2.1 N7: 独立性能 Tab（P50/P95 聚合 + 预加载命中率）
const performanceTab: DevToolsTab = {
  id: "performance",
  label: "性能",
  render: () => renderPerformanceContent(),
};

// 注册内置 Tab
registerDevToolsTab(overviewTab);
registerDevToolsTab(preloadTab);
registerDevToolsTab(instancesTab);
registerDevToolsTab(performanceTab);
