<!--
 * 通知铃铛组件 —— 顶栏右上角展示铃铛图标、未读数量角标、下拉展示最近 10 条未读通知
 *
 * <p>功能：
 * <ul>
 *   <li>顶栏右上角展示铃铛图标</li>
 *   <li>显示未读数量角标（红点+数字）</li>
 *   <li>点击下拉展示最近 10 条未读通知</li>
 *   <li>每条通知展示：标题、内容摘要、时间、类型图标</li>
 *   <li>支持「全部标记已读」和「查看更多」</li>
 * </ul>
 *
 * 使用自研 shadcn-scoped YdPopoverBase/YdScrollArea/YdButtonBase + lucide 图标，零 element-plus 依赖。
 *
 * @path comm\@core\components\notification-bell\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { NotificationItem } from '#/store/notification';

import { computed, onMounted, ref } from 'vue';

import { useI18n } from 'vue-i18n';

import { ArrowRight, Bell, CheckCheck, Settings } from 'lucide-vue-next';

import {
  YdButtonBase,
  YdPopoverBase,
  YdPopoverContentBase,
  YdPopoverTriggerBase,
  YdScrollArea,
  YdTooltipBase,
  YdTooltipContentBase,
  YdTooltipProviderBase,
  YdTooltipTriggerBase,
} from '@ydsz-core/shadcn-ui';
import { cn } from '@ydsz-core/shared/utils';

import { useNotificationStore } from '#/store/notification';

interface Props {
  /** 下拉面板最大高度(px) */
  maxHeight?: number;
  /** 是否显示连接状态指示器 */
  showConnectionStatus?: boolean;
}

withDefaults(defineProps<Props>(), {
  maxHeight: 400,
  showConnectionStatus: true,
});

const emit = defineEmits<{
  'click-notification': [item: NotificationItem];
  'click-view-all': [];
  'click-settings': [];
}>();

const { t } = useI18n();
const notificationStore = useNotificationStore();

/** 下拉面板是否打开 */
const popoverOpen = ref(false);

/** 连接状态 */
const connected = computed(() => notificationStore.connected);

/** 未读通知数量 */
const unreadCount = computed(() => notificationStore.unreadCount);

/** 限制下拉列表展示最近 10 条 */
const displayNotifications = computed(() =>
  notificationStore.notifications.slice(0, 10),
);

/** 通知类型颜色映射 */
const typeColorMap: Record<string, string> = {
  INFO: 'text-blue-500',
  WARN: 'text-amber-500',
  ERROR: 'text-red-500',
  CRITICAL: 'text-red-700',
};

function getTypeColor(type: string): string {
  return typeColorMap[type] || 'text-gray-400';
}

/** 格式化时间展示 */
function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (minutes < 1) return t('notification.justNow');
    if (minutes < 60) return t('notification.minutesAgo', [String(minutes)]);
    if (hours < 24) return t('notification.hoursAgo', [String(hours)]);
    if (days < 7) return t('notification.daysAgo', [String(days)]);
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

/** 类型图标映射 */
const typeIconClassMap: Record<string, string> = {
  INFO: 'lucide:info',
  WARN: 'lucide:alert-triangle',
  ERROR: 'lucide:alert-circle',
  CRITICAL: 'lucide:shield-alert',
};

function getTypeIconClass(type: string): string {
  return typeIconClassMap[type] || 'lucide:bell';
}

/** 点击通知项 */
function handleClickNotification(item: NotificationItem): void {
  if (!item.isRead) {
    notificationStore.markRead(item.id);
  }
  emit('click-notification', item);
}

/** 全部标记已读 */
async function handleMarkAllRead(): Promise<void> {
  await notificationStore.markAllRead();
}

/** 查看更多 */
function handleViewAll(): void {
  popoverOpen.value = false;
  emit('click-view-all');
}

/** 打开设置 */
function handleOpenSettings(): void {
  popoverOpen.value = false;
  emit('click-settings');
}

onMounted(() => {
  notificationStore.refreshUnreadCount();
});
</script>

