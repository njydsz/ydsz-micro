/**
 * useConfirm —— 命令式确认对话框 composable。
 *
 * 全局单例模式：同一时刻只会存在一个确认弹窗实例，
 * 新弹窗打开时自动替换上一个（避免重复弹框覆盖）。
 *
 * 基于 Radix Vue Dialog 原语，提供完整的无障碍支持（焦点捕获、ESC、aria-labelledby）。
 *
 * @example
 * ```ts
 * const { confirm } = useConfirm();
 *
 * async function handleDelete() {
 *   const ok = await confirm({
 *     header: '删除确认',
 *     message: '确认删除该记录吗？此操作不可撤销。',
 *     confirmButtonType: 'danger',
 *   });
 *   if (ok) {
 *     await deleteRecord();
 *   }
 * }
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\confirm-dialog\use-confirm.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { App } from 'vue';

import { createApp, defineComponent, h, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from '@ydsz-core/ydsz-vue';

import type { ConfirmButtonType, ConfirmOptions, ConfirmPt, UseConfirmReturn } from './types';

import { buttonVariants } from '../../primitives/button/button';
import { extendPt } from '../../pass-through';

/* ============================================================ */
/* 常量                                                           */
/* ============================================================ */

/** confirmButtonType 对应的默认 Iconify 图标 */
const TYPE_ICON_MAP: Record<ConfirmButtonType, string> = {
  danger: 'mdi:alert-circle',
  info: 'mdi:information',
  primary: 'mdi:help-circle',
  warning: 'mdi:alert',
};

/* ============================================================ */
/* 模块级状态                                                     */
/* ============================================================ */

/** 当前活跃的确认弹窗实例 */
let activeInstance: {
  app: App;
  container: HTMLElement;
  close: (result: boolean) => void;
} | null = null;

/* ============================================================ */
/* 内部组件                                                       */
/* ============================================================ */

/**
 * 确认弹窗内部实现组件。
 *
 * 通过 createApp 挂载到临时 DOM 容器中，实现命令式 API。
 */
