<!--
  通知面板 —— 铃铛展开后的下拉通知中心。

  功能：
  - Tab 筛选（全部 / 系统 / 流程 / 消息 / 安全）
  - 通知列表（标题 / 内容 / 时间 / 优先级色点）
  - 操作按钮（「查看」「标记已读」「批量全部已读」）
  - 空状态 + 加载骨架屏

@path comm/@core/ui-kit/shadcn-ui/src/components/notification/notification-panel.vue
@author ydsz-team
@since 4.1.0 (P2-15)
-->
<script setup lang="ts">
import { computed } from 'vue';

import { ElMessage, ElMessageBox } from 'element-plus';

import { useNotificationStore } from '@YDSZ/shared-business/notification';
import { NotificationType, type NotificationItem } from '@YDSZ/shared-business/notification';

const emit = defineEmits<{
  (e: 'select', item: NotificationItem): void;
}>();

const notificationStore = useNotificationStore();

const TABS = [
  { key: null, label: '全部' },
  { key: NotificationType.SYSTEM as NotificationType | null, label: '系统' },
  { key: NotificationType.WORKFLOW as NotificationType | null, label: '流程' },
  { key: NotificationType.MESSAGE as NotificationType | null, label: '消息' },
  { key: NotificationType.AUDIT as NotificationType | null, label: '安全' },
] as const;

/** 各 tab 对应数量 */
const tabCounts = computed<Record<string, number>>(() => ({
  '': notificationStore.totalUnread,
  [NotificationType.SYSTEM]: notificationStore.unreadCounts.system,
  [NotificationType.WORKFLOW]: notificationStore.unreadCounts.workflow,
  [NotificationType.MESSAGE]: notificationStore.unreadCounts.message,
  [NotificationType.AUDIT]: notificationStore.unreadCounts.audit,
}));

/** 优先级色点 CLASS */
function priorityDotClass(priority?: string): string {
  return `notification-panel__priority-dot--${priority || 'normal'}`;
}

/** 截断文本 */
function truncate(text: string, len = 60): string {
  return text.length > len ? text.slice(0, len) + '…' : text;
}

/** 格式化时间 */
function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** 点击通知项 */
function handleItemClick(item: NotificationItem): void {
  notificationStore.markAsRead(item.id);
  if (item.link) {
    // router 跳转由父级处理（当前 only close）
  }
  emit('select', item);
}

/** 批量全部已读 */
async function handleMarkAllRead(): Promise<void> {
  await ElMessageBox.confirm('是否将所有通知标记为已读？', '确认', { type: 'info' })
    .then(() => {
      notificationStore.markAllAsRead();
      ElMessage.success('已全部标记为已读');
    })
    .catch(() => {
      /* cancelled */
    });
}
</script>

<template>
  <div class="notification-panel">
    <!-- Header -->
    <div class="notification-panel__header">
      <h3 class="notification-panel__title">通知中心</h3>
      <button
        v-if="notificationStore.hasUnread"
        class="notification-panel__mark-all"
        @click="handleMarkAllRead"
      >
        全部已读
      </button>
    </div>

    <!-- Tabs -->
    <div class="notification-panel__tabs">
      <button
        v-for="tab in TABS"
        :key="String(tab.key)"
        class="notification-panel__tab"
        :class="{ 'notification-panel__tab--active': notificationStore.activeFilter === tab.key }"
        @click="notificationStore.setFilter(tab.key as NotificationType | null)"
      >
        {{ tab.label }}
        <span v-if="tabCounts[String(tab.key)]" class="notification-panel__tab-badge">
          {{ tabCounts[String(tab.key)] }}
        </span>
      </button>
    </div>

    <!-- List -->
    <div class="notification-panel__list-container">
      <ul v-if="notificationStore.filteredItems.length > 0" class="notification-panel__list">
        <li
          v-for="item in notificationStore.filteredItems"
          :key="item.id"
          class="notification-panel__item"
          :class="{ 'notification-panel__item--unread': !item.read }"
          @click="handleItemClick(item)"
        >
          <div v-if="item.priority && item.priority !== 'normal'" :class="['notification-panel__priority-dot', priorityDotClass(item.priority)]" />
          <div class="notification-panel__item-main">
            <div class="notification-panel__item-title">
              <span v-if="!item.read" class="notification-panel__unread-dot" />
              {{ item.title }}
            </div>
            <div v-if="item.content" class="notification-panel__item-content">
              {{ truncate(item.content) }}
            </div>
            <div class="notification-panel__item-footer">
              <span class="notification-panel__item-time">{{ formatTime(item.timestamp) }}</span>
              <div v-if="item.actions && item.actions.length > 0" class="notification-panel__item-actions">
                <button
                  v-for="action in item.actions"
                  :key="action.key"
                  class="notification-panel__action-btn"
                  @click.stop
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <!-- Empty state -->
      <div v-else class="notification-panel__empty">
        <VbenIcon icon="lucide:bell-off" :size="32" />
        <p>暂无通知</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-panel {
  --np-bg: var(--popover, #fff);
  --np-border: var(--border, #e5e7eb);
  --np-radius: 12px;

  width: 380px;
  max-height: 520px;
  background: var(--np-bg);
  border: 1px solid var(--np-border);
  border-radius: var(--np-radius);
  box-shadow: 0 8px 32px rgb(0 0 0 / 12%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notification-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--np-border);
}

.notification-panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.notification-panel__mark-all {
  padding: 4px 10px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--primary, #3b82f6);
  cursor: pointer;
}

.notification-panel__tabs {
  display: flex;
  gap: 2px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--np-border);
  overflow-x: auto;
}

.notification-panel__tab {
  padding: 4px 10px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.notification-panel__tab--active {
  background: var(--primary-light, #eff6ff);
  color: var(--primary, #3b82f6);
  font-weight: 600;
}

.notification-panel__tab-badge {
  padding: 0 5px;
  border-radius: 8px;
  background: var(--muted, #f3f4f6);
  font-size: 11px;
  font-weight: 500;
}

.notification-panel__list-container {
  flex: 1;
  overflow-y: auto;
}

.notification-panel__list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.notification-panel__item {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.notification-panel__item:hover {
  background: var(--muted, #f9fafb);
}

.notification-panel__item--unread {
  background: var(--primary-subtle, #f0f7ff);
}

.notification-panel__priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.notification-panel__priority-dot--low { background: #9ca3af; }
.notification-panel__priority-dot--normal { background: transparent; }
.notification-panel__priority-dot--high { background: #f59e0b; }
.notification-panel__priority-dot--urgent { background: #ef4444; }

.notification-panel__item-main {
  flex: 1;
  min-width: 0;
}

.notification-panel__item-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground, #111827);
}

.notification-panel__unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary, #3b82f6);
  flex-shrink: 0;
}

.notification-panel__item-content {
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.4;
}

.notification-panel__item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.notification-panel__item-time {
  font-size: 12px;
  color: #9ca3af;
}

.notification-panel__item-actions {
  display: flex;
  gap: 6px;
}

.notification-panel__action-btn {
  padding: 2px 8px;
  border: 1px solid var(--primary, #3b82f6);
  border-radius: 4px;
  background: transparent;
  font-size: 12px;
  color: var(--primary, #3b82f6);
  cursor: pointer;
}

.notification-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  color: #9ca3af;
  gap: 8px;
  font-size: 14px;
}
</style>
