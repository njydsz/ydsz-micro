/**
 * 轻量消息提示（toast）的命令式 API：类型契约 + 模块级实例注册表 + 弹出/关闭函数。
 *
 * 与 YdAlert/YdConfirm 的区别：toast 是非阻塞、可自动消失的临时反馈，
 * 不等待用户决策，故不返回 Promise；多条 toast 由唯一宿主席组件（YdMessageHost）
 * 按类型优先级堆叠在页面顶部渲染。
 *
 * 宿主席以惰性单例的方式挂到 document.body 上、脱离组件树，因此 toast 内容里的
 * 自定义组件若依赖祖先 inject 将取不到上下文——这与 AlertBuilder 的约束一致。
 *
 * @path comm\@core\ui-kit\popup-ui\src\message\message.ts
 * @author ydsz-team
 * @since 5.3.0
 */
import type { Component } from 'vue';

import { computed, h, ref, render } from 'vue';

import YdMessageHost from './YdMessageHost.vue';

/** 消息类型：决定默认图标与语义配色 */
export type MessageType = 'error' | 'info' | 'loading' | 'success' | 'warning';

/** 单条消息的配置项 */
export interface MessageOptions {
  /** 消息正文；可为字符串或任意 Vue 组件 */
  content: Component | string;
  /**
   * 消息类型，决定默认图标与配色
   * @default 'info'
   */
  type?: MessageType;
  /**
   * 自动关闭延迟（毫秒）；`0` 表示常驻不自动关闭
   * @default 3000
   */
  duration?: number;
  /** 是否显示右上角关闭按钮 */
  closable?: boolean;
  /** 是否显示类型图标 */
  showIcon?: boolean;
  /** 消息关闭后的回调（含主动点击关闭与超时自动关闭） */
  onClose?: () => void;
}

/** 轨道中的实际消息实例：在 {@link MessageOptions} 之上补充运行时字段 */
export interface MessageItem extends MessageOptions {
  /** 唯一标识，用于关闭与去重 */
  id: string;
  /** 是否进入关闭动画；动画结束后从列表移除 */
  leaving: boolean;
}

/** 默认自动关闭时长（毫秒） */
const DEFAULT_DURATION = 3000;

/** 消息按类型的置顶优先级：loading 常驻消息始终排最前 */
const TYPE_ORDER: Record<MessageType, number> = {
  loading: 0,
  error: 1,
  success: 2,
  warning: 3,
  info: 4,
};

let seed = 0;

/** 模块级消息实例注册表：宿主席组件订阅它完成渲染 */
export const messageList = ref<MessageItem[]>([]);

/** id → 自动关闭计时器句柄，用于去重复用时重置计时 */
const autoCloseTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * 按类型优先级与弹出先后排序后的消息列表。
 *
 * 抽成 computed 而非在宿主席内排序，方便单测直接断言顺序。
 */
export const sortedMessages = computed(() => {
  return [...messageList.value].sort((a, b) => {
    const rankDiff = TYPE_ORDER[a.type ?? 'info'] - TYPE_ORDER[b.type ?? 'info'];
    return rankDiff !== 0 ? rankDiff : 0;
  });
});

/** 是否已完成宿主席挂载，避免重复挂载产生多余容器 */
let hostMounted = false;

/** 宿主席的挂载容器引用，供需要时卸载 */
let hostContainer: HTMLDivElement | null = null;

/**
 * 惰性挂载宿主席组件到 body。
 *
 * @remarks
 * 与 AlertBuilder 逐条挂载 vnode 不同，这里选择单例宿主席：toast 数量不定且生命周期
 * 短暂，由一个容器统一持有 reactive 列表，用 TransitionGroup 管理进出场，DOM 开销最小。
 * 首次调用 ydszMessage 才挂载，未使用的应用不产生额外 DOM。
 */
function mountHost() {
  if (hostMounted) {
    return;
  }
  hostContainer = document.createElement('div');
  hostContainer.setAttribute('aria-live', 'polite');
  document.body.append(hostContainer);
  render(
    h(YdMessageHost, {
      messages: messageList,
      onCloseMessage: (id: string) => closeMessage(id),
    }),
    hostContainer,
  );
  hostMounted = true;
}

/**
 * 安排（或重新安排）消息的自动关闭计时。
 *
 * @remarks
 * 去重复用时同样走本函数：先清理旧计时再按本次 duration 重新计时，
 * 从而复用的消息能以「最近一次触发」为起点倒计时，而非沿用首次的旧计时。
 *
 * @param id 消息唯一标识
 * @param duration 自动关闭延迟；`0` 表示常驻，取消已有计时
 */
function scheduleAutoClose(id: string, duration: number) {
  const prev = autoCloseTimers.get(id);
  if (prev) {
    clearTimeout(prev);
  }
  if (duration > 0) {
    autoCloseTimers.set(
      id,
      window.setTimeout(() => closeMessage(id), duration),
    );
  } else {
    autoCloseTimers.delete(id);
  }
}

/**
 * 卸载宿主席并清空所有消息（多用于测试重置）。
 */
