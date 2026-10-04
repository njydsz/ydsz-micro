<!--
 * 通知中心页面 —— 平台级 SSE 实时通知列表，支持分页/筛选/标记已读/跳转
 *
 * @path main\src\views\notifications\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { NotificationItem } from '#/api/core/notification';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { formatDateTime, openWindow } from '@ydsz/utils';
import { createLogger } from '@ydsz-core/shared/utils';

import { useNotificationStore } from '#/store/notification';
import { useNotificationSse } from '#/composables/use-notification-sse';
import { $t } from '#/locales';

/** 模块级日志器 */
const logger = createLogger('NotificationCenter');

const router = useRouter();
const notificationStore = useNotificationStore();

/** SSE 桥接 composable */
const { connected } = useNotificationSse();

/** 分页状态 */
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);

/** 级别筛选 */
const levelFilter = ref<string>('');
const readFilter = ref<string>('');

/** 摘要统计 */
const allCount = computed(() => total.value);
const unreadCount = computed(() => notificationStore.unreadCount);
const todayCount = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return notificationStore.notifications.filter(
    (n) => new Date(n.createdAt).getTime() >= today.getTime(),
  ).length;
});

const notifications = computed(() => {
  let list = [...notificationStore.notifications];
  if (levelFilter.value) {
    list = list.filter((n) => n.type === levelFilter.value);
  }
  if (readFilter.value === 'read') {
    list = list.filter((n) => n.isRead);
  } else if (readFilter.value === 'unread') {
    list = list.filter((n) => !n.isRead);
  }
  return list;
});

/** 分页数据 */
const pagedNotifications = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value;
  return notifications.value.slice(start, start + pageSize.value);
});

async function fetchData() {
  loading.value = true;
  try {
    await notificationStore.fetchNotifications(pageNum.value, pageSize.value);
    // fetchNotifications 在 store 里更新了 notifications，
    // total 由单独的全局 total ref 维护（后端分页结果暂不直接返回 total，取列表长度兜底）
    total.value = notificationStore.notifications.length;
  } catch (error) {
    logger.error('Failed to fetch notifications:', error);
  } finally {
    loading.value = false;
  }
}

async function handleMarkAsRead(id: string) {
  await notificationStore.markAsRead(id);
}

async function handleMarkAllRead() {
  await notificationStore.markAllAsRead();
}

async function handleRemove(id: string) {
  await notificationStore.removeNotification(id);
}

function handleClearAll() {
  notificationStore.clearAll();
}

function handleRowClick(item: NotificationItem) {
  if (!item.isRead) {
    void handleMarkAsRead(item.id);
  }
  // 跳转
  const link = item.link;
  if (!link) return;
  if (link.startsWith('http')) {
    openWindow(link);
  } else if (link.startsWith('/')) {
    router.push(link).catch((error) => {
      logger.error('Navigation failed:', error);
    });
  }
}

function formatTime(time: string) {
  return formatDateTime(time);
}

function levelBadgeType(type: string): string {
  const map: Record<string, string> = {
    INFO: 'bg-blue-100 text-blue-700',
    SUCCESS: 'bg-green-100 text-green-700',
    WARN: 'bg-amber-100 text-amber-700',
    WARNING: 'bg-amber-100 text-amber-700',
    ERROR: 'bg-red-100 text-red-700',
    FATAL: 'bg-red-100 text-red-700',
  };
  return map[type] ?? 'bg-gray-100 text-gray-700';
}

watch([levelFilter, readFilter], () => {
  pageNum.value = 1;
});

onMounted(() => {
  void fetchData();
  void notificationStore.refreshUnreadCount();
});

onUnmounted(() => {
  // SSE 由 composable 全局管理，此处仅断开局部引用
});
</script>

