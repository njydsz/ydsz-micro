/**
 * hmr-guard — Vue 3.5.x HMR 注册表中实例卸载时的竞态保护插件
 *
 * Vue 3.5.40 的 runtime-core 在 unmountComponent 时会调用 unregisterHMR，
 * 从模块作用域的 HMR map 中清除当前组件实例。在微前端场景下，主子应用
 * 通过 importmap 共享同一个 Vue 运行时，共用同一个 HMR map：
 *
 *   1. 子应用 A 组件模块 HMR 更新 → 该模块 record 从 map 中移除
 *   2. 主子应用（或另一子应用 B）仍有旧组件实例正在卸载
 *   3. unmountComponent → unregisterHMR → map.get(hmrId) 返回 undefined
 *   4. undefined.instances → TypeError
 *
 * 此错误仅出现在开发环境，不影响生产构建，不破坏功能。此插件通过注入
 * 客户端脚本，在错误冒泡前精准拦截并抑制该特定 TypeError。
 *
 * @path conf\vite-config\src\plugins\hmr-guard.ts
 * @author ydsz-team
 * @since 4.4.2
 */
import type { Plugin } from 'vite';

/** 检测是否为目标 HMR 竞态错误 */
const HMR_ERROR_MARKER = 'instances';
const HMR_STACK_MARKERS = ['unregisterHMR', 'unmountComponent'];

/**
 * 创建 HMR 保护插件。
 *
 * 仅在开发环境注入客户端脚本（process.env.NODE_ENV === 'development' 且非 SSR）。
 * 脚本思路：
 *   1. 劫持 window.addEventListener('error')，捕获阶段拦截匹配的 TypeError
 *   2. 同时监听 'unhandledrejection'（unregisterHMR 在 async 上下文中抛出时）
 *
 * @returns Vite 插件
 */
export function hmrGuardPlugin(): Plugin {
  return {
    name: 'ydsz:hmr-guard',
    /**
     * 仅开发环境启用。通过 apply 函数避免构建产物包含无用语义。
     */
    apply: 'serve',

    /**
     * transformIndexHtml 钩子：在 <head> 最前面注入内联脚本。
     * 必须在任何模块脚本（含 Vue 运行时）之前生效。
     */
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const script = `
<script>
(function() {
  // 三重守卫确保仅针对该特定错误，避免误伤
  function isHMRInstancesError(message, stack) {
    if (!message || message.indexOf('${HMR_ERROR_MARKER}') === -1) return false;
    if (!stack) return false;
    return ${JSON.stringify(HMR_STACK_MARKERS)}.every(function(m) { return stack.indexOf(m) !== -1; });
  }

  // 捕获 window.onerror
  window.addEventListener('error', function(event) {
    if (isHMRInstancesError(event.message || '', event.error && event.error.stack || '')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true); // capture = true，最早拦截

  // 捕获未处理的 Promise rejection（async setup 中组件抛出时）
  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    if (reason && reason.message && isHMRInstancesError(reason.message, reason.stack || '')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
</script>`;

        // 注入到 <head> 最前面，确保在模块加载前生效
        return html.replace('<head>', `<head>${script}`);
      },
    },
  };
}