export function unmountHost() {
  if (!hostMounted || !hostContainer) {
    return;
  }
  messageList.value = [];
  autoCloseTimers.forEach((timer) => clearTimeout(timer));
  autoCloseTimers.clear();
  render(null, hostContainer);
  hostContainer.remove();
  hostContainer = null;
  hostMounted = false;
}

/**
 * 关闭指定 id 的消息，可附带一个仅在「非 onClose」时的兜底回调。
 *
 * @param id 消息唯一标识
 * @param onClose 可选回调；若消息配置里已提供 onClose，则以配置的回调为准
 */
export function closeMessage(id: string, onClose?: () => void) {
  const target = messageList.value.find((item) => item.id === id);
  if (!target) {
    return;
  }
  target.leaving = true;
  window.setTimeout(() => {
    messageList.value = messageList.value.filter((item) => item.id !== id);
    autoCloseTimers.delete(id);
    (target.onClose ?? onClose)?.();
  }, 160);
}

/**
 * 关闭全部消息与宿主席。
 *
 * @remarks
 * 主要供路由切换、用户登出等「场景整体失效」时机调用，避免屏上残留旧 toast。
 */
export function closeAllMessages() {
  messageList.value = [];
}

/**
 * 以「一段文案」的形式弹出消息。
 *
 * @param content - 消息正文
 * @param options - 可选的配置覆盖项（类型、时长、是否可关闭等）
 * @returns 该消息的唯一标识，可传给 {@link closeMessage} 主动关闭
 */
export function ydszMessage(
  content: Component | string,
  options?: Omit<MessageOptions, 'content'>,
): string;
/**
 * 以「完整配置对象」的形式弹出消息。
 *
 * @param options - 消息配置，`content` 必填
 * @returns 该消息的唯一标识
 */
export function ydszMessage(options: MessageOptions): string;

/**
 * 弹出消息提示的实现入口，支持对象与字符串两种入参形态。
 *
 * @remarks
 * 同一时刻已存在相同正文且类型相同的消息时，直接复用其 id 并重置计时，避免高频点击
 * 弹出叠成一摞；需要每次都新弹时可显式传 `duration: 0` 并结合 `closable`。
 *
 * @param arg0 - 完整配置对象，或消息正文
 * @param arg1 - 配置覆盖项，供字符串入参形态使用
 * @returns 消息唯一标识
 *
 * @example
 * ```ts
 * ydszMessage('已保存', { type: 'success' });
 * ```
 */
export function ydszMessage(
  arg0: MessageOptions | Component | string,
  arg1?: Omit<MessageOptions, 'content'>,
): string {
  const options: MessageOptions =
    typeof arg0 === 'object' && 'content' in arg0
      ? arg0
      : { content: arg0 as Component | string, ...arg1 };

  const type = options.type ?? 'info';
  const contentKey = typeof options.content === 'string' ? options.content : '';

  // 同内容同类型去重：复用已有实例，并把自动关闭计时重置到「最近一次触发」
  const existing =
    contentKey &&
    messageList.value.find(
      (item) => item.content === contentKey && (item.type ?? 'info') === type && !item.leaving,
    );
  if (existing) {
    const duration = options.duration ?? existing.duration ?? DEFAULT_DURATION;
    scheduleAutoClose(existing.id, duration);
    return existing.id;
  }

  const item: MessageItem = {
    id: `ydsz-msg-${++seed}`,
    leaving: false,
    ...options,
    type,
    duration: options.duration ?? DEFAULT_DURATION,
  };

  mountHost();
  messageList.value.push(item);
  scheduleAutoClose(item.id, item.duration);

  return item.id;
}

/**
 * 便捷入口：以指定类型弹出消息。
 *
 * 作为 {@link ydszMessage} 的语义化快捷包装，按 type 决定图标与配色。
 *
 * @param content - 消息正文
 * @param options - 可选的配置覆盖项；`type` 会被忽略，由本方法固定
 * @returns 消息唯一标识
 */
function preset(
  type: MessageType,
  content: Component | string,
  options?: Omit<MessageOptions, 'content' | 'type'>,
) {
  return ydszMessage({ ...options, content, type });
}

/**
 * 便捷入口：弹出成功消息。
 */
export function messageSuccess(
  content: Component | string,
  options?: Omit<MessageOptions, 'content' | 'type'>,
) {
  return preset('success', content, options);
}
/**
 * 便捷入口：弹出普通信息消息。
 */
export function messageInfo(
  content: Component | string,
  options?: Omit<MessageOptions, 'content' | 'type'>,
) {
  return preset('info', content, options);
}
/**
 * 便捷入口：弹出警告消息。
 */
export function messageWarning(
  content: Component | string,
  options?: Omit<MessageOptions, 'content' | 'type'>,
) {
  return preset('warning', content, options);
}
/**
 * 便捷入口：弹出错误消息。
 */
export function messageError(
  content: Component | string,
  options?: Omit<MessageOptions, 'content' | 'type'>,
) {
  return preset('error', content, options);
}
/**
 * 便捷入口：弹出 loading 常驻消息，需 `duration: 0` 保持显示并手动关闭。
 */
export function messageLoading(
  content: Component | string,
  options?: Omit<MessageOptions, 'content' | 'type' | 'duration'>,
) {
  return preset('loading', content, { ...options, duration: 0 });
}
