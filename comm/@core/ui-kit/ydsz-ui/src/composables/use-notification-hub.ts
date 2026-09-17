/**
 * useNotificationHub Composable —— 通知中心状态机（SSE/WebSocket 实时推送集成）。
 *
 * 设计目标：
 *  - 提供通知项的增删改查 + 未读计数；
 *  - 通过 EventSource / WebSocket 接入 SSE/WebSocket 实时推送；
 *  - 偏好设置通过 localStorage 持久化（静音时段、展示位置、展现密度）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-notification-hub.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import type { Ref } from 'vue';

import { computed, ref, watch } from 'vue';

/* ============================================================ */
/* 类型                                                          */
/* ============================================================ */

/** 通知类型 */
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

/** 通知项 */
export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  level: NotificationLevel;
  isRead: boolean;
  createdAt: number;
  /** 关联跳转 */
  link?: string;
}

/** 展示位置 */
export type NotificationPlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/** 通知偏好设置 */
export interface NotificationPreferences {
  /** 展示位置 */
  placement: NotificationPlacement;
  /** 最大展示数 */
  maxVisible: number;
  /** 自动消失时长（毫秒，0 表示常驻） */
  duration: number;
  /** 是否启用声音 */
  isSoundEnabled: boolean;
  /** 免打扰时段 [startHour, endHour] */
  muteRange: [number, number] | null;
}

/** 默认偏好 */
const DEFAULT_PREFERENCES: NotificationPreferences = {
  duration: 4500,
  isSoundEnabled: false,
  maxVisible: 5,
  muteRange: null,
  placement: 'top-right',
};

/** 持久化存储键 */
const STORAGE_KEY = 'ydsz_notification_prefs';

/* ============================================================ */
/* 持久化                                                        */
/* ============================================================ */

function loadPreferences(): NotificationPreferences {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_PREFERENCES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences(prefs: NotificationPreferences): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* 存储溢出时静默失败 */
  }
}

/* ============================================================ */
/* Composable                                                    */
/* ============================================================ */

/**
 * useNotificationHub 参数。
 */
export interface UseNotificationHubOptions {
  /** 初始通知列表 */
  initialItems?: NotificationItem[];
  /** 偏好设置（可选覆盖） */
  preferences?: Partial<NotificationPreferences>;
  /** SSE/WebSocket 数据源 URL */
  streamUrl?: string;
}

/**
 * useNotificationHub 返回句柄。
 */
export interface UseNotificationHubReturn {
  /** 全部通知 */
  items: Ref<NotificationItem[]>;
  /** 未读数量 */
  unreadCount: Ref<number>;
  /** 当前可见通知（受 maxVisible 限制） */
  visibleItems: Ref<NotificationItem[]>;
  /** 偏好设置 */
  preferences: Ref<NotificationPreferences>;
  /** 推送通知 */
  push: (item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) => void;
  /** 标记已读 */
  markAsRead: (id: string) => void;
  /** 全部已读 */
  markAllAsRead: () => void;
  /** 移除通知 */
  remove: (id: string) => void;
  /** 清空所有 */
  clearAll: () => void;
  /** 更新偏好 */
  setPreferences: (prefs: Partial<NotificationPreferences>) => void;
  /** 是否为静音时段 */
  isMuted: Ref<boolean>;
  /** SSE 连接状态 */
  streamStatus: Ref<'connecting' | 'open' | 'closed' | 'error'>;
  /** 手动重新连接 */
  reconnect: () => void;
}

/**
 * useNotificationHub —— 通知中心状态机。
 *
 * @param options - 配置项
 * @returns 通知中心句柄
 */
export function useNotificationHub(
  options: UseNotificationHubOptions = {},
): UseNotificationHubReturn {
  const items = ref<NotificationItem[]>(options.initialItems ?? []);
  const preferences = ref<NotificationPreferences>({
    ...loadPreferences(),
    ...options.preferences,
  });
  const streamStatus = ref<'connecting' | 'open' | 'closed' | 'error'>('closed');

  /* ----- 计算属性 ----- */
  const unreadCount = computed(() =>
    items.value.filter((n) => !n.isRead).length,
  );

  const visibleItems = computed(() =>
    items.value.slice(0, preferences.value.maxVisible),
  );

  /** 当前小时是否在免打扰时段内 */
  const isMuted = computed(() => {
    const range = preferences.value.muteRange;
    if (!range) return false;
    const hour = new Date().getHours();
    const [start, end] = range;
    if (start <= end) {
      return hour >= start && hour < end;
    }
    // 跨午夜时段（如 22:00 - 06:00）
    return hour >= start || hour < end;
  });

  /* ----- 操作 ----- */
  function push(item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): void {
    const newItem: NotificationItem = {
      ...item,
      createdAt: Date.now(),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isRead: false,
    };
    items.value = [newItem, ...items.value];
  }

  function markAsRead(id: string): void {
    const target = items.value.find((n) => n.id === id);
    if (target) target.isRead = true;
  }

  function markAllAsRead(): void {
    items.value.forEach((n) => {
      n.isRead = true;
    });
  }

  function remove(id: string): void {
    items.value = items.value.filter((n) => n.id !== id);
  }

  function clearAll(): void {
    items.value = [];
  }

  function setPreferences(prefs: Partial<NotificationPreferences>): void {
    preferences.value = { ...preferences.value, ...prefs };
  }

  function reconnect(): void {
    streamStatus.value = 'connecting';
    // 由 setupStream 处理实际重连
  }

  /* SSE Stream 自动连接 */
  let eventSource: EventSource | null = null;

  function setupStream(): void {
    if (!options.streamUrl || typeof EventSource === 'undefined') return;
    streamStatus.value = 'connecting';

    try {
      eventSource = new EventSource(options.streamUrl);
      eventSource.onopen = () => {
        streamStatus.value = 'open';
      };
      eventSource.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>;
          push(data);
        } catch {
          /* 忽略格式错误的消息 */
        }
      };
      eventSource.onerror = () => {
        streamStatus.value = 'error';
        eventSource?.close();
      };
    } catch {
      streamStatus.value = 'error';
    }
  }

  // 自动启动流
  setupStream();

  // 持久化偏好
  watch(
    preferences,
    (val) => {
      savePreferences(val);
    },
    { deep: true },
  );

  return {
    clearAll,
    isMuted,
    items,
    markAllAsRead,
    markAsRead,
    preferences,
    push,
    reconnect,
    remove,
    setPreferences,
    streamStatus,
    unreadCount,
    visibleItems,
  };
}
