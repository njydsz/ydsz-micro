<!--
  通知铃铛 —— 顶部导航栏入口组件。

  功能：
  - 铃铛图标 + 未读 badge（totalUnread）
  - 点击展开 NotificationPanel
  - SSE 连线状态指示（小圆点：绿=已连，灰=断线）
  - 有新通知时短暂闪烁动画

@path comm/@core/ui-kit/shadcn-ui/src/components/notification/notification-bell.vue
@author ydsz-team
@since 4.1.0 (P2-15)
-->
<script setup lang="ts">
import { computed, ref } from 'vue';

import { onClickOutside } from '@vueuse/core';

import { useNotificationStore } from '@YDSZ/shared-business/notification';

import NotificationPanel from './notification-panel.vue';

const notificationStore = useNotificationStore();
const panelRef = ref<HTMLElement | null>(null);
const panelVisible = ref(false);

/** 未读 badge 数字（99+ 封顶显示） */
const badgeCount = computed<string>(() => {
  const n = notificationStore.totalUnread;
  return n > 99 ? '99+' : n > 0 ? String(n) : '';
});

function togglePanel() {
  panelVisible.value = !panelVisible.value;
}

function handleSelect() {
  panelVisible.value = false;
}

// 点击外部关闭
onClickOutside(panelRef, () => {
  panelVisible.value = false;
});
</script>

<template>
  <div ref="panelRef" class="notification-bell">
    <button
      class="notification-bell__trigger"
      :class="{ 'notification-bell__trigger--active': panelVisible }"
      aria-label="通知中心"
      @click="togglePanel"
    >
      <VbenIcon icon="lucide:bell" :size="20" />
      <span v-if="badgeCount" class="notification-bell__badge">{{ badgeCount }}</span>
      <span
        class="notification-bell__status-dot"
        :class="{
          'notification-bell__status-dot--online': notificationStore.connected,
          'notification-bell__status-dot--offline': !notificationStore.connected,
        }"
      />
    </button>

    <!-- 通知面板 -->
    <NotificationPanel v-if="panelVisible" class="notification-bell__panel" @select="handleSelect" />
  </div>
</template>

<style scoped>
.notification-bell {
  position: relative;
  display: inline-flex;
}

.notification-bell__trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: var(--foreground-muted, #6b7280);
  transition: background 0.15s, color 0.15s;
}

.notification-bell__trigger:hover,
.notification-bell__trigger--active {
  background: var(--muted, #f3f4f6);
  color: var(--foreground, #111827);
}

.notification-bell__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: var(--danger, #ef4444);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  padding: 0 4px;
  pointer-events: none;
}

.notification-bell__status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--gs-bg, #fff);
}

.notification-bell__status-dot--online {
  background: #10b981;
}

.notification-bell__status-dot--offline {
  background: #9ca3af;
}

.notification-bell__panel {
  position: absolute;
  top: 40px;
  right: 0;
  z-index: 1000;
}
</style>
