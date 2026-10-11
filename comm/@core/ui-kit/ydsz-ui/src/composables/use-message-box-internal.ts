/**
 * 命令式消息确认框 —— 内部实现（懒加载模块）。
 *
 * 单独拆出文件以实现 tree-shaking：如业务侧不使用命令式 API，
 * 此模块的代码不会被打包进入最终产物。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-message-box-internal.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { createApp, defineComponent, h, ref } from 'vue';

import type { App } from 'vue';

import type { MessageBoxConfirmOptions, MessageBoxResponseData } from './use-message-box';

/** 模态框引用栈 */
let modalStack: Array<{ app: App; container: HTMLElement }> = [];

/**
 * 关闭所有消息框。
 */
export function closeAllMessageBox(): void {
  while (modalStack.length > 0) {
    const entry = modalStack.pop();
    if (entry) {
      entry.app.unmount();
      entry.container.remove();
    }
  }
}

/**
 * 模态框内部组件。
 */
const MessageBoxComponent = defineComponent({
  name: 'YdMessageBoxInternal',
  props: {
    options: { type: Object as () => MessageBoxConfirmOptions, required: true },
    resolve: {
      type: Function as unknown as () => (data: MessageBoxResponseData) => void,
      required: true,
    },
  },
  setup(props) {
    const visible = ref<boolean>(true);
    const inputValue = ref<string>('');

    function handleAction(action: 'confirm' | 'cancel' | 'close'): void {
      if (!visible.value) return;

      const data: MessageBoxResponseData = {
        action,
        value: inputValue.value || undefined,
      };
      visible.value = false;
      props.resolve(data);

      setTimeout(() => {
        const idx = modalStack.findIndex((entry) => entry.container === container);
        if (idx >= 0) {
          modalStack.splice(idx, 1);
          app.unmount();
          container.remove();
        }
      }, 300);
    }

    const container = document.createElement('div');
    container.setAttribute('data-yd-message-box', '');
    document.body.appendChild(container);

    const app = createApp({
      render: () => visible.value
        ? h('div', {
          class: ['yd-message-box-overlay', props.options.customClass],
          onClick: props.options.closeOnClickModal ? () => handleAction('close') : undefined,
        }, [
          h('div', {
            class: 'yd-message-box',
            onClick: (e: MouseEvent) => e.stopPropagation(),
          }, [
            // 标题
            props.options.title
              ? h('h3', { class: 'yd-message-box-title' }, props.options.title)
              : null,
            // 内容
            props.options.content
              ? h('p', { class: 'yd-message-box-content' }, props.options.content)
              : null,
            // 按钮组
            h('div', { class: 'yd-message-box-actions' }, [
              props.options.showCancelButton !== false
                ? h('button', {
                  class: 'yd-message-box-btn yd-message-box-btn-cancel',
                  onClick: () => handleAction('cancel'),
                }, props.options.cancelButtonText || '取消')
                : null,
              h('button', {
                class: 'yd-message-box-btn yd-message-box-btn-confirm',
                onClick: () => handleAction('confirm'),
              }, props.options.confirmButtonText || '确定'),
            ]),
          ]),
        ])
        : null,
    });

    app.mount(container);
    modalStack.push({ app, container });

    return {};
  },
});

/**
 * 创建并挂载模态框到 body。
 */
export function mountMessageBox(
  options: MessageBoxConfirmOptions,
): Promise<MessageBoxResponseData> {
  return new Promise<MessageBoxResponseData>((resolve) => {
    // 推迟创建组件以利用 Vue 异步渲染
    const container = document.createElement('div');
    container.setAttribute('data-yd-message-box', '');
    document.body.appendChild(container);

    const app = createApp({
      render: () => h(MessageBoxComponent, {
        options,
        resolve,
      }),
    });

    app.mount(container);
    modalStack.push({ app, container });
  });
}
