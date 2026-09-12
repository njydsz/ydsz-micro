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
 * @path comm\@core\components\notification-bell\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { NotificationItem } from '#/store/notification';

import { computed, onMounted, ref } from 'vue';

import { useI18n } from 'vue-i18n';

import { ElBadge, ElButton, ElIcon, ElPopover, ElScrollbar, ElTooltip } from 'element-plus';

import { ArrowRight } from '@element-plus/icons-vue';

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

/** 类型图标 class 映射 */
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
function handleClickNotification(item: NotificationItem) {
  if (!item.isRead) {
    notificationStore.markRead(item.id);
  }
  emit('click-notification', item);
}

/** 全部标记已读 */
async function handleMarkAllRead() {
  await notificationStore.markAllRead();
}

/** 查看更多 */
function handleViewAll() {
  popoverOpen.value = false;
  emit('click-view-all');
}

/** 打开设置 */
function handleOpenSettings() {
  popoverOpen.value = false;
  emit('click-settings');
}

onMounted(() => {
  notificationStore.refreshUnreadCount();
});
</script>

<template>
  <div class="notification-bell-wrapper">
    <ElPopover
      v-model:visible="popoverOpen"
      :show-arrow="false"
      :teleported="true"
      placement="bottom-end"
      trigger="click"
      :width="360"
      popper-class="notification-bell-popover"
    >
      <template #reference>
        <div class="bell-icon-wrapper">
          <ElBadge :hidden="unreadCount <= 0" :max="99" :value="unreadCount">
            <div class="bell-button">
              <ElIcon :size="18" class="bell-svg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </ElIcon>
            </div>
          </ElBadge>
        </div>
      </template>

      <!-- 头部 -->
      <div class="notification-header">
        <div class="notification-header-title">
          <span>{{ t('notification.title') }}</span>
          <span
            v-if="showConnectionStatus"
            class="connection-status"
            :class="connected ? 'is-connected' : 'is-disconnected'"
          >
            <span
              class="status-dot"
              :class="connected ? 'is-active' : 'is-inactive'"
            />
            {{
              connected
                ? t('notification.connected')
                : t('notification.disconnected')
            }}
          </span>
        </div>
        <ElTooltip :content="t('notification.markAllAsRead')" placement="top">
          <ElButton
            :disabled="unreadCount <= 0"
            size="small"
            text
            @click="handleMarkAllRead"
          >
            <ElIcon :size="16">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 7 17l-5-5" />
                <path d="m22 10-7.5 7.5L13 16" />
              </svg>
            </ElIcon>
          </ElButton>
        </ElTooltip>
      </div>

      <!-- 通知列表 -->
      <ElScrollbar :max-height="maxHeight">
        <div v-if="displayNotifications.length > 0" class="notification-list">
          <div
            v-for="item in displayNotifications"
            :key="item.id"
            class="notification-item"
            :class="{ 'is-unread': !item.isRead }"
            @click="handleClickNotification(item)"
          >
            <!-- 类型图标 -->
            <div
              class="item-type-icon"
              :class="getTypeColor(item.type)"
            >
              <ElIcon :size="16">
                <i :class="getTypeIconClass(item.type)" />
              </ElIcon>
            </div>

            <!-- 内容 -->
            <div class="item-content">
              <div class="item-title-row">
                <span class="item-title">{{ item.title }}</span>
                <span v-if="!item.isRead" class="unread-dot" />
              </div>
              <p class="item-message">{{ item.message }}</p>
              <span class="item-time">{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="notification-empty">
          <ElIcon :size="32" class="empty-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </ElIcon>
          <span class="empty-text">{{ t('notification.noData') }}</span>
        </div>
      </ElScrollbar>

      <!-- 底部操作栏 -->
      <div class="notification-footer">
        <ElButton size="small" text @click="handleOpenSettings">
          <ElIcon :size="14" class="footer-settings-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </ElIcon>
          {{ t('notification.settings') }}
        </ElButton>
        <ElButton size="small" type="primary" @click="handleViewAll">
          {{ t('notification.viewAll') }}
          <ElIcon :size="14"><ArrowRight /></ElIcon>
        </ElButton>
      </div>
    </ElPopover>
  </div>
</template>

<style lang="scss" scoped>
.notification-bell-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
}

.bell-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }
}

.bell-svg {
  color: var(--el-text-color-regular);
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
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
    color: var(--el-color-success);
  }

  &.is-disconnected {
    color: var(--el-color-warning);
  }
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.is-active {
    background-color: var(--el-color-success);
  }

  &.is-inactive {
    background-color: var(--el-color-warning);
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
    background-color: var(--el-fill-color-light);
  }

  &.is-unread {
    background-color: var(--el-color-primary-light-9);

    &:hover {
      background-color: var(--el-color-primary-light-8);
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
  background-color: var(--el-color-danger);
  border-radius: 50%;
}

.item-message {
  display: -webkit-box;
  margin: 2px 0;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
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
  color: var(--el-text-color-placeholder);
}

.empty-text {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.notification-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.footer-settings-icon {
  margin-right: 4px;
}

:global(.notification-bell-popover) {
  padding: 0 !important;
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
