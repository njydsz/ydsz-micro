<!--
 * 全局设置悬浮按钮：仿 ForgeLab forge-admin 右侧悬浮齿轮。
 *
 * 设计目标：
 *  - 固定悬浮于页面右下角，始终可见；
 *  - 点击展开快捷设置菜单（主题切换、布局偏好、全屏等）；
 *  - 收起状态仅显示设置图标，展开后显示菜单面板；
 *  - 点击外部区域或再次点击按钮自动收起。
 *
 * 无障碍：
 *  - 按钮带 aria-label；
 *  - 菜单项通过 role="menuitem" 暴露语义。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\settings-float\YdSettingsFloatButton.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { onClickOutside } from '@vueuse/core';
import { cn } from '@ydsz-core/shared/utils';
import { Maximize, Moon, Settings, Sun, X } from 'lucide-vue-next';

defineOptions({
  name: 'YdSettingsFloatButton',
});

interface MenuAction {
  /** 操作唯一 key，用于点击回调 */
  key: string;
  /** 显示文案 */
  label: string;
  /** 图标组件 */
  icon?: typeof Settings;
  /** 是否危险操作（红色高亮） */
  danger?: boolean;
}

interface Props {
  /** 操作菜单项列表 */
  actions?: MenuAction[];
  /** 按钮变体：primary（蓝） | secondary（紫） | neutral（灰） */
  variant?: 'primary' | 'purple' | 'neutral';
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
  variant: 'primary',
});

const emit = defineEmits<{
  (e: 'action', key: string): void;
  (e: 'toggle-theme'): void;
}>();

const expanded = ref<boolean>(false);
const containerRef = ref<HTMLElement | null>(null);

const iconMap: Record<string, typeof Settings> = {
  fullscreen: Maximize,
  theme: Sun,
};

/** 按钮背景色变体 */
const buttonClass = computed<string>(() => {
  const map: Record<NonNullable<Props['variant']>, string> = {
    neutral: 'bg-neutral-700 hover:bg-neutral-600',
    primary: 'bg-primary hover:bg-primary/90',
    purple: 'bg-purple-600 hover:bg-purple-500',
  };
  return map[props.variant];
});

/** 切换展开状态 */
function toggle(): void {
  expanded.value = !expanded.value;
}

/** 关闭菜单 */
function close(): void {
  expanded.value = false;
}

/** 点击操作项 */
function handleAction(key: string): void {
  if (key === 'theme') {
    emit('toggle-theme');
  } else {
    emit('action', key);
  }
  close();
}

/** 点击外部区域关闭菜单 */
onClickOutside(containerRef, () => {
  close();
});

/** ESC 关闭菜单 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    ref="containerRef"
    class="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3"
  >
    <!-- 操作菜单（从下往上展开） -->
    <div
      v-show="expanded"
      class="mb-2 flex w-56 flex-col gap-1 rounded-xl border border-border-subtle bg-surface-2 p-2 shadow-raised"
      role="menu"
    >
      <button
        v-for="action in actions"
        :key="action.key"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
        :class="action.danger ? 'text-destructive' : 'text-text-secondary'"
        role="menuitem"
        type="button"
        @click="handleAction(action.key)"
      >
        <component
          :is="action.icon ?? iconMap[action.key]"
          :size="16"
          class="shrink-0"
        />
        <span>{{ action.label }}</span>
      </button>

      <!-- 分隔线 + 主题切换 -->
      <div class="my-1 h-px bg-border-subtle" />
      <button
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-accent"
        role="menuitem"
        type="button"
        @click="handleAction('theme')"
      >
        <Sun
          :size="16"
          class="shrink-0 dark:hidden"
        />
        <Moon
          :size="16"
          class="hidden shrink-0 dark:block"
        />
        <span>切换主题</span>
      </button>
    </div>

    <!-- 悬浮按钮本体 -->
    <button
      :aria-label="expanded ? '收起设置菜单' : '展开设置菜单'"
      class="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      :class="cn(buttonClass, expanded && 'rotate-90')"
      type="button"
      @click="toggle"
    >
      <X
        v-if="expanded"
        :size="20"
      />
      <Settings
        v-else
        :size="20"
      />
    </button>
  </div>
</template>
