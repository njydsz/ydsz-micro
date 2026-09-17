/**
 * Chrome MV3 扩展 API 类型声明（子集）
 *
 * 覆盖本扩展实际使用的 chrome.* 子集；未列出成员回退为 any。
 * 后续若需 @types/chrome 全量类型，可替换本文件。
 *
 * @path chrome/chrome-shim.d.ts
 * @since 4.1.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// 本文件无 import/export，作为全局脚本（非模块）；declare global 在模块与非模块下均可工作。
declare global {
  namespace chrome {
    namespace tabs {
      interface Tab {
        id?: number;
        url?: string;
        title?: string;
        active?: boolean;
        windowId?: number;
      }

      function query(queryInfo: { active?: boolean; currentWindow?: boolean; windowId?: number }, callback: (tabs: Tab[]) => void): void;
      function sendMessage<T = unknown>(tabId: number, message: any): Promise<T>;

      const onRemoved: { addListener(cb: (tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void): void };
      const onActivated: { addListener(cb: (activeInfo: { tabId: number; windowId: number }) => void): void };
    }

    namespace runtime {
      interface MessageSender {
        tab?: chrome.tabs.Tab;
        frameId?: number;
        id?: string;
        url?: string;
      }

      function sendMessage<T = unknown>(message: any, callback?: (response: T) => void): Promise<T>;
      function connect(connectInfo?: { name?: string }): Port;
      function getURL(path: string): string;

      interface Port {
        name: string;
        sender?: MessageSender;
        onMessage: { addListener(cb: (message: any, port: Port) => void): void };
        onDisconnect: { addListener(cb: (port: Port) => void): void };
        postMessage(message: any): void;
        disconnect(): void;
      }

      const onMessage: { addListener(cb: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => boolean | void): void };
      const onConnect: { addListener(cb: (port: Port) => void): void };
    }

    namespace devtools {
      interface Panel {
        onShown: { addListener(cb: () => void): void };
        onHidden: { addListener(cb: () => void): void };
      }

      interface InspectedWindow {
        tabId: number;
        eval(expression: string): Promise<unknown>;
      }

      interface Panels {
        create(title: string, iconPath: string, pagePath: string, callback?: (panel: Panel) => void): Panel;
        themeName: string;
      }

      const inspectedWindow: InspectedWindow;
      const panels: Panels;
    }
  }
}

export {};
