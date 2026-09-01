/**
 * error-ui-styles.ts — 错误降级 UI 样式系统（P1-2 落地）
 *
 * 将 error-boundary.ts 中 15 处内联样式提取为 CSS class + CSS 变量：
 * - 统一品牌变量（--micro-error-primary / --micro-error-danger 等）
 * - 提供注入函数，支持 Shadow DOM / Document 两种挂载点
 * - 允许运行时覆盖 CSS 变量实现主题定制
 *
 * 设计决策：
 * 1. CSS 变量为主，class 选择器为辅（方便业务方整体换肤）
 * 2. 单例注入：多次 inject() 仅首次生效（防止重复 <style> 插入）
 * 3. BEM 命名：micro-error__element--modifier 防止与业务样式冲突
 * 4. accessibility：保留 :focus-visible / aria-live 等无障碍属性
 *
 * @path comm/effects/micro-kernel/src/error-ui-styles.ts
 * @author ydsz-team
 * @since 4.2.0
 */

/** 样式注入标记（防重复） */
let injected = false;

/**
 * 默认 CSS 变量（可通过 injectErrorStyles 的 variables 参数覆盖）
 */
export interface ErrorStyleVariables {
  /** 主色（按钮、链接） */
  primary?: string;
  /** 危险/错误色（图标背景） */
  danger?: string;
  /** 文本色 */
  textPrimary?: string;
  textSecondary?: string;
  textRegular?: string;
  /** 背景色 */
  bgColor?: string;
  /** 边框色 */
  borderColor?: string;
  borderColorLight?: string;
  /** 填充色（次要按钮背景） */
  fillColor?: string;
  fillColorLight?: string;
  /** 圆角 */
  borderRadius?: string;
  /** 字体栈 */
  fontFamily?: string;
}

/** 默认 CSS 变量值（与 Element Plus 设计 token 对齐，保持降级 UI 视觉一致性） */
const DEFAULT_VARIABLES: Required<ErrorStyleVariables> = {
  primary: "#409eff",
  danger: "#f56c6c",
  textPrimary: "#303133",
  textSecondary: "#909399",
  textRegular: "#606266",
  bgColor: "#ffffff",
  borderColor: "#dcdfe6",
  borderColorLight: "#ebeef5",
  fillColor: "#f5f7fa",
  fillColorLight: "#fafafa",
  borderRadius: "6px",
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};

/**
 * 错误 UI CSS 规则（使用 CSS 变量 + BEM 命名）
 *
 * CSS 变量通过 :root 注入，业务方可在自己的 :root 或容器上覆盖。
 *
 * 详细规范：
 * - .micro-error__container: 根容器，flex 居中
 * - .micro-error__icon-wrap: 错误图标外圈
 * - .micro-error__title: 错误标题（h2）
 * - .micro-error__app-name: 应用名（subtitle）
 * - .micro-error__description: 描述文本
 * - .micro-error__actions: 按钮组容器
 * - .micro-error__btn: 通用按钮（BEM base）
 * - .micro-error__btn--primary: 主要按钮（重试）
 * - .micro-error__btn--secondary: 次要按钮（返回首页）
 * - .micro-error__btn--ghost: 幽灵按钮（独立访问）
 * - .micro-error__details: 可折叠技术详情
 * - .micro-error__spinner: 加载中旋转动画
 */
