/**
 * use-dict-event — 字典变更事件总线
 *
 * <p>提供跨组件的字典变更通知能力：
 * <ul>
 *   <li>字典管理页面 CRUD 成功后调用 {@link emitDictChange} 广播变更</li>
 *   <li>DictSelect / DictTag 等消费型组件监听变更并自动重新加载</li>
 * </ul>
 *
 * <p>采用模块级 {@link EventTarget} 实现零依赖事件总线，所有监听器随组件 unmount 自动清理。
 *
 * @path comm\effects\shared-business\src\composables\use-dict-event.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 事件类型常量 */
const DICT_CHANGE_EVENT = 'ydsz:dict-change';

/** 事件 detail 类型 */
export interface DictChangeEventDetail {
  /** 变更的字典类型编码（仅字典项变更时携带） */
  typeCode?: string;
  /** 变更时间戳 */
  timestamp: number;
}

/** 模块级事件目标 */
const dictEventTarget = new EventTarget();

/**
 * 广播字典变更事件（CRUD 成功后调用）。
 *
 * @param typeCode - 变更的字典类型编码（可选）
 */
export function emitDictChange(typeCode?: string): void {
  const detail: DictChangeEventDetail = {
    typeCode,
    timestamp: Date.now(),
  };
  const event = new CustomEvent(DICT_CHANGE_EVENT, { detail });
  dictEventTarget.dispatchEvent(event);
}

/**
 * 订阅字典变更事件。
 *
 * @param callback - 回调函数，接收事件 detail
 * @returns 取消订阅函数
 */
export function onDictChange(
  callback: (detail: DictChangeEventDetail) => void,
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<DictChangeEventDetail>;
    callback(customEvent.detail);
  };
  dictEventTarget.addEventListener(DICT_CHANGE_EVENT, handler);
  return () => {
    dictEventTarget.removeEventListener(DICT_CHANGE_EVENT, handler);
  };
}
