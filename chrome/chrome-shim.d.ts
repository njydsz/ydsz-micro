/**
 * Chrome MV3 扩展 API 轻量类型声明
 *
 * 覆盖 DevTools 扩展中实际使用的 chrome.* 子集，避免引入 @types/chrome 依赖。
 * 如后续扩展 API 覆盖不足，请在此文件补充对应接口声明，或迁移至 @types/chrome。
 *
 * @path chrome/chrome-shim.d.ts
 * @since 4.1.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export {};

declare global {
  // ── chrome.tabs ───────────────────────────────────────────────
  export namespace chrome.tabs {
    export interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
      windowId?: number;
    }

    export interface MessageOptions {
      frameId?: number;
      documentId?: string;
    }

    export function query(
      queryInfo: { active?: boolean; currentWindow?: boolean; windowId?: number },
      callback: (tabs: Tab[]) => void
    ): void;

    export function sendMessage<T = unknown>(
      tabId: number,
      message: any,
      _options?: MessageOptions
    ): Promise<T>;

    export interface TabActiveInfo {
      tabId: number;
      windowId: number;
    }

    export const onRemoved: ChromeEvent<(tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void>;
    export const onActivated: ChromeEvent<(activeInfo: TabActiveInfo) => void>;
  }

  // ── chrome.runtime ────────────────────────────────────────────
  export namespace chrome.runtime {
    export interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    export interface Port {
      name: string;
      sender?: MessageSender;
      onMessage: ChromeEvent<(message: any, port: Port) => void>;
      onDisconnect: ChromeEvent<(port: Port) => void>;
      postMessage(message: any): void;
      disconnect(): void;
    }

    export interface ExtensionConnectInfo {
      name?: string;
    }

    export function sendMessage<T = unknown>(message: any): Promise<T>;

    export function connect(connectInfo?: ExtensionConnectInfo): Port;

    export function getURL(path: string): string;

    export const onMessage: ChromeEvent<
      (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => boolean | void
    >;

    export const onConnect: ChromeEvent<(port: Port) => void>;
  }

  // ── chrome.storage ────────────────────────────────────────────
  export namespace chrome.storage {
    export interface StorageArea {
      get(
        keys: string | string[] | Record<string, unknown> | null,
        callback: (items: Record<string, unknown>) => void
      ): void;
      set(items: Record<string, unknown>, callback?: () => void): void;
      remove(keys: string | string[], callback?: () => void): void;
      clear(callback?: () => void): void;
    }

    export const sync: StorageArea;
    export const local: StorageArea;
    export const session: StorageArea;

    export const onChanged: ChromeEvent<
      (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => void
    >;
  }

  // ── chrome.devtools ──────────────────────────────────────────
  export namespace chrome.devtools {
    export interface Panel {
      onShown: ChromeEvent<(window: Window) => void>;
      onHidden: ChromeEvent<() => void>;
    }

    export interface PanelWithSidebar {
      setPage(path: string): void;
    }

    export interface InspectedWindow {
      tabId: number;
      eval<T = unknown>(
        expression: string,
        _options?: { useContentScriptContext?: string | boolean; frameURL?: string; scriptExecutionContext?: string },
        callback?: (result: T, error: { value?: unknown; isException: boolean; description: string } | undefined) => void
      ): Promise<T>;
      reload(_options?: {}): void;
      getResources(callback: (resources: any[]) => void): void;
      onResourceAdded: ChromeEvent<(resource: any) => void>;
      onResourceContentCommitted: ChromeEvent<(resource: any, content: string) => void>;
    }

    export const inspectedWindow: InspectedWindow;

    export const panels: {
      create(
        title: string,
        iconPath: string,
        pagePath: string,
        callback?: (panel: Panel) => void
      ): Panel;
      themeName: string;
      createSidebarPane?(
        title: string,
        callback: (panel: PanelWithSidebar) => void
      ): void;
      elements?: {
        createSidebarPane?: (title: string, callback: (sidebar: unknown) => void) => void;
        onSelectionChanged?: ChromeEvent<() => void>;
      };
      sources?: {
        createSidebarPane?: (title: string, callback: (sidebar: unknown) => void) => void;
        onSelectionChanged?: ChromeEvent<() => void>;
      };
      setOpenResourceHandler?: (callback: (resource: any) => void) => void;
    };
  }

  // ── chrome.scripting ─────────────────────────────────────────
  export namespace chrome.scripting {
    export interface InjectionTarget {
      tabId: number;
      frameIds?: number[];
      allFrames?: boolean;
    }

    export interface ScriptInjection {
      target: InjectionTarget;
      func?: (...args: any[]) => void;
      files?: string[];
      injectImmediately?: boolean;
      world?: 'ISOLATED' | 'MAIN';
    }

    export function executeScript<T = unknown>(
      injection: ScriptInjection,
      callback?: (results: { result: T }[]) => void
    ): Promise<{ result: T }[]>;
  }

  // ── Event helper ──────────────────────────────────────────────
  export interface ChromeEvent<T extends (...args: any[]) => void> {
    addListener(callback: T): void;
    removeListener(callback: T): void;
    hasListener(callback: T): boolean;
    hasListeners(): boolean;
  }
}
