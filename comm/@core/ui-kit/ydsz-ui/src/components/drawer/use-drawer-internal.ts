/**
 * 命令式抽屉的内部实现（懒加载模块）。
 *
 * 单独拆出以实现 tree-shaking：不使用命令式 API 时，此模块代码不会被打包。
 *
 * 原理：在临时 createApp 容器内挂载 YdDrawerContainer + 回调 ref，
 * 拿到容器实例后通过 _push / closeDrawer 管理抽屉生命周期。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\use-drawer-internal.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { App } from 'vue';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import YdDrawerContainer from './YdDrawerContainer.vue';

import type { DrawerCloseReason, DrawerEntry, DrawerInstance, DrawerOptions } from './types';

/** 单调递增的抽屉 id */
let nextIdCounter = 0;

/**
 * 获取下一个唯一抽屉 id。
 */
function nextDrawerId(): string {
  nextIdCounter += 1;
  return `yd-drawer-${Date.now()}-${nextIdCounter}`;
}

/* ============================================================ */
/* 容器 App 缓存                                                   */
/* ============================================================ */

/**
 * YdDrawerContainer 暴露的方法签名 —— 用于类型断言。
 *
 * <p>defineExpose 的暴露属性和 InstanceType 推导不一致，
 * 因此在此处手拟接口用于 internal 代码中访问。
 */
export interface DrawerContainerExposed {
  _push: (entry: DrawerEntry, resolve: (data?: unknown) => void) => void;
  closeDrawer: (id: string, data?: unknown) => void;
  closeAll: () => void;
}

interface ContainerEntry {
  app: App;
  container: HTMLElement;
  drawerContainer: DrawerContainerExposed | null;
}

let containerEntry: ContainerEntry | null = null;

/**
 * Host 组件 —— 内部渲染 YdDrawerContainer，通过 ref 捕获实例。
 */
const DrawerHost = defineComponent({
  name: 'DrawerHost',
  setup() {
    const drawerRef = ref<DrawerContainerExposed | null>(null);
    return { drawerRef };
  },
  mounted(this: any) {
    if (containerEntry) {
      containerEntry.drawerContainer = this.drawerRef || null;
    }
  },
  render(this: any) {
    return h(YdDrawerContainer, { ref: 'drawerRef' });
  },
});

/**
 * 确保全局容器已挂载。
 *
 * 仅在首次调用 open 时执行——之后复用同一容器，支持多个抽屉同时打开。
 */
async function ensureContainer(): Promise<ContainerEntry> {
  if (containerEntry) return containerEntry;

  const container = document.createElement('div');
  container.setAttribute('data-yd-drawer-root', '');
  container.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:9999;';
  document.body.appendChild(container);

  const app = createApp(DrawerHost);
  app.mount(container);

  await nextTick();
  await nextTick();

  containerEntry = {
    app,
    container,
    drawerContainer: null,
  };

  return containerEntry;
}

/**
 * 获取挂载的 YdDrawerContainer 实例。
 */
function getDrawerContainer(): DrawerContainerExposed | null {
  if (!containerEntry) return null;
  if (containerEntry.drawerContainer) return containerEntry.drawerContainer;
  // 重试一次（mounted 可能在 async 函数中被触发）
  return containerEntry.drawerContainer;
}

/* ============================================================ */
/* 公开 API                                                       */
/* ============================================================ */

/**
 * 命令式打开一个抽屉。
 *
 * @param options 抽屉配置
 * @returns DrawerInstance（包含 close 方法与解析 Promise）
 *
 * @example
 * ```ts
 * const drawerApi = useDrawer();
 * const { close, promise } = await drawerApi.drawer.open({
 *   header: '详情',
 *   position: 'right',
 *   width: 560,
 *   component: markRaw(EditForm),
 *   props: { id: 123 },
 * });
 * ```
 */
export async function openDrawer(options: DrawerOptions): Promise<DrawerInstance> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('[YdDrawer] 命令式 API 仅在客户端可用');
  }

  await ensureContainer();

  const id = nextDrawerId();
  let resolved = false;

  let _resolve: (payload: { reason: DrawerCloseReason; data?: unknown }) => void;
  const promise = new Promise<{ reason: DrawerCloseReason; data?: unknown }>((resolve) => {
    _resolve = resolve;
  });

  const entry: DrawerEntry = { id, options };

  const container = getDrawerContainer();

  /** 内部 resolve —— 搭配 onClose 回调 */
  function internalResolve(reason: DrawerCloseReason, data?: unknown): void {
    if (resolved) return;
    resolved = true;
    try {
      options.onClose?.(reason);
    } catch {
      // onClose 抛出错误不应影响内部状态
    }
    _resolve({ reason, data });
  }

  if (container) {
    container._push(entry, (_data?: unknown) => internalResolve('api', _data));
  } else {
    // 若容器未就绪，Promise 挂起
    // 业务方不应遇到此分支
  }

  /** 手动关闭 */
  function close(): void {
    if (resolved) return;
    container?.closeDrawer(id);
    internalResolve('api');
  }

  return { close, promise };
}

/**
 * 关闭所有命令式抽屉。
 */
export function closeAllDrawers(): void {
  const container = getDrawerContainer();
  if (container) {
    container.closeAll();
  }
}
