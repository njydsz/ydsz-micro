/**
 * 命令式抽屉的内部实现（懒加载模块）。
 *
 * <p>单独拆出以实现 tree-shaking：不使用命令式 API 时，此模块代码不会被打包。
 *
 * <p>原理：在临时 createApp 容器内挂载 YdDrawerContainer，通过回调 ref 拿到容器
 * 实例，再用 push / closeDrawer 管理抽屉生命周期。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\drawer\use-drawer-internal.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { App, ComponentPublicInstance } from 'vue';

import { createApp, defineComponent, h, nextTick } from 'vue';

import type { DrawerCloseReason, DrawerEntry, DrawerInstance, DrawerOptions } from './types';

import YdDrawerContainer from './YdDrawerContainer.vue';

/** 单调递增的抽屉 id */
let nextIdCounter = 0;

/**
 * 获取下一个唯一抽屉 id。
 *
 * @returns 形如 `yd-drawer-<时间戳>-<序号>` 的 id
 */
function nextDrawerId(): string {
  nextIdCounter += 1;
  return `yd-drawer-${Date.now()}-${nextIdCounter}`;
}

/* ============================================================ */
/* 容器 App 缓存                                                   */
/* ============================================================ */

/**
 * YdDrawerContainer 暴露的方法签名 —— defineExpose 的暴露属性无法通过
 * InstanceType 稳定推导，这里手拟接口供 internal 代码访问。
 */
export interface DrawerContainerExposed {
  closeAll: () => void;
  closeDrawer: (id: string, data?: unknown) => void;
  push: (entry: DrawerEntry, resolve: DrawerResolve) => void;
}

/** 抽屉 Promise 解析回调 */
export type DrawerResolve = (payload: { data?: unknown; reason: DrawerCloseReason }) => void;

interface ContainerEntry {
  app: App;
  container: HTMLElement;
  drawerContainer: DrawerContainerExposed | null;
}

let containerEntry: ContainerEntry | null = null;

/**
 * Host 组件 —— 渲染 YdDrawerContainer，用回调 ref 直接把实例写回 containerEntry。
 *
 * <p>此前用 options-API 的 mounted 钩子回填，但 mounted 早于 containerEntry 赋值，
 * 导致实例永远拿不到、open() 挂起。
 */
const DrawerHost = defineComponent({
  name: 'DrawerHost',
  setup() {
    function bindRef(instance: Element | ComponentPublicInstance | null): void {
      if (!containerEntry || !instance) return;
      containerEntry.drawerContainer = instance as unknown as DrawerContainerExposed;
    }
    return () => h(YdDrawerContainer, { ref: bindRef });
  },
});

/**
 * 确保全局容器已挂载。
 *
 * <p>仅首次调用 open 时执行，之后复用同一容器以支持多个抽屉叠加。
 *
 * @returns 容器条目
 */
async function ensureContainer(): Promise<ContainerEntry> {
  if (containerEntry) return containerEntry;

  const container = document.createElement('div');
  container.setAttribute('data-yd-drawer-root', '');
  // 零尺寸 + pointer-events:none：空容器不拦截页面，抽屉面板自行恢复命中
  container.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:9999;';
  document.body.appendChild(container);

  const app = createApp(DrawerHost);
  // 先占位再挂载：回调 ref 在 mount 期间就会写入 drawerContainer
  containerEntry = { app, container, drawerContainer: null };
  app.mount(container);
  await nextTick();

  return containerEntry;
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
 * const { drawer } = useDrawer();
 * const { close, promise } = await drawer.open({
 *   header: '详情',
 *   position: 'right',
 *   width: 560,
 *   component: markRaw(EditForm),
 *   props: { id: 123 },
 * });
 * const { reason } = await promise; // 'close' | 'mask' | 'esc' | 'api'
 * ```
 */
export async function openDrawer(options: DrawerOptions): Promise<DrawerInstance> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('[YdDrawer] 命令式 API 仅在客户端可用');
  }

  const host = await ensureContainer();
  const container = host.drawerContainer;
  if (!container) {
    throw new Error('[YdDrawer] 抽屉容器初始化失败');
  }

  const id = nextDrawerId();
  let resolved = false;

  let _resolve!: (payload: { data?: unknown; reason: DrawerCloseReason }) => void;
  const promise = new Promise<{ data?: unknown; reason: DrawerCloseReason }>((resolve) => {
    _resolve = resolve;
  });

  /** 统一出口：回调 onClose 与 Promise 解析只发生一次 */
  function finish(payload: { data?: unknown; reason: DrawerCloseReason }): void {
    if (resolved) return;
    resolved = true;
    try {
      options.onClose?.(payload.reason);
    } catch {
      // onClose 抛出错误不应影响内部状态
    }
    _resolve(payload);
  }

  container.push({ id, options }, finish);

  /** 手动关闭，可携带回传给调用方的数据（箭头函数：函数声明会丢失上方 guard 的类型收窄） */
  const close = (data?: unknown): void => {
    if (resolved) return;
    container.closeDrawer(id, data);
  };

  return { close, promise };
}

/**
 * 关闭所有命令式抽屉。
 *
 * @returns 无
 */
export function closeAllDrawers(): void {
  containerEntry?.drawerContainer?.closeAll();
}

/**
 * 卸载并清空全局抽屉容器 —— 仅用于测试隔离。
 *
 * @returns 无
 */
export function __resetDrawerContainerForTests(): void {
  if (!containerEntry) return;
  containerEntry.app.unmount();
  containerEntry.container.remove();
  containerEntry = null;
}
