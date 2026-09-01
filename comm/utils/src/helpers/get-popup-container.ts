/**
 * 获取弹出层挂载容器（_popup_  positioning 上下文）
 *
 * 返回优先级：
 *   1. 若节点位于 form 内部 → 返回 form 元素（使弹出层受 form 定位上下文约束，避免 fixed/absolute 错位）
 *   2. 否则 → 返回给定节点的 parentNode
 *   3. 节点为空 → 兜底 document.body
 *
 * 用于 Select/DatePicker/Tooltip 等组件的 `getPopupContainer` 属性，
 * 确保弹出层在表单嵌套或滚动容器内正确定位。
 *
 * @param node - 触发弹出层的参考节点
 * @returns 承托弹出层的 DOM 容器
 *
 * @example
 * ```vue
 * <ElSelect :get-popup-container="getPopupContainer" />
 * ```
 *
 * @path comm/utils/src/helpers/get-popup-container.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export function getPopupContainer(node?: HTMLElement): HTMLElement {
  return (
    node?.closest('form') ?? (node?.parentNode as HTMLElement) ?? document.body
  );
}
