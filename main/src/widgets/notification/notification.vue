<!--
 * 通知中心挂件 —— 顶栏 Bell 图标，显示未读徽标 + popover 预览最近通知
 *
 * <p>拉取 notification store 渲染未读徽标与最近 5 条通知，
 * 点击打开 popover 显示列表 + "查看全部" 跳转通知中心。
 * SSE 推送时通过 store 触发 toast 提示。
 *
 * @path main\src\widgets\notification\notification.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Bell, Check } from 'lucide-vue-next';
import { useToggle } from '@vueuse/core';
import { showToast } from '@ydsz/notification';

import { createLogger } from '@ydsz-core/shared/utils';
import { openWindow } from '@ydsz/utils';

import { useNotificationStore } from '#/store/notification';
import { $t } from '#/locales';

/** 模块级日志器 */
const logger = createLogger('NotificationWidget');

const router = useRouter();
const store = useNotificationStore();

const [open, toggle] = useToggle();

/** 未读数量 */
const unreadCount = computed(() => store.unreadCount);

/** 最近 5 条通知 */
const recentNotifications = computed(() => store.notifications.slice(0, 5));

/** 是否有未读 */
const hasUnread = computed(() => unreadCount.value > 0);

function handleViewNotification(id: string) {
  const item = store.notifications.find((n) => n.id === id);
  if (item && !item.isRead) {
    void store.markAsRead(item.id);
  }
  // 跳转
  if (item?.link) {
    if (item.link.startsWith('http')) {
      openWindow(item.link);
    } else if (item.link.startsWith('/')) {
      router.push(item.link).catch((error) => {
        logger.error('Navigation failed:', error);
      });
    }
  }
  open.value = false;
}

function handleMarkAllRead() {
  void store.markAllAsRead();
  showToast($t('notification.markAllRead'), {
    variant: 'success',
    duration: 2000,
  });
}

function handleViewAll() {
  open.value = false;
  router.push('/notifications').catch((error) => {
    logger.error('Navigation failed:', error);
  });
}

function formatTime(time: string) {
  try {
    return new Date(time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return time;
  }
}
</script>

<template>
  <div class="relative inline-flex">
    <button
      class="relative rounded-md p-1.5 transition-colors hover:bg-accent"
      :aria-label="$t('ui.widgets.notifications')"
      @click.stop="toggle()"
    >
      <Bell class="size-4" />
      <span
        v-if="hasUnread"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-lg border bg-popover shadow-lg"
    >
      <!-- 标题栏 -->
      <div class="flex items-center justify-between border-b px-4 py-3">
        <span class="text-sm font-medium">{{ $t('ui.widgets.notifications') }}</span>
        <button
          v-if="hasUnread"
          class="text-primary text-xs hover:underline"
          @click="handleMarkAllRead"
        >
          <span class="inline-flex items-center gap-1">
            <Check class="size-3" />
            {{ $t('ui.widgets.markAllAsRead') }}
          </span>
        </button>
      </div>

      <!-- 通知列表 -->
      <div v-if="recentNotifications.length > 0" class="max-h-[280px] overflow-y-auto">
        <div
          v-for="item in recentNotifications"
          :key="item.id"
          class="flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-accent"
          :class="{ 'bg-accent/30': !item.isRead }"
          @click="handleViewNotification(item.id)"
        >
          <span
            v-if="!item.isRead"
            class="mt-1.5 inline-block h-2 w-2 shrink-0 rounded bg-primary"
          ></span>
          <div class="min-w-0 flex-1">
            <p class="line-clamp-1 text-sm" :class="{ 'font-medium': !item.isRead }">
              {{ item.title }}
            </p>
            <p class="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
              {{ item.message }}
            </p>
            <p class="text-muted-foreground mt-0.5 text-xs">
              {{ formatTime(item.createdAt) }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-muted-foreground py-8 text-center text-sm"
      >
        {{ $t('common.noData') }}
      </div>

      <!-- 底部操作 -->
      <div class="border-t px-4 py-2">
        <button
          class="text-primary w-full text-center text-xs hover:underline"
          @click="handleViewAll"
        >
          {{ $t('ui.widgets.viewAll') }}
        </button>
      </div>
    </div>

    <!-- 点击外部关闭 -->
    <div
      v-if="open"
      class="fixed inset-0 z-40"
      @click="open = false"
    ></div>
  </div>
</template>