<template>
  <div class="p-5">
    <!-- 顶部摘要栏 -->
    <div class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div class="rounded-lg border p-4">
        <div class="text-muted-foreground text-sm">{{ $t('notification.summary.total') }}</div>
        <div class="mt-1 text-2xl font-bold">{{ allCount }}</div>
      </div>
      <div class="rounded-lg border p-4">
        <div class="text-muted-foreground text-sm">{{ $t('notification.summary.unread') }}</div>
        <div class="mt-1 text-2xl font-bold text-amber-600">{{ unreadCount }}</div>
      </div>
      <div class="rounded-lg border p-4">
        <div class="text-muted-foreground text-sm">{{ $t('notification.summary.today') }}</div>
        <div class="mt-1 text-2xl font-bold">{{ todayCount }}</div>
      </div>
      <div class="rounded-lg border p-4">
        <div class="text-muted-foreground text-sm">{{ $t('notification.summary.connection') }}</div>
        <div class="mt-1 flex items-center gap-2">
          <span
            class="inline-block h-2 w-2 rounded"
            :class="connected ? 'bg-green-500' : 'bg-gray-400'"
          ></span>
          <span class="text-lg font-medium">
            {{ connected ? $t('notification.sse.connected') : $t('notification.sse.disconnected') }}
          </span>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <select
        v-model="levelFilter"
        class="w-32 rounded border px-2 py-1 text-sm"
      >
        <option value="">{{ $t('notification.filter.allLevels') }}</option>
        <option value="INFO">{{ $t('notification.level.info') }}</option>
        <option value="SUCCESS">{{ $t('notification.level.success') }}</option>
        <option value="WARN">{{ $t('notification.level.warning') }}</option>
        <option value="WARNING">{{ $t('notification.level.warning') }}</option>
        <option value="ERROR">{{ $t('notification.level.error') }}</option>
      </select>

      <select
        v-model="readFilter"
        class="w-32 rounded border px-2 py-1 text-sm"
      >
        <option value="">{{ $t('notification.filter.allStatus') }}</option>
        <option value="unread">{{ $t('notification.status.unread') }}</option>
        <option value="read">{{ $t('notification.status.read') }}</option>
      </select>

      <button
        class="rounded bg-primary px-3 py-1 text-sm text-white"
        @click="fetchData"
      >
        {{ $t('common.refresh') }}
      </button>

      <button
        class="rounded border px-3 py-1 text-sm"
        @click="handleMarkAllRead"
      >
        {{ $t('notification.markAllRead') }}
      </button>

      <button
        class="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
        @click="handleClearAll"
      >
        {{ $t('notification.clearAll') }}
      </button>
    </div>

    <!-- 通知列表 -->
    <div v-if="loading" class="text-muted-foreground py-10 text-center">
      {{ $t('common.loadingMenu') }}
    </div>

    <div v-else-if="pagedNotifications.length === 0" class="text-muted-foreground py-10 text-center">
      {{ $t('common.noData') }}
    </div>

    <div v-else class="rounded-lg border">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-left">
            <th class="px-4 py-3">{{ $t('notification.col.title') }}</th>
            <th class="px-4 py-3">{{ $t('notification.col.level') }}</th>
            <th class="px-4 py-3">{{ $t('notification.col.time') }}</th>
            <th class="px-4 py-3">{{ $t('notification.col.status') }}</th>
            <th class="px-4 py-3">{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in pagedNotifications"
            :key="item.id"
            class="hover:bg-accent cursor-pointer border-b"
            :class="{ 'bg-accent/40': !item.isRead }"
            @click="handleRowClick(item)"
          >
            <td class="max-w-xs px-4 py-3">
              <div class="flex items-center gap-2">
                <span
                  v-if="!item.isRead"
                  class="bg-primary inline-block h-2 w-2 shrink-0 rounded"
                ></span>
                <span :class="{ 'font-semibold': !item.isRead }">{{ item.title }}</span>
              </div>
              <p class="text-muted-foreground mt-1 line-clamp-1 text-xs">{{ item.message }}</p>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-block rounded px-2 py-0.5 text-xs font-medium"
                :class="levelBadgeType(item.type)"
              >
                {{ item.type }}
              </span>
            </td>
            <td class="text-muted-foreground px-4 py-3 whitespace-nowrap">
              {{ formatTime(item.createdAt) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="text-xs"
                :class="item.isRead ? 'text-muted-foreground' : 'text-amber-600 font-medium'"
              >
                {{ item.isRead ? $t('notification.status.read') : $t('notification.status.unread') }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2" @click.stop>
                <button
                  v-if="!item.isRead"
                  class="text-primary text-xs hover:underline"
                  @click="handleMarkAsRead(item.id)"
                >
                  {{ $t('notification.markRead') }}
                </button>
                <button
                  class="text-xs text-red-500 hover:underline"
                  @click="handleRemove(item.id)"
                >
                  {{ $t('common.delete') }}
                </button>
                <a
                  v-if="item.link"
                  class="text-xs text-blue-500 hover:underline"
                  @click.stop="handleRowClick(item)"
                >
                  {{ $t('notification.viewDetail') }}
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="flex items-center justify-between border-t px-4 py-3">
        <div class="text-muted-foreground text-sm">
          {{ $t('notification.summary.total') }}: {{ notifications.length }}
        </div>
        <div class="flex items-center gap-2">
          <button
            :disabled="pageNum <= 1"
            class="rounded border px-2 py-1 text-sm disabled:opacity-40"
            @click="pageNum--"
          >
            &laquo;
          </button>
          <span class="text-sm">{{ pageNum }}</span>
          <button
            :disabled="pageNum * pageSize >= notifications.length"
            class="rounded border px-2 py-1 text-sm disabled:opacity-40"
            @click="pageNum++"
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