<template>
  <div class="notification-bell-wrapper">
    <YdPopoverBase v-model:open="popoverOpen">
      <YdPopoverTriggerBase as-child>
        <button
          type="button"
          class="bell-icon-wrapper"
          aria-label="通知"
        >
          <!-- 角标：自研简化数字徽章 -->
          <span
            v-if="unreadCount > 0"
            class="bell-badge"
            aria-hidden="true"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
          <div class="bell-button">
            <Bell :size="18" class="bell-svg" />
          </div>
        </button>
      </YdPopoverTriggerBase>

      <YdPopoverContentBase
        align="end"
        side="bottom"
        :side-offset="8"
        class="notification-bell-popover"
      >
        <!-- 头部 -->
        <div class="notification-header">
          <div class="notification-header-title">
            <span>{{ t('notification.title') }}</span>
            <span
              v-if="showConnectionStatus"
              :class="[
                'connection-status',
                connected ? 'is-connected' : 'is-disconnected',
              ]"
            >
              <span
                :class="[
                  'status-dot',
                  connected ? 'is-active' : 'is-inactive',
                ]"
              />
              {{
                connected
                  ? t('notification.connected')
                  : t('notification.disconnected')
              }}
            </span>
          </div>
          <YdTooltipProviderBase>
            <YdTooltipBase>
              <YdTooltipTriggerBase as-child>
                <YdButtonBase
                  :disabled="unreadCount <= 0"
                  size="sm"
                  variant="ghost"
                  class="header-mark-read"
                  @click="handleMarkAllRead"
                >
                  <CheckCheck :size="16" />
                </YdButtonBase>
              </YdTooltipTriggerBase>
              <YdTooltipContentBase side="top">
                {{ t('notification.markAllAsRead') }}
              </YdTooltipContentBase>
            </YdTooltipBase>
          </YdTooltipProviderBase>
        </div>

        <!-- 通知列表 -->
        <YdScrollArea :style="{ maxHeight: maxHeight + 'px' }">
          <div
            v-if="displayNotifications.length > 0"
            class="notification-list"
          >
            <div
              v-for="item in displayNotifications"
              :key="item.id"
              :class="[
                'notification-item',
                { 'is-unread': !item.isRead },
              ]"
              @click="handleClickNotification(item)"
            >
              <!-- 类型图标 -->
              <div
                :class="[
                  'item-type-icon',
                  getTypeColor(item.type),
                ]"
                aria-hidden="true"
              >
                <i :class="getTypeIconClass(item.type)" />
              </div>

              <!-- 内容 -->
              <div class="item-content">
                <div class="item-title-row">
                  <span class="item-title">{{ item.title }}</span>
                  <span
                    v-if="!item.isRead"
                    class="unread-dot"
                    aria-label="未读"
                  />
                </div>
                <p class="item-message">{{ item.message }}</p>
                <span class="item-time">{{ formatTime(item.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="notification-empty"
          >
            <Bell
              :size="32"
              class="empty-icon"
              aria-hidden="true"
            />
            <span class="empty-text">{{ t('notification.noData') }}</span>
          </div>
        </YdScrollArea>

        <!-- 底部操作栏 -->
        <div class="notification-footer">
          <YdButtonBase
            size="sm"
            variant="ghost"
            class="footer-settings"
            @click="handleOpenSettings"
          >
            <Settings :size="14" class="footer-settings-icon" />
            {{ t('notification.settings') }}
          </YdButtonBase>
          <YdButtonBase
            size="sm"
            variant="default"
            @click="handleViewAll"
          >
            {{ t('notification.viewAll') }}
            <ArrowRight :size="14" class="footer-view-all-icon" />
          </YdButtonBase>
        </div>
      </YdPopoverContentBase>
    </YdPopoverBase>
  </div>
</template>

<style lang="scss" scoped>
.notification-bell-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
}

.bell-icon-wrapper {
  position: relative;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  height: 32px;
  width: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: hsl(var(--neutral-100, #f0f0f0));
  }
}

.bell-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: hsl(var(--destructive-500, #ef4444));
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  padding: 0 5px;
  font-weight: 600;
  pointer-events: none;
}

.bell-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.bell-svg {
  color: hsl(var(--txt-secondary, #606266));
}

.notification-bell-popover {
  width: 360px;
  padding: 0 !important;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgb(0 0 0 / 12%);
  border: 1px solid hsl(var(--border-subtle, #e5e7eb));
  background-color: hsl(var(--bg-surface-2, #fff));
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 1px solid hsl(var(--border-subtle, #e5e7eb));
}

.header-mark-read {
  padding: 4px;
  height: auto;
}

.notification-header-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
}

.connection-status {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  font-weight: 400;

  &.is-connected {
    color: hsl(var(--success-500, #22c55e));
  }

  &.is-disconnected {
    color: hsl(var(--warning-500, #f59e0b));
  }
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.is-active {
    background-color: hsl(var(--success-500, #22c55e));
  }

  &.is-inactive {
    background-color: hsl(var(--warning-500, #f59e0b));
    animation: pulse 1.5s ease-in-out infinite;
  }
}

.notification-list {
  padding: 4px 0;
}

.notification-item {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: hsl(var(--neutral-50, #f5f5f5));
  }

  &.is-unread {
    background-color: hsl(var(--brand-50, #eff6ff));

    &:hover {
      background-color: hsl(var(--brand-100, #dbeafe));
    }
  }
}

.item-type-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.item-title {
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-dot {
  display: inline-block;
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  background-color: hsl(var(--destructive-500, #ef4444));
  border-radius: 50%;
}

.item-message {
  display: -webkit-box;
  margin: 2px 0;
  overflow: hidden;
  font-size: 12px;
  color: hsl(var(--txt-tertiary, #737373));
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-time {
  font-size: 11px;
  color: hsl(var(--txt-disabled, #9ca3af));
}

.notification-empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-icon {
  color: hsl(var(--txt-disabled, #9ca3af));
}

.empty-text {
  font-size: 13px;
  color: hsl(var(--txt-disabled, #9ca3af));
}

.notification-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid hsl(var(--border-subtle, #e5e7eb));
}

.footer-settings {
  color: hsl(var(--txt-secondary, #606266));
}

.footer-settings-icon {
  margin-right: 4px;
}

.footer-view-all-icon {
  margin-left: 4px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}
</style>