export const ERROR_UI_CSS = `
:root {
  --micro-error-primary: #409eff;
  --micro-error-danger: #f56c6c;
  --micro-error-danger-light: #fef0f0;
  --micro-error-text-primary: #303133;
  --micro-error-text-secondary: #909399;
  --micro-error-text-regular: #606266;
  --micro-error-bg-color: #ffffff;
  --micro-error-border-color: #dcdfe6;
  --micro-error-border-color-light: #ebeef5;
  --micro-error-fill-color: #f5f7fa;
  --micro-error-fill-color-light: #fafafa;
  --micro-error-border-radius: 6px;
  --micro-error-font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

.micro-error__container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  font-family: var(--micro-error-font-family);
  background: var(--micro-error-bg-color);
  color: var(--micro-error-text-primary);
  outline: none;
}

.micro-error__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  border-radius: 50%;
  background: var(--micro-error-danger-light);
}

.micro-error__icon-wrap--compact {
  width: 40px;
  height: 40px;
  margin-bottom: 0;
}

.micro-error__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--micro-error-text-primary);
}

.micro-error__app-name {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--micro-error-text-secondary);
}

.micro-error__description {
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--micro-error-text-regular);
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}

.micro-error__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.micro-error__btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--micro-error-border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.micro-error__btn:focus-visible {
  outline-color: var(--micro-error-primary);
}

.micro-error__btn--primary {
  background: var(--micro-error-primary);
  color: #fff;
}

.micro-error__btn--secondary {
  background: var(--micro-error-fill-color);
  color: var(--micro-error-text-regular);
  border: 1px solid var(--micro-error-border-color);
}

.micro-error__btn--ghost {
  background: transparent;
  color: var(--micro-error-text-secondary);
  border: 1px dashed var(--micro-error-border-color);
}

.micro-error__details {
  margin-top: 24px;
  width: 100%;
  max-width: 500px;
}

.micro-error__details summary {
  cursor: pointer;
  font-size: 13px;
  color: var(--micro-error-text-secondary);
  padding: 8px 0;
  user-select: none;
}

.micro-error__details-body {
  margin-top: 8px;
  padding: 12px;
  background: var(--micro-error-fill-color-light);
  border-radius: var(--micro-error-border-radius);
  font-size: 12px;
  color: var(--micro-error-text-regular);
  font-family: monospace;
  word-break: break-all;
}

.micro-error__details-body > div + div {
  margin-top: 4px;
}

/** 加载 spinner */
.micro-error__spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--micro-error-font-family);
}

.micro-error__spinner-animation {
  width: 40px;
  height: 40px;
  border: 3px solid var(--micro-error-border-color-light);
  border-top-color: var(--micro-error-primary);
  border-radius: 50%;
  animation: micro-error-spin 0.8s linear infinite;
}

.micro-error__spinner-text {
  margin: 16px 0 0;
  font-size: 14px;
  color: var(--micro-error-text-secondary);
}

@keyframes micro-error-spin {
  to { transform: rotate(360deg); }
}
`;

/**
 * 注入错误 UI 样式到 document.head（仅首次调用有效）。
 *
 * 安全特性：
 * - 使用style元素的textContent，无内联事件注入风险
 * - 所有动画/样式使用 micro-error- 前缀，隔离业务样式
 *
 * @param variables - 覆盖的 CSS 变量（未覆盖的使用默认值）
 * @param target - 注入目标，默认 document.head，可传入 ShadowRoot
 * @returns 是否实际执行了注入（false 表示此前已注入过）
 */
export function injectErrorStyles(
  variables?: ErrorStyleVariables,
  target?: { appendChild: (node: Node) => Node },
): boolean {
  // 已经注入过全局样式时返回 false（Shadow DOM 场景例外，始终注入）
  if (injected && !target) return false;

  // 合并变量
  const resolved = { ...DEFAULT_VARIABLES, ...variables };

  // 将 CSS 变量作为 :root 覆盖值注入样式字符串头部
  let styleContent = ERROR_UI_CSS;
  if (variables) {
    const overrideBlock = `:root {
${Object.entries(resolved)
  .filter(([key]) => variables[key as keyof ErrorStyleVariables] !== undefined)
  .map(([key, value]) => {
    const cssName = key.replaceAll(/([A-Z])/g, "-$1").toLowerCase();
    return `  --micro-error-${cssName}: ${value};`;
  })
  .join("\n")}
}`;
    styleContent = styleContent.replace(
      ":root {",
      `:root {\n${overrideBlock}\n\n:root-ignore {`,
    );
    // 简化：直接 prepend override block (快速实现)
    styleContent = `${overrideBlock}\n${styleContent}`;
  }

  const styleEl = document.createElement("style");
  styleEl.dataset.microErrorStyles = "true";
  styleEl.textContent = styleContent;

  const injectTarget = target || document.head;
  if (injectTarget && "head" in injectTarget) {
    // Document 类型：注入到 head（appendChild 与 append 等价，取兼容面更广的 API）
    (injectTarget as unknown as Document).head.appendChild(styleEl);
  } else {
    // ShadowRoot 或普通元素
    (injectTarget as Node).appendChild(styleEl);
  }

  if (!target) injected = true;
  return true;
}

/**
 * 错误 UI class 名常量（供 error-boundary.ts 模板拼接使用）
 *
 * 集中管理 class 名，防止字符串散落在模板中出错。
 */
export const ERROR_UI_CLASSES = {
  container: "micro-error__container",
  iconWrap: "micro-error__icon-wrap",
  title: "micro-error__title",
  appName: "micro-error__app-name",
  description: "micro-error__description",
  actions: "micro-error__actions",
  btn: "micro-error__btn",
  btnPrimary: "micro-error__btn micro-error__btn--primary",
  btnSecondary: "micro-error__btn micro-error__btn--secondary",
  btnGhost: "micro-error__btn micro-error__btn--ghost",
  details: "micro-error__details",
  detailsBody: "micro-error__details-body",
  spinner: "micro-error__spinner",
  spinnerAnimation: "micro-error__spinner-animation",
  spinnerText: "micro-error__spinner-text",
  iconWrapCompact: "micro-error__icon-wrap micro-error__icon-wrap--compact",
} as const;