const ConfirmDialogHost = defineComponent({
  name: 'YdConfirmDialogHost',
  props: {
    options: {
      type: Object as () => ConfirmOptions,
      required: true,
    },
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

    /** 关闭弹窗并解析 Promise */
    function closeWith(result: boolean): void {
      if (!visible.value) return;
      visible.value = false;
      props.resolve(result);
    }

    /** 点击遮罩关闭：受 closeOnOverlayClick 控制 */
    function handleOverlayPointerDownOutside(): void {
      if (props.options.closeOnOverlayClick !== false) {
        closeWith(false);
      }
    }

    /** ESC 关闭：受 closeOnEsc 控制 */
    function handleEscapeKeyDown(event: KeyboardEvent): void {
      if (props.options.closeOnEsc === false) {
        event.preventDefault();
      }
    }

    /**
     * 根据按钮类型返回对应 cva variant。
     */
    function confirmVariant(): 'default' | 'destructive' | 'outline' | 'secondary' {
      const map: Record<ConfirmButtonType, 'default' | 'destructive' | 'outline' | 'secondary'> = {
        danger: 'destructive',
        info: 'secondary',
        primary: 'default',
        warning: 'destructive',
      };
      return map[props.options.confirmButtonType ?? 'primary'];
    }

    /**
     * 根据取消按钮类型返回对应 cva variant。
     */
    function rejectVariant(): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' {
      const type = props.options.rejectButtonType ?? 'default';
      if (type === 'text') return 'ghost';
      return 'outline';
    }

    return () => {
      if (!isClient.value) return null;

      const opts = props.options;
      const confirmType: ConfirmButtonType = opts.confirmButtonType ?? 'primary';
      const iconName = opts.icon ?? TYPE_ICON_MAP[confirmType];

      // 构建 pt 透传配置
      const pt: ConfirmPt = opts.pt ?? {};
      const contentPt = extendPt(undefined, pt.content);
      const headerPt = extendPt(undefined, pt.header);
      const titlePt = extendPt(
        undefined,
        pt.title ?? { className: 'text-base font-semibold leading-snug text-text-primary' },
      );
      const descriptionPt = extendPt(
        undefined,
        pt.description ?? { className: 'mt-2 text-sm text-text-secondary' },
      );

      return h(
        DialogRoot,
        {
          open: visible.value,
          onUpdate: (open: boolean) => {
            if (!open) closeWith(false);
          },
        },
        {
          default: () =>
            h(DialogPortal, null, {
              default: () =>
                h(DialogContent, {
                  class: cn(
                    'fixed left-1/2 top-1/2 z-popup w-[calc(100vw-2rem)] max-w-md',
                    '-translate-x-1/2 -translate-y-1/2',
                    'rounded-2xl border border-border-default bg-surface-1 p-6',
                    'shadow-high outline-none',
                    'data-[state=open]:animate-in data-[state=closed]:animate-out',
                    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                    contentPt.class,
                  ),
                  style: contentPt.style || undefined,
                  onPointerDownOutside: handleOverlayPointerDownOutside,
                  onEscapeKeyDown: handleEscapeKeyDown,
                  closeOnEsc: opts.closeOnEsc !== false,
                  closeOnOverlayClick: opts.closeOnOverlayClick !== false,
                }, {
                  default: () => [
                    /* 头部行：图标 + 标题 + 描述 */
                    h(
                      'div',
                      {
                        class: cn('flex items-start gap-4', headerPt.class),
                        style: headerPt.style || undefined,
                      },
                      [
                        /* 图标 */
                        iconName
                          ? h(
                            'div',
                            {
                              class: cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-full',
                                confirmType === 'danger' ? 'bg-destructive/10' : '',
                                confirmType === 'warning' ? 'bg-amber-500/10' : '',
                                confirmType === 'info' ? 'bg-blue-500/10' : '',
                                confirmType === 'primary' ? 'bg-primary/10' : '',
                              ),
                            },
                            [
                              h(
                                'span',
                                {
                                  class: cn(
                                    'size-5',
                                    confirmType === 'danger' ? 'text-destructive' : '',
                                    confirmType === 'warning' ? 'text-amber-500' : '',
                                    confirmType === 'info' ? 'text-blue-500' : '',
                                    confirmType === 'primary' ? 'text-primary' : '',
                                  ),
                                  'aria-hidden': 'true',
                                },
                                /* 直接用 span + icon class 作为 iconify fallback */
                                iconName ? iconName.split(':').pop() ?? '' : '',
                              ),
                            ],
                          )
                          : null,

                        /* 文本区 */
                        h('div', { class: 'flex-1' }, [
                          opts.header
                            ? h(
                              DialogTitle as any,
                              {
                                class: titlePt.class,
                                style: titlePt.style || undefined,
                              },
                              { default: () => opts.header },
                            )
                            : null,
                          opts.message
                            ? h(
                              DialogDescription as any,
                              {
                                class: descriptionPt.class,
                                style: descriptionPt.style || undefined,
                              },
                              { default: () => opts.message },
                            )
                            : null,
                        ]),
                      ],
                    ),

                    /* 按钮组 */
                    h(
                      'div',
                      { class: 'mt-6 flex justify-end gap-2' },
                      [
                        h(
                          'button',
                          {
                            type: 'button',
                            class: cn(buttonVariants({ variant: rejectVariant(), size: 'sm' })),
                            onClick: () => closeWith(false),
                          },
                          opts.rejectLabel ?? '取消',
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            class: cn(buttonVariants({ variant: confirmVariant(), size: 'sm' })),
                            onClick: () => closeWith(true),
                          },
                          opts.confirmLabel ?? '确认',
                        ),
                      ],
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
/* 公开 API                                                       */
/* ============================================================ */

/**
 * useConfirm —— 命令式确认对话框 composable。
 *
 * 返回 confirm 函数和 closeAll 函数。
 * confirm 函数挂载一个全局单例确认弹窗，阻塞等待用户选择。
 *
 * @returns UseConfirmReturn
 */
export function useConfirm(): UseConfirmReturn {
  /**
   * 命令式打开确认弹窗。
   *
   * @param options 弹窗配置项
   * @returns Promise<boolean>
   */
  function confirm(options: ConfirmOptions): Promise<boolean> {
    // 销毁上一个未关闭的实例
    if (activeInstance) {
      activeInstance.close(false);
      cleanupInstance();
    }

    let _resolve: (value: boolean) => void;

    const promise = new Promise<boolean>((resolve) => {
      _resolve = resolve;
    });

    const container = document.createElement('div');
    container.setAttribute('data-yd-confirm-dialog', '');
    document.body.appendChild(container);

    const app = createApp(ConfirmDialogHost, {
      options,
      resolve: (value: boolean) => {
        _resolve(value);
      },
    });

    app.mount(container);

    const close = (result: boolean): void => {
      _resolve(result);
      activeInstance = null;
    };

    activeInstance = { app, container, close };

    // Promise 解析后延迟 200ms 清理（等动画结束）
    void promise.then(() => {
      cleanupInstance();
    });

    return promise;
  }

  /** 关闭所有已打开的确认弹窗 */
  function closeAll(): void {
    if (activeInstance) {
      activeInstance.close(false);
      cleanupInstance();
    }
  }

  return { confirm, closeAll };
}

/* ============================================================ */
/* 内部工具                                                       */
/* ============================================================ */

/**
 * 清理当前活跃实例的 DOM 与 Vue app。
 */
function cleanupInstance(): void {
  if (!activeInstance) return;
  const instance = activeInstance;
  activeInstance = null;
  const container = instance.container;
  const app = instance.app;

  // 延迟销毁以等待关闭动画
  setTimeout(() => {
    try {
      app.unmount();
    } catch {
      /* 已卸载时静默 */
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 200);
}
