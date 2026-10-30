/**
 * 命令式 Dialog 的内部实现（懒加载模块）。
 *
 * <p>单独拆出以实现 tree-shaking：如业务侧不使用命令式 API，此模块代码不会被打包。
 *
 * <p>原理：在临时 createApp 容器内挂载 YdDialogContainer，通过回调 ref 拿到容器
 * 实例，再用 push / closeDialog 管理弹窗生命周期。
 *
 * <p>与 useDrawer 的区别：Dialog 是模态居中弹窗，不是侧滑面板；容器挂载到 body，
 * z-index 默认 10000（高于 Drawer 的 9999）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\dialog\use-dialog-internal.ts
 * @author ydsz-team
 * @since 26.10.30
 */

import type { ComponentPublicInstance } from 'vue';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import type { DialogOptions, DialogInstance, DialogCloseReason, DialogContainerExposed } from './use-dialog';

/** 弹窗 Promise 解析回调（本地定义避免循环） */
type DialogResolve = (payload: { data?: unknown; reason: DialogCloseReason }) => void;

/** 单调递增的弹窗 id */
let _nextId = 0;

/** 生成唯一弹窗 id */
function nextDialogId(): string {
  _nextId += 1;
  return `ydsz-dialog-${Date.now()}-${_nextId}`;
}

/** 容器 App 缓存 */
interface ContainerEntry {
  app: ReturnType<typeof createApp>;
  container: HTMLElement;
  dialogContainer: DialogContainerExposed | null;
}

let _containerEntry: ContainerEntry | null = null;

/**
 * Host 组件 —— 渲染 YdDialogInternalContainer，用回调 ref 回填实例。
 */
const DialogHost = defineComponent({
  name: 'YdDialogHost',
  setup() {
    function bindRef(instance: Element | ComponentPublicInstance | null): void {
      if (!_containerEntry || !instance) return;
      _containerEntry.dialogContainer = instance as unknown as DialogContainerExposed;
    }
    return () => h('div', { ref: bindRef, style: 'display:none' });
  },
});

/**
 * 内部容器组件：管理多个 Dialog 叠加显示。
 */
const YdDialogInternalContainer = defineComponent({
  name: 'YdDialogInternalContainer',
  setup() {
    const dialogs = ref<Array<{ id: string; vnode: any }>>([]);

    function push(id: string, vnode: any) {
      dialogs.value = [...dialogs.value, { id, vnode }];
    }

    function close(id: string) {
      dialogs.value = dialogs.value.filter((d) => d.id !== id);
    }

    function closeAll() {
      dialogs.value = [];
    }

    defineExpose({ push, close, closeAll });

    return () =>
      h(
        'div',
        { 'data-ydsz-dialog-root': '', style: 'position:fixed;inset:0;pointer-events:none;' },
        dialogs.value.map((d) =>
          h(d.vnode, {
            key: d.id,
            onClose: () => close(d.id),
          }),
        ),
      );
  },
});

/**
 * 确保全局容器已挂载。
 */
async function ensureContainer(): Promise<ContainerEntry> {
  if (_containerEntry) return _containerEntry;

  const container = document.createElement('div');
  container.setAttribute('data-ydsz-dialog-root', '');
  container.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:10000;';
  document.body.appendChild(container);

  const app = createApp(DialogHost);
  _containerEntry = { app, container, dialogContainer: null };
  app.mount(container);
  await nextTick();

  return _containerEntry;
}

/* ============================================================ */
/* 公开 API                                                       */
/* ============================================================ */

/**
 * 命令式打开一个 Dialog。
 *
 * @param options - Dialog 配置
 * @returns DialogInstance（包含 close 方法与解析 Promise）
 *
 * @example
 * ```ts
 * const { dialog } = useDialog();
 * const { close, promise } = await dialog.open({
 *   header: '用户详情',
 *   component: markRaw(UserDetail),
 *   props: { userId: 123 },
 *   width: '600px',
 * });
 * const { data, reason } = await promise; // 'close' | 'mask' | 'esc' | 'api'
 * ```
 */
export async function openDialog(options: DialogOptions): Promise<DialogInstance> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('[YdDialog] 命令式 API 仅在客户端可用');
  }

  const host = await ensureContainer();
  const container = host.dialogContainer;
  if (!container) {
    throw new Error('[YdDialog] 弹窗容器初始化失败');
  }

  const id = nextDialogId();
  let resolved = false;

  let _resolve!: DialogResolve;
  const promise = new Promise<{ data?: unknown; reason: 'close' | 'mask' | 'esc' | 'api' }>(
    (resolve) => {
      _resolve = resolve;
    },
  );

  function finish(payload: { data?: unknown; reason: 'close' | 'mask' | 'esc' | 'api' }): void {
    if (resolved) return;
    resolved = true;
    try {
      options.onClose?.(payload.reason);
    } catch {
      // onClose 抛出错误不应影响内部状态
    }
    _resolve(payload);
    container!.close(id);
  }

  const close = (data?: unknown): void => {
    if (resolved) return;
    finish({ data, reason: 'api' });
  };

  // 构建内部弹窗 vnode
  const dialogVNode = defineComponent({
    name: `YdDialog-${id}`,
    setup() {
      return () =>
        h(YdDialogInternalContainer, {}, {
          default: () =>
            h(
              'div',
              {
                'data-ydsz-dialog-overlay': '',
                class: 'fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 pointer-events-auto',
                onClick: options.closeOnOverlayClick !== false
                  ? () => finish({ reason: 'mask' })
                  : undefined,
              },
              [
                h(
                  'div',
                  {
                    class: `relative bg-surface-2 rounded-xl shadow-xl animate-in zoom-in-95 fade-in duration-200 ${
                      options.width ? '' : 'w-full max-w-lg'
                    }`,
                    style: options.width ? { width: options.width } : undefined,
                    onClick: (e: MouseEvent) => e.stopPropagation(),
                  },
                  [
                    // Header
                    options.header
                      ? h('div', { class: 'flex items-center justify-between p-4 border-b border-border' }, [
                          h('h3', { class: 'text-lg font-semibold' }, options.header),
                          h(
                            'button',
                            {
                              class: 'rounded-full p-1 hover:bg-accent transition-colors',
                              onClick: () => finish({ reason: 'close' }),
                              'aria-label': '关闭',
                            },
                            [h('span', { class: 'size-4 block' }, '×')],
                          ),
                        ])
                      : null,
                    // Content (动态组件)
                    h(
                      'div',
                      { class: 'p-4' },
                      options.component
                        ? h(options.component, {
                            ...options.props,
                            onClose: (data?: unknown) => finish({ data, reason: 'api' }),
                          })
                        : undefined,
                    ),
                  ],
                ),
              ],
            ),
        });
    },
  });

  container.push(id, h(dialogVNode));

  return { close, promise };
}

/**
 * 关闭所有命令式 Dialog。
 */
export function closeAllDialogs(): void {
  _containerEntry?.dialogContainer?.closeAll();
}

/**
 * 卸载并清空全局 Dialog 容器 —— 仅用于测试隔离。
 */
export function __resetDialogContainerForTests(): void {
  if (!_containerEntry) return;
  _containerEntry.app.unmount();
  _containerEntry.container.remove();
  _containerEntry = null;
}
