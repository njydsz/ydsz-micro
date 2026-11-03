<!--
 * GlobalNotification — 全局通知中心铃铛组件
 *
 * <p>顶部栏铃铛入口：展示未读数量角标 + 下拉面板（最近 20 条通知）。
 * 功能：
 * <ul>
 *   <li>未读数量角标（YdBadge 简化红点）</li>
 *   <li>下拉面板展示最近 20 条通知</li>
 *   <li>通知按类型着色（info/warn/success/error）</li>
 *   <li>支持「全部标记已读」按钮</li>
 *   <li>底部「查看全部」链接跳转通知中心</li>
 *   <li>空状态使用 YdEmptyState</li>
 * </ul>
 *
 * @path main\src\components\global-notification.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import {
  YdButton,
  YdEmptyState,
  YdIcon,
  YdPopover,
  YdPopoverContent,
  YdPopoverTrigger,
  YdScrollArea,
} from '@ydsz-core/ydsz-ui';

import { useNotificationStore } from '#/store/notification';

const notificationStore = useNotificationStore();

/** 下拉面板是否打开 */
const open = ref(false);

/** 通知类型颜色映射 */
const typeColorMap: Record<string, string> = {
  INFO: 'text-info',
  SUCCESS: 'text-success',
  WARN: 'text-warning',
  WARNING: 'text-warning',
  ERROR: 'text-destructive',
  FATAL: 'text-destructive',
};

/** 通知类型图标映射 */
const typeIconMap: Record<string, string> = {
  INFO: 'lucide:info',
  SUCCESS: 'lucide:circle-check',
  WARN: 'lucide:alert-triangle',
  WARNING: 'lucide:alert-triangle',
  ERROR: 'lucide:alert-circle',
  FATAL: 'lucide:shield-alert',
};

/** 最近 20 条通知 */
const displayNotifications = computed(() =>
  notificationStore.notifications.slice(0, 20),
);

/** 未读数（99+ 上限） */
const badgeCount = computed(() => {
  const count = notificationStore.unreadCount;
  return count > 99 ? '99+' : count > 0 ? String(count) : '';
});

/**
 * 获取通知类型对应的 Tailwind 文本色类名。
 *
 * * @param type - 通知级别字符串
 */
function getTypeColor(type: string): string {
  return typeColorMap[type.toUpperCase()] || 'text-foreground';
}

/**
 * 获取通知类型对应的 Iconify 图标 ID。
 *
 * @param type - 通知级别字符串
 */
function getTypeIcon(type: string): string {
  return typeIconMap[type.toUpperCase()] || 'lucide:bell';
}

/**
 * 格式化时间为相对展示（几分钟前 / 几小时前 / 几天前 / 日期）。
 *
 * @param dateStr - ISO 时间字符串
 */
function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (minutes < 1) return $t('common.justNow');
    if (minutes < 60) return $t('common.minutesAgo', { n: minutes });
    if (hours < 24) return $t('common.hoursAgo', { n: hours });
    if (days < 7) return $t('common.daysAgo', { n: days });
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

/**
 * 点击通知项：标记已读并触发跳转。
 *
 * @param item - 通知条目
 */
function handleClickNotification(item: { id: string; isRead: boolean; link?: string }): void {
  if (!item.isRead) {
    notificationStore.markAsRead(item.id);
  }
  if (item.link) {
    window.dispatchEvent(
      new CustomEvent('micro-kernel:navigate', { detail: { path: item.link } }),
    );
  }
}

/** 全部标记已读 */
async function handleMarkAllRead(): Promise<void> {
  await notificationStore.markAllAsRead();
}

/** 查看全部通知 */
function handleViewAll(): void {
  open.value = false;
  window.dispatchEvent(
    new CustomEvent('micro-kernel:navigate', { detail: { path: '/system/notification' } }),
  );
}

onMounted(() => {
  notificationStore.fetchNotifications(1, 20);
  notificationStore.refreshUnreadCount();
});
</script>

