/**
 * 输入确认框的组合式 API：usePrompt。
 *
 * 对标 PrimeVue + Ant Design 的/usePrompt 用法，在 setup 上下文中提供带输入控件的
 * 命令式弹窗控制器。内部委托已有的 YdPrompt 函数。
 *
 * 典型场景：填写驳回原因、重命名、备注追加等。
 *
 * @path comm\@core\ui-kit\popup-ui\src\use-prompt.ts
 * @author ydsz-team
 * @since 26.10.11
 */

import { ref } from 'vue';

import type { YdPromptProps } from './alert/alert';

import { YdPrompt } from './alert/AlertBuilder';

/** 简化版的输入确认框选项：仅暴露最常用的配置项 */
export interface PromptOptions<T = unknown> {
  /** 弹窗标题 */
  title?: string;
  /** 提示正文 */
  content: string;
  /** 默认值 */
  defaultValue?: T;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 关闭前的拦截回调；可拿到用户输入的 value */
  beforeClose?: (scope: { isConfirm: boolean; value: T | undefined }) => boolean | Promise<boolean | undefined> | undefined;
}

/** usePrompt 返回的控制器句柄 */
export interface UsePromptReturn {
  /** 是否有一个输入确认框正处于打开且等待用户决策的状态 */
  isPrompting: Readonly<import('vue').Ref<boolean>>;
  /**
   * 弹出输入确认框并等待用户决策。
   *
   * @returns Promise<T | null>：用户确认且有输入时 resolve(输入值)，
   *          取消/关闭时 resolve(null)。
   */
  prompt<T = string>(options: PromptOptions<T>): Promise<T | null>;
  /**
   * 便捷入口：弹出文本输入框（常用于重命名、填写原因等）
   *
   * @param options - 配置项；content 为输入提示文案
   */
  promptText(options: Omit<PromptOptions<string>, 'defaultValue'> & { defaultValue?: string }): Promise<string | null>;
}

/**
 * 创建组件作用域的输入确认框控制器。
 *
 * @returns UsePromptReturn 控制器
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const prompt = usePrompt();
 *
 * async function handleRename() {
 *   const newName = await prompt.promptText({
 *     content: '请输入新名称',
 *     defaultValue: oldName,
 *   });
 *   if (!newName) return;
 *   await api.rename(newName);
 * }
 * </script>
 * ```
 */
export function usePrompt(): UsePromptReturn {
  const isPrompting = ref(false);

  async function promptFn<T = string>(options: PromptOptions<T>): Promise<T | null> {
    if (isPrompting.value) {
      return null;
    }
    isPrompting.value = true;
    try {
      const value = await YdPrompt<T>({
        content: options.content,
        defaultValue: options.defaultValue,
        title: options.title,
        beforeClose: options.beforeClose,
      });
      return value ?? null;
    } catch {
      return null;
    } finally {
      isPrompting.value = false;
    }
  }

  async function promptText(options: Omit<PromptOptions<string>, 'defaultValue'> & { defaultValue?: string }): Promise<string | null> {
    const value = await promptFn<string>(options);
    return value;
  }

  return {
    isPrompting: isPrompting as Readonly<import('vue').Ref<boolean>>,
    prompt: promptFn,
    promptText,
  };
}

export { usePrompt as default };
