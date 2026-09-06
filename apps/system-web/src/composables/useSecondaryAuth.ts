/**
 * 二次身份验证 Composable —— 提供 imperative API 驱动 SecondaryAuthModal。
 *
 * <p>基于 createApp 实现真正的程序化弹窗：每次 open() 挂载一个独立 Vue 实例至 body，
 * Promise 结算后自动卸载，无全局状态泄漏。多位调用者依次 open() 时后者覆盖前者，
 * 先到 Promise 静默 resolve(null)，避免内存泄漏。
 *
 * <p>典型用法（API 拦截器内）：
 * ```ts
 * const password = await openSecondaryAuthModal('请输入密码确认此操作');
 * if (password) { /&#42;&#42; 继续 &#42;&#47; } else { /&#42;&#42; 取消 &#42;&#47; }
 * ```
 *
 * @path apps\system-web\src\composables\useSecondaryAuth.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { Component } from 'vue';

import { createApp, h, ref } from 'vue';

import SecondaryAuthModal from '#/components/secondary-auth-modal/index.vue';

/** 二次认证弹窗运行时状态 */
const defaultState = () => ({
  error: '',
  hint: undefined as string | undefined,
  loading: false,
  visible: false,
});

// ---------------------------------------------------------------------------
// 单实例引用工厂（模块级单例：同一时刻只有一个弹窗实例在 DOM 中）
// ---------------------------------------------------------------------------

/** 当前活跃的 Promise resolve 回调 */
let currentResolve: ((password: string | null) => void) | null = null;

/** 当前挂载的 Vue app 实例引用 */
let currentApp: ReturnType<typeof createApp> | null = null;
let currentContainer: HTMLDivElement | null = null;

/**
 * 程序化打开二次认证弹窗。
 *
 * @param hintText - 顶部警告文案（可选），由后端 authHint 透传
 * @returns Promise<string | null> —— resolve 为用户输入的密码，cancel 返回 null
 */
export function openSecondaryAuthModal(hintText?: string): Promise<string | null> {
  // 先静默 resolve 前一个未结算的 Promise，防止内存泄漏
  if (currentResolve) {
    cleanup();
  }

  return new Promise<string | null>((resolve) => {
    currentResolve = resolve;

    // 动态挂载弹窗 DOM 容器
    const container = document.createElement('div');
    container.id = 'secondary-auth-modal-host';
    document.body.appendChild(container);
    currentContainer = container;

    const state = defaultState();
    state.hint = hintText;
    state.visible = true;

    const app = createApp({
      setup() {
        const visible = ref(state.visible);
        const hint = ref(state.hint);
        const error = ref(state.error);
        const loading = ref(state.loading);

        function handleConfirm(password: string) {
          loading.value = true;
          error.value = '';
          state.loading = true;
          const r = currentResolve;
          currentResolve = null;
          cleanup();
          r?.(password);
        }

        function handleCancel() {
          const r = currentResolve;
          currentResolve = null;
          cleanup();
          r?.(null);
        }

        return () =>
          h(
            SecondaryAuthModal,
            {
              visible: visible.value,
              hint: hint.value,
              error: error.value,
              loading: loading.value,
              'onUpdate:visible': (val: boolean) => {
                visible.value = val;
              },
              onConfirm: handleConfirm,
              onCancel: handleCancel,
            },
            {},
          );
      },
    });

    currentApp = app;
    app.mount(container);
  });
}

/**
 * Composable 函数 —— 在 setup 上下文使用，暴露 ensureSecondaryAuth 便捷方法。
 *
 * @example
 * const { ensureSecondaryAuth } = useSecondaryAuth();
 * const ok = await ensureSecondaryAuth('请输入密码', async (pwd) => {
 *   await secondaryAuthApi({ password: pwd, scene: 'config-edit' });
 *   return true;
 * });
 *
 * @returns composable 接口
 */
export function useSecondaryAuth() {
  /**
   * 确保二次认证通过然后执行回调。
   *
   * @param hintText - 弹窗提示文案（可选）
   * @param onConfirmed - 用户输入密码后的回调（如调 API），返回 true 表示通过
   * @returns 用户是否完整走完认证流程且回调返回 true
   */
  async function ensureSecondaryAuth(
    hintText?: string,
    onConfirmed?: (password: string) => Promise<boolean>,
  ): Promise<boolean> {
    const password = await openSecondaryAuthModal(hintText);
    if (!password) return false;
    if (onConfirmed) {
      return onConfirmed(password);
    }
    return true;
  }

  return {
    ensureSecondaryAuth,
    openSecondaryAuthModal,
  };
}

/** 清理动态挂载的 DOM 与 Vue 实例 */
function cleanup(): void {
  if (currentApp) {
    currentApp.unmount();
    currentApp = null;
  }
  if (currentContainer) {
    currentContainer.remove();
    currentContainer = null;
  }
}
