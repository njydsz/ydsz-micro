/**
 * 命令式对话框 composable —— 对标 ANT DynamicDialog / EP ElMessageBox.confirm。
 *
 * 基于 Radix Vue dialog anatomy 的命令式封装，在任意 JS/TS 上下文中
 * 以 Promise 方式调用对话框，支持阻塞等待用户选择。
 *
 * @example
 * ```ts
 * // 简单确认
 * const ok = await useDialog({ title: '确认删除', description: '确定要删除？' });
 * if (ok) { ... }
 *
 * // 自定义内容组件
 * const ok = await useDialog({
 *   title: '编辑',
 *   component: MyEditForm,
 *   componentProps: { id: 123 },
 * });
 *
 * // 自定义按钮组
 * const ok = useDialog({
 *   title: '选择操作',
 *   actions: [
 *     { label: '保存', variant: 'default', handler: () => save() },
 *     { label: '不保存', variant: 'ghost' },
 *     { label: '取消', variant: 'outline' },
 *   ],
 * });
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\headless\use-dialog.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { App, Component } from 'vue';

import { createApp, defineComponent, h, ref, onMounted } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogPortal,
} from '@ydsz-core/ydsz-vue';

import { buttonVariants } from '../components/button';

/* ============================================================ */
/* 类型定义                                                       */
/* ============================================================ */

/** 按钮 variant */
export type DialogActionVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';

/** 对话框按钮动作 */
export interface DialogAction {
  /** 按钮文字 */
  label: string;
  /** 按钮 variant */
  variant?: DialogActionVariant;
  /** 点击回调，返回 false 则不关闭 */
  handler?: () => boolean | void | Promise<boolean | void>;
}

/** 对话框配置项 */
export interface DialogOptions {
  /** 标题 */
  title?: string;
  /** 描述文本 */
  description?: string;
  /** 内容组件（可以是任意 Vue 组件） */
  component?: Component;
  /** 内容组件 props */
  componentProps?: Record<string, unknown>;
  /** 自定义底部按钮组，覆盖默认 confirm/cancel */
  actions?: DialogAction[];
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 宽度 */
  width?: string | number;
  /** 点击遮罩关闭 */
  closeOnClickOutside?: boolean;
  /** ESC 关闭 */
  closeOnEsc?: boolean;
}

/** 对话框实例句柄 */
export interface DialogInstance {
  /** Promise，用户点击确认时 resolve(true)，取消时 resolve(false) */
  promise: Promise<boolean>;
  /** 手动关闭 */
  close: () => void;
}

/* ============================================================ */
/* 内部组件                                                       */
/* ============================================================ */

