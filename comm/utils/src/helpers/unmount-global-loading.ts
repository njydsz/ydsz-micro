/**
 * 全局 Loading 移除与销毁，通过 CSS 过渡动画平滑隐藏后清理 DOM 节点。
 *
 * 放在工具函数中而非 index.html 的 app 标签内，是因为直接移除会造成渲染闪烁；
 * 通过先添加 `hidden` 类触发过渡动画，待 `transitionend` 后再移除节点，体验更平滑。
 *
 * @path comm\utils\src\helpers\unmount-global-loading.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 移除页面初始化时的全局 loading 遮罩与所有注入的 loading 子元素。
 *
 * @remarks
 * 流程：查找 `#__app-loading__` → 添加 `.hidden` 类触发 CSS 过渡 →
 * `transitionend` 后移除 loading 节点及 `[data-app-loading^="inject"]` 元素。
 */
export function unmountGlobalLoading(): void {
  // 查找全局 loading 元素
  const loadingElement = document.querySelector('#__app-loading__');

  if (loadingElement) {
    // 添加隐藏类，触发过渡动画
    loadingElement.classList.add('hidden');

    // 查找所有需要移除的注入 loading 元素
    const injectLoadingElements = document.querySelectorAll(
      '[data-app-loading^="inject"]',
    );

    // 当过渡动画结束时，移除 loading 元素和所有注入的 loading 元素
    loadingElement.addEventListener(
      'transitionend',
      () => {
        loadingElement.remove(); // 移除 loading 元素
        injectLoadingElements.forEach((el) => el.remove()); // 移除所有注入的 loading 元素
      },
      { once: true },
    ); // 确保事件只触发一次
  }
}
