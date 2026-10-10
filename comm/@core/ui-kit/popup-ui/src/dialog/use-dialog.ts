/**
 * 对话框 JSX 风格命令式 API：useDialog。
 *
 * 对标 Naive UI 的 useDialog 用法，返回 `{ dialog, Dialog }`：
 * - `dialog`  为 DialogApi 实例，可直接调用 open / close / setData / onConfirm 等；
 * - `Dialog`  为壳组件，通过 provide 注入 api，模板中写带 header / default / footer 的 JSX。
 *
 * 确认按钮点击后自动 close() 并触发外部 onConfirm 回调；
 * 取消按钮仅触发 onCancel 回调，是否关闭由外部 onCancel 内部控制。
 *
 * @path comm\@core\ui-kit\popup-ui\src\dialog\use-dialog.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import type { Component } from 'vue';

import { defineComponent, h, provide } from 'vue';

import type { ModalApiOptions } from '../modal/modal';

import { DialogApi } from './dialog-api';

/** useDialog 返回句柄 */
export interface UseDialogResult {
  /** 命令式 API 实例，持有 open / close / setData / setState 等方法 */
  dialog: DialogApi;
  /** 壳组件，通过 provide 注入 api，模板中写 JSX 描述弹窗内容 */
  Dialog: Component;
}

/**
 * 对话框创建选项：复用 ModalApiOptions 的全部能力。
 *
 * 默认 closeOnClickModal=false、centered=true、animationType='scale'，
 * 见 DialogApi 的 DEFAULT_DIALOG_STATE。
 */
export type DialogOptions = ModalApiOptions;

/** 注入键，Dialog 壳与内部渲染组件之间传递 API */
const DIALOG_INJECT_KEY = Symbol('YDSZ_DIALOG_INJECT');

/**
 * 创建 JSX 风格的命令式对话框 API。
 *
 * @param options - 对话框初始化配置（见 ModalApiOptions）
 * @returns UseDialogResult——`dialog` 控制 API，`Dialog` 壳组件放入 JSX
 *
 * @example
 * ```tsx
 * const { dialog, Dialog } = useDialog({
 *   title: '新增用户',
 *   onConfirm: () => handleSubmit(),
 * });
 *
 * // 打开对话框
 * dialog.open();
 *
 * // JSX 渲染
 * <Dialog>
 *   <template #header>新增用户</template>
 *   <template #default>表单内容</template>
 *   <template #footer="{ confirm, cancel }">
 *     <button @click="confirm">确认</button>
 *     <button @click="cancel">取消</button>
 *   </template>
 * </Dialog>
 * ```
 */
export function useDialog(options: DialogOptions = {}): UseDialogResult {
  // 覆写 onConfirm：外部回调不自动 close — 由 Dialog 壳的 handleConfirm 控制时序
  const api = new DialogApi(options);

  /** Dialog 壳组件 */
  const Dialog = defineComponent(
    (_props: Record<string, unknown>, { slots }: { slots: Record<string, unknown> }) => {
      provide(DIALOG_INJECT_KEY, api);

      /**
       * 点击确认按钮：先调 onConfirm，再自动 close。
       * 对话框聚焦一次性确认流程，确认 = 关闭 + 回调。
       */
      const handleConfirm = async (): Promise<void> => {
        api.onConfirm();
        await api.close();
      };

      const handleCancel = (): void => {
        // 仅触发回调；是否关闭由 onCancel 内部决定（如需要关闭可手动调用 dialog.close()）
        api.onCancel();
      };

      const slotFooter = slots.footer as ((opts: Record<string, unknown>) => unknown) | undefined;
      const slotHeader = slots.header as (() => unknown) | undefined;
      const slotDefault = slots.default as (() => unknown) | undefined;

      return () =>
        h(
          'div',
          {
            'data-ydsz-dialog': '',
            style: { display: 'contents' },
          },
          [
            slotHeader
              ? h('div', { 'data-ydsz-dialog-header': '' }, [slotHeader()])
              : null,
            slotDefault
              ? h('div', { 'data-ydsz-dialog-body': '' }, [slotDefault()])
              : null,
            slotFooter
              ? h('div', { 'data-ydsz-dialog-footer': '' }, [
                  slotFooter({
                    cancel: handleCancel,
                    confirm: handleConfirm,
                  }),
                ])
              : null,
          ],
        );
    },
    {
      name: 'YdszDialogShell',
      inheritAttrs: false,
    },
  );

  return {
    Dialog,
    dialog: api,
  };
}