<template>
  <div class="global-notification flex items-center">
    <YdPopover v-model:open="open">
      <YdPopoverTrigger as-child>
        <button
          type="button"
          class="gn-trigger"
          :aria-label="$t('common.notifications')"
        >
          <!-- 未读角标 -->
          <span
            v-if="badgeCount"
            class="gn-badge"
            aria-hidden="true"
          >
            {{ badgeCount }}
          </span>
          <YdIcon icon="lucide:bell" width="18" height="18" class="gn-icon" />
        </button>
      </YdPopoverTrigger>

      <YdPopoverContent
        align="end"
        side="bottom"
        :side-offset="8"
        class="gn-popover"
      >
        <!-- 头部 -->
        <div class="gn-header">
          <span class="gn-title">{{ $t('common.notifications') }}</span>
          <YdButton
            :disabled="notificationStore.unreadCount <= 0"
            size="sm"
            variant="ghost"
            class="gn-mark-all"
            @click="handleMarkAllRead"
          >
            {{ $t('common.markAllAsRead') }}
          </YdButton>
        </div>

        <!-- 通知列表 -->
        <YdScrollArea class="gn-scroll">
          <div
            v-if="displayNotifications.length > 0"
            class="gn-list"
          >
            <div
              v-for="item in displayNotifications"
              :key="item.id"
              class="gn-item"
              :class="{ 'is-unread': !item.isRead }"
              @click="handleClickNotification(item)"
            >
              <!-- 类型图标 -->
              <YdIcon
                :icon="getTypeIcon(item.type)"
                width="16"
                height="16"
                class="gn-item-icon"
                :class="getTypeColor(item.type)"
                aria-hidden="true"
              />
              <!-- 内容 -->
              <div class="gn-item-body">
                <div class="gn-item-title-row">
                  <span class="gn-item-title">{{ item.title }}</span>
                  <span
                    v-if="!item.isRead"
                    class="gn-unread-dot"
                    :aria-label="$t('common.unread')"
                  />
                </div>
                <p class="gn-item-message">{{ item.message }}</p>
                <span class="gn-item-time">{{ formatTime(item.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <YdEmptyState
            v-else
            preset="no-data"
            class="gn-empty"
          />
        </YdScrollArea>

        <!-- 底部 -->
        <div class="gn-footer">
          <YdButton
            size="sm"
            variant="outline"
            @click="handleViewAll"
          >
            {{ $t('common.viewAll') }}
          </YdButton>
        </div>
      </YdPopoverContent>
    </YdPopover>
  </div>
</template>

<style scoped>
.global-notification {
  height: 100%;
}

.gn-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.gn-trigger:hover {
  background-color: hsl(var(--neutral-100, #f0f0f0));
}

.gn-icon {
  color: hsl(var(--txt-secondary, #606266));
}

.gn-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  z-index: 1;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  color: #fff;
  text-align: center;
  pointer-events: none;
  background-color: hsl(var(--destructive-500, #ef4444));
  border-radius: 9px;
}

.gn-popover {
  width: 360px;
  padding: 0 !important;
  overflow: hidden;
  background-color: hsl(var(--bg-surface-2, #fff));
  border: 1px solid hsl(var(--border-subtle, #e5e7eb));
  border-radius: 8px;
  box-shadow: 0 6px 16px rgb(0 0 0 / 12%);
}

.gn-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 1px solid hsl(var(--border-subtle, #e5e7eb));
}

.gn-title {
  font-size: 15px;
  font-weight: 600;
}

.gn-mark-all {
  height: auto;
  padding: 4px 8px;
  font-size: 12px;
}

.gn-scroll {
  max-height: 360px;
}

.gn-list {
  padding: 4px 0;
}

.gn-item {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.gn-item:hover {
  background-color: hsl(var(--neutral-50, #f5f5f5));
}

.gn-item.is-unread {
  background-color: hsl(var(--brand-50, #eff6ff));
}

.gn-item.is-unread:hover {
  background-color: hsl(var(--brand-100, #dbeafe));
}

.gn-item-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.gn-item-body {
  flex: 1;
  min-width: 0;
}

.gn-item-title-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.gn-item-title {
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gn-unread-dot {
  display: inline-block;
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  background-color: hsl(var(--destructive-500, #ef4444));
  border-radius: 50%;
}

.gn-item-message {
  display: -webkit-box;
  margin: 2px 0;
  overflow: hidden;
  font-size: 12px;
  color: hsl(var(--txt-tertiary, #737373));
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.gn-item-time {
  font-size: 11px;
  color: hsl(var(--txt-disabled, #9ca3af));
}

.gn-empty {
  min-height: 160px;
}

.gn-footer {
  display: flex;
  justify-content: center;
  padding: 8px 16px;
  border-top: 1px solid hsl(var(--border-subtle, #e5e7eb));
}
</style>
