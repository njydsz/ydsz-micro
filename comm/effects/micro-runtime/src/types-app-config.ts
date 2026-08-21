/**
 * 微应用运行时 — 应用配置类型
 *
 * 从 types.ts 提取，避免单文件超过 300 行。
 *
 * @path comm/effects/micro-runtime/src/types-app-config.ts
 * @author ydsz-team
 * @since 3.0.0
 */

/** 子应用激活规则类型 */
export type ActiveRule = ((path: string) => boolean) | RegExp | string;

/**
 * 沙箱类型。
 *
 * - `snapshot`（默认）：快照沙箱，性能最佳，仅防意外污染 window。
 * - `proxy`：Proxy fakeWindow 数据隔离层，子应用通过 mountProps.fakeWindow 可读写隔离数据。
 *   注意 ESM 路线无法用 with 拦截顶层全局访问，详见 proxy-sandbox.ts 边界声明。
 * - `iframe`：iframe 强隔离（CSS + DOM + window），适用于全局样式冲突的子应用兜底。
 *   跨 realm 通信通过内置 postMessage 桥接 globalState，无需业务侧处理。
 *
 * @since 3.6.0
 */
export type SandboxType = "iframe" | "proxy" | "snapshot";

/** 子应用注册配置（对齐现有 main/src/qiankun/index.ts microApps） */
export interface MicroAppConfig {
  /** 应用唯一标识（如 'workflow-web'） */
  name: string;
  /** 入口 URL — prod 为子路径，dev 为 localhost 端口 */
  entry: string;
  /**
   * 挂载容器，支持两种模式：
   * - string: CSS 选择器（如 '#subapp-container'）
   * - HTMLElement: 直接传入 DOM 元素（适用于动态创建容器的场景）
   */
  container: HTMLElement | string;
  /**
   * 激活规则，支持三种模式：
   * - string: 路由前缀匹配（如 '/YDSZ-proj'）
   * - RegExp: 正则表达式匹配（如 /^\/YDSZ-proj\/.*\/detail$/）
   * - function: 自定义匹配函数（如 (path) => path.includes('/special')）
   */
  activeRule: ActiveRule;
  /** 自定义 props（注入子应用 mount 参数） */
  props?: Record<string, unknown>;
  /**
   * 沙箱类型（v3.6.0 对外开放，未配置时默认 'snapshot'）。
   *
   * 业务侧可在 micro-apps.config.ts 注册表中按子应用指定沙箱类型，
   * 例如对全局样式冲突的子应用设置 `sandbox: 'iframe'`。
   *
   * @since 3.6.0
   */
  sandbox?: SandboxType;
  /**
   * P2-1: 开发模式下 iframe 沙箱子应用的独立运行 URL。
   *
   * 仅当 sandbox='iframe' 且 import.meta.env.DEV 时生效。
   * 传入时 iframe 将加载此地址（如 `//localhost:5601/`），子应用在 iframe 内
   * 完整独立运行（独立 dev server + HMR），便于调试隔离场景。
   *
   * @since 4.0.1
   */
  devUrl?: string;
  /**
   * 是否对该子应用启用运行时 CSS 作用域兜底（v4.2.1 N5）。
   *
   * 默认 false（自有子应用已由构建期 micro-scoped-postcss 处理）。
   * 对使用 :global 选择器 / 遗漏 PostCSS 配置 / 第三方构建链路接入的
   * 子应用，开启后运行时将通过 CSSOM 为样式表加 `[data-micro-app]` 前缀。
   *
   * @since 4.2.1
   */
  styleIsolation?: boolean;
  /**
   * v4.2.1 L6: 父内核标识（嵌套微前端方向性预留）。
   *
   * 当前版本内核**不支持**嵌套微前端（子应用内再嵌入子应用）。
   * 此字段仅作方向性预留，供未来版本区分多级内核层级：
   * - 顶层子应用：不设置（或 'main'）
   * - 嵌套子应用：设置为所属父内核的 kernelName
   *
   * 当前实现会忽略该字段（不影响现有功能），仅在注册表 / DevTools
   * 中作为元数据展示。
   *
   * @since 4.2.1
   */
  parentKernelName?: string;
}

/** 子应用挂载参数（与 qiankun mountProps 对齐语义） */
export interface MountProps {
  container: HTMLElement;
  basename: string;
  /**
   * Proxy 沙箱注入的 fakeWindow（仅当 sandboxType='proxy' 时存在）。
   *
   * 子应用可通过此对象读写隔离的全局数据，避免直接污染主 window。
   * 未启用 proxy 沙箱时为 undefined，子应用应回退到 window。
   *
   * @since 3.6.0
   */
  fakeWindow?: Record<string, unknown>;
  /**
   * iframe 沙箱注入的 contentWindow（仅当 sandboxType='iframe' 时存在）。
   *
   * 子应用如需直接操作 iframe 内的 document/window，可通过此引用访问。
   * 跨 realm 通信（globalState）已由内核内置 postMessage 桥接，业务侧通常无需直接使用。
   *
   * @since 3.6.0
   */
  iframeWindow?: Window;
  /** 主应用注入的自定义 props */
  [key: string]: unknown;
}