/** DialogHost —— 局部内部组件，由 createApp 挂载到临时 div */
const DialogHost = defineComponent({
  name: 'YdDialogHost',
  props: {
    options: { type: Object as () => DialogOptions, required: true },
    resolve: {
      type: Function as unknown as () => (value: boolean) => void,
      required: true,
    },
  },
  setup(props) {
    const visible = ref<boolean>(true);
    const isClient = ref(false);

    onMounted(() => {
      isClient.value = true;
    });

    /**
     * 关闭对话框。
     * @param result Promise 解析值
     */
    function doClose(result: boolean): void {
      if (!visible.value) return;
      visible.value = false;
      props.resolve(result);
    }

    /**
     * 处理按钮动作：若 handler 返回 false 则不关闭。
     */
    async function handleAction(action: DialogAction | undefined, result: boolean): Promise<void> {
      if (action?.handler) {
        const handlerResult = await action.handler();
        if (handlerResult === false) return;
      }
      doClose(result);
    }

    /**
     * 遮罩点击：受 closeOnClickOutside 控制。
     */
    function onOverlayPointerDownOutside(): void {
      if (props.options.closeOnClickOutside !== false) {
        doClose(false);
      }
    }

    /**
     * ESC 按键：受 closeOnEsc 控制。
     */
    function onEscapeKeyDown(event: KeyboardEvent): void {
      if (props.options.closeOnEsc === false) {
        event.preventDefault();
      }
    }

    return () => {
      if (!isClient.value) return null;

      const opts = props.options;
      const widthStyle = opts.width
        ? { maxWidth: typeof opts.width === 'number' ? `${opts.width}px` : opts.width }
        : { maxWidth: '28rem' };

      // 构建底部按钮
      const actionButtons: DialogAction[] = opts.actions ?? [
        {
          label: opts.cancelText || '取消',
          variant: 'outline',
        },
        {
          label: opts.confirmText || '确定',
          variant: 'default',
        },
      ];

      return h(
        DialogRoot,
        {
          open: visible.value,
          onUpdate: (open: boolean) => {
            if (!open) doClose(false);
          },
        },
        {
          default: () =>
            h(DialogPortal, null, {
              default: () =>
                h(DialogContent, {
                  class: cn(
                    'fixed left-1/2 top-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4',
                    'border bg-background p-6 shadow-lg duration-200',
                    'data-[state=open]:animate-in data-[state=closed]:animate-out',
                    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                    'sm:rounded-lg',
                  ),
                  style: widthStyle,
                  onPointerDownOutside: onOverlayPointerDownOutside,
                  onEscapeKeyDown,
                  closeOnEsc: opts.closeOnEsc !== false,
                  closeOnOverlayClick: opts.closeOnClickOutside !== false,
                }, {
                  default: () => [
                    // Header: Title + Description
                    h(
                      'div',
                      { class: 'flex flex-col gap-y-1.5 text-center sm:text-left' },
                      [
                        opts.title
                          ? h(
                            DialogTitle,
                            { class: 'text-lg font-semibold leading-none tracking-tight' },
                            { default: () => opts.title },
                          )
                          : null,
                        opts.description
                          ? h(
                            DialogDescription,
                            { class: 'text-sm text-muted-foreground mt-2' },
                            { default: () => opts.description },
                          )
                          : null,
                      ],
                    ),

                    // Custom component
                    opts.component
                      ? h(
                        'div',
                        { class: 'my-4' },
                        [h(opts.component as Component, opts.componentProps ?? {})],
                      )
                      : null,

                    // Footer: Action buttons
                    h(
                      'div',
                      { class: 'flex flex-row justify-end gap-2 mt-4' },
                      actionButtons.map((action, idx) => {
                        const isConfirm = idx === actionButtons.length - 1;
                        const variant = action.variant ?? (isConfirm ? 'default' : 'outline');

                        return h(
                          'button',
                          {
                            class: cn(buttonVariants({ variant })),
                            onClick: () => handleAction(action, isConfirm),
                          },
                          action.label,
                        );
                      }),
                    ),
                  ],
                }),
            }),
        },
      );
    };
  },
});

/* ============================================================ */
/* 模块级状态                                                     */
/* ============================================================ */

/** 对话框实例引用栈 —— 跟踪所有挂载的对话框 */
const dialogStack: Array<{ app: App; container: HTMLElement }> = [];

/* ============================================================ */
/* 公开 API                                                       */
/* ============================================================ */

/**
 * 命令式打开一个对话框。
 *
 * 调用后立即挂载对话框到 body，返回 Promise 与手动 close 方法。
 * Promise 在用户点击确认类按钮时 resolve(true)，点击取消/关闭/遮罩时 resolve(false)。
 *
 * @param options 对话框配置项
 * @returns DialogInstance —— promise + close 句柄
 *
 * @example
 * ```ts
 * // 阻塞式确认
 * if (await useDialog({ title: '删除', description: '确认？' })) {
 *   await deleteItem();
 * }
 *
 * // 程序化关闭
 * const dialog = useDialog({ title: '处理中...', closeOnClickOutside: false });
 * await doWork();
 * dialog.close();
 * ```
 */
export function useDialog(options: DialogOptions): DialogInstance {
  let _resolve: (value: boolean) => void;

  const promise = new Promise<boolean>((resolve) => {
    _resolve = resolve;
  });

  // 创建挂载容器
  const container = document.createElement('div');
  container.setAttribute('data-yd-dialog-host', '');
  document.body.appendChild(container);

  // 创建应用实例
  const app = createApp(DialogHost, {
    options,
    resolve: (value: boolean) => {
      _resolve(value);
    },
  });

  app.mount(container);
  dialogStack.push({ app, container });

  /** 手动关闭对话框 */
  function close(): void {
    _resolve(false);
  }

  // promise resolve 后延迟 300ms 销毁（等待关闭动画完成）
  void promise.then(() => {
    setTimeout(() => {
      const idx = dialogStack.findIndex((entry) => entry.container === container);
      if (idx >= 0) {
        dialogStack.splice(idx, 1);
        app.unmount();
        container.remove();
      }
    }, 300);
  });

  return { promise, close };
}

/**
 * 关闭所有已打开的命令式对话框。
 */
export function closeAllDialogs(): void {
  while (dialogStack.length > 0) {
    const entry = dialogStack.pop();
    if (entry) {
      entry.app.unmount();
      entry.container.remove();
    }
  }
}
