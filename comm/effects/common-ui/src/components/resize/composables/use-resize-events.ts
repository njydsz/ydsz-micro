/**
 * use-resize-events 事件处理辅助函数
 *
 * @path comm\effects\common-ui\src\components\resize\composables\use-resize-events.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 添加事件监听器
 * @param events - 事件名称到回调函数的映射
 */
export function addEvents(events: Map<string, (...args: unknown[]) => void>) {
  events.forEach((cb, eventName) => {
    document.documentElement.addEventListener(eventName, cb);
  });
}

/**
 * 移除事件监听器
 * @param events - 事件名称到回调函数的映射
 */
export function removeEvents(events: Map<string, (...args: unknown[]) => void>) {
  events.forEach((cb, eventName) => {
    document.documentElement.removeEventListener(eventName, cb);
  });
}
