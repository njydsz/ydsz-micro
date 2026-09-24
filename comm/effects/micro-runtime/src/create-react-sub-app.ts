/**
 * createReactSubApp — 跨框架 React 子应用适配器。
 *
 * 微前端内核（micro-kernel + micro-runtime）原生支持 Vue 子应用。
 * 本适配器通过 iframe 沙箱桥接 React 子应用，使其与 Vue 子应用
 * 在同一注册表中共存——对主应用路由透明，切换时自动按框架路由到正确的挂载器。
 *
 * ## 架构
 * ```
 *  Host App (Vue 3)
 *    ├─ Vue Sub-App (snapshot/proxy sandbox)
 *    └─ React Sub-App ──► iframe sandbox ──► React App
 *                            ▲
 *                            └─ bridge: postMessage RPC (__MICRO_GLOBAL_STATE__)
 * ```
 *
 * ## 桥接协议
 * iframe-bridge 注入脚本后，React 子应用通过如下全局接口与主应用互通：
 * - `window.__MICRO_GLOBAL_STATE__` — 主应用下发的全局状态快照
 * - `window.__MICRO_SET_GLOBAL_STATE__(patch)` — 子应用回写状态
 * - `window.__MICRO_CALL_MAIN__(method, args)` — 调用主应用暴露的 API
 *
 * ## 注册示例
 * ```ts
 * import { createReactSubApp } from '@ydsz/micro-runtime/react';
 * import { createRoot } from 'react-dom/client';
 * import { App } from './App';
 *
 * export const reactSubApp = createReactSubApp({
 *   name: 'my-react-app',
 *   mount: (ctx) => {
 *     const root = createRoot(ctx.container);
 *     root.render(<App />);
 *     return () => root.unmount();
 *   },
 * });
 * ```
 *
 * ## 关于 ESM hosted 模式下 iframe 沙箱
 * `createIframeSandbox` 在调用时自动完成：
 *   - 创建 iframe 元素并 append 到 parentEl
 *   - 写入 about:blank 文档基础 HTML
 *   - 复制主应用共享样式表（CSS 变量、设计令牌）
 *   - 在 iframe body 内创建 #subapp-container 容器
 *   - 注入 postMessage 桥接脚本
 *
 * 因此 createReactSubApp 无需手动创建容器，仅需调用 mount 回调
 * 将 React 组件树挂载到 ctx.container（iframe 内容器）即可。
 *
 * @path comm/effects/micro-runtime/src/create-react-sub-app.ts
 * @author ydsz-ai
 * @since 5.0.0
 */

import type { ReactSubAppMountContext, ReactSubAppOptions, ReactSubAppHandle } from './types-react-sub-app';

import type { IframeSandboxLike } from './iframe-sandbox-bridge';
import { resolveIframeSandboxFactory } from './iframe-sandbox-bridge';

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('ReactSubApp');

let seq = 0;

/**
 * 创建跨框架 React 子应用适配器。
 *
 * @param options - React 子应用配置
 * @returns ReactSubAppHandle（与 micro-runtime 生命周期对齐）
 */
export function createReactSubApp(options: ReactSubAppOptions): ReactSubAppHandle {
  const { mount, name = `react-sub-${++seq}` } = options;

  let sandbox: IframeSandboxLike | null = null;
  let unmountFn: (() => void) | null = null;
  let containerEl: HTMLElement | null = null;

  return {
    name,

    /**
     * 挂载子应用：创建 iframe 沙箱 + 注入桥接脚本 + 调用 mount 回调。
     * iframe-sandbox.createIframeSandbox() 自动完成 iframe/容器/桥接创建。
     */
    async mount(props?: Record<string, unknown>): Promise<void> {
      const parentEl = resolveParentContainer(name, props);
      // v5.1.0: 依赖倒置 — 沙箱工厂由 micro-kernel 注册，runtime 不再静态依赖 kernel
      const createSandbox = resolveIframeSandboxFactory();
      sandbox = createSandbox(name, parentEl);

      // iframe-sandbox 已自动激活并完成：
      //   - iframe 创建 + append
      //   - 文档写入 + 容器创建
      //   - 桥接脚本注入
      sandbox.activate();

      if (!sandbox.container) {
        throw new Error(`[ReactSubApp:${name}] iframe 容器未就绪`);
      }

      containerEl = sandbox.container!;

      const mountContext: ReactSubAppMountContext = {
        container: containerEl!,
        globalState: extractGlobalState(sandbox),
        callMain: (method, args) => {
          if (!sandbox) return Promise.reject(new Error('sandbox 已销毁'));
          return sandbox.callRpc(method, args ?? []);
        },
      };

      try {
        const result = mount(mountContext);
        unmountFn = result instanceof Promise ? await result : result;
      } catch (error) {
        logger.error(`[${name}] React 子应用挂载失败`, error);
        sandbox.cleanup();
        sandbox = null;
        throw error;
      }

      logger.info(`[${name}] React 子应用已挂载（iframe 沙箱, ESM hosted）`);
    },

    /**
     * 卸载子应用：清理 React 组件树 + 销毁 iframe 沙箱。
     */
    async unmount(): Promise<void> {
      try {
        if (typeof unmountFn === 'function') {
          unmountFn();
        }
      } catch (error) {
        logger.warn(`[${name}] React 卸载异常`, error);
      } finally {
        unmountFn = null;
      }

      if (sandbox) {
        sandbox.deactivate();
        sandbox.cleanup();
        sandbox = null;
      }

      containerEl = null;
      logger.info(`[${name}] React 子应用已卸载`);
    },

    /**
     * 更新子应用（props 透传）。
     */
    async update(props?: Record<string, unknown>): Promise<void> {
      logger.debug(`[${name}] 收到 update`, props);
      if (sandbox) {
        sandbox.postToChild({ type: 'props-update', props : props ?? {} });
      }
    },
  };
}

/**
 * 从 props 或配置中解析父容器元素。
 *
 * iframe-sandbox 需要一个真实的 HTMLElement 作为 iframe 的挂载目标。
 * React 适配器的容器来源：
 * 1. props.container 直接传入
 * 2. 通过 micro-kernel 注册表自动获取
 */
function resolveParentContainer(name: string, props?: Record<string, unknown>): HTMLElement {
  if (props?.container instanceof HTMLElement) {
    return props.container;
  }

  // 备用：在 #subapp-container 下创建专用容器
  const hostEl = document.querySelector<HTMLElement>('#subapp-container')
    ?? document.body;
  const wrapEl = document.createElement('div');
  wrapEl.setAttribute('data-react-sub-app', name);
  wrapEl.style.width = '100%';
  wrapEl.style.height = '100%';
  hostEl.append(wrapEl);
  return wrapEl;
}

/**
 * 从 iframe contentWindow 读取 globalState 快照。
 * iframe-bridge 脚本创建了 window.__MICRO_GLOBAL_STATE__。
 */
function extractGlobalState(sandbox: IframeSandboxLike): Record<string, unknown> {
  return (sandbox.contentWindow as Window & { __MICRO_GLOBAL_STATE__?: Record<string, unknown> })
    ?.__MICRO_GLOBAL_STATE__ ?? {};
}

/**
 * 注册表扩展类型——在 micro-app-config 的 MicroAppConfig 上增加可选框架声明。
 *
 * 内核在遇到 framework: 'react' 的应用时自动切换到 React 适配器挂载。
 */
export interface ReactMicroAppConfig {
  /** 声明框架为 react，内核将自动使用 createReactSubApp 装载 */
  framework?: 'react';
}
