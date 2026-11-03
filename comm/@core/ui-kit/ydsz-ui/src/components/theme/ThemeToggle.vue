<!--
 * 主题切换器：在亮色 / 暗色模式之间切换，带太阳/月亮图标动画。
 *
 * 持久化用户选择到 localStorage('ydsz-theme')，初始化时优先读取本地存储；
 * 无存储偏好时回退 prefers-color-scheme 系统设置。
 * 切换操作通过 documentElement.classList.toggle('dark') 驱动 CSS 变量方案，
 * 与 Tailwind darkMode: 'selector' 策略一致。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/components/theme/ThemeToggle.vue
 * @author ydsz-team
 * @since 26.10.16
 -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { Moon, Sun } from 'lucide-vue-next';

/** localStorage 键名 */
const THEME_STORAGE_KEY = 'ydsz-theme';

/** 主题模式 */
type ThemeMode = 'light' | 'dark';

/** 当前暗色状态（响应式） */
const isDark = ref<boolean>(false);

/** 是否已初始化（防闪烁） */
const initialized = ref(false);

/**
 * 读取系统暗色偏好。
 */
function getSystemDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * 读取持久化的主题偏好。
 */
function getStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage 不可用时静默降级
  }
  return null;
}

/**
 * 将暗色状态应用到 DOM。
 */
function applyToDom(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.themeDark = String(dark);
}

/**
 * 持久化主题偏好。
 */
function persistTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // 隐私模式下可能抛错，静默忽略
  }
}

/**
 * 切换到指定模式。
 */
function setTheme(mode: ThemeMode): void {
  isDark.value = mode === 'dark';
  applyToDom(isDark.value);
  persistTheme(mode);
}

/**
 * 在亮色 / 暗色之间切换。
 */
function toggleTheme(): void {
  setTheme(isDark.value ? 'light' : 'dark');
}

/** 按钮 aria-label */
const ariaLabel = computed(() => isDark.value ? '切换到亮色模式' : '切换到暗色模式');

// 初始化主题偏好 + 系统监听
onMounted(() => {
  // 优先读取本地存储，次之回退系统偏好
  const stored = getStoredTheme();
  const initialDark = stored === 'dark' || (stored === null && getSystemDark());

  isDark.value = initialDark;
  applyToDom(initialDark);
  initialized.value = true;

  // 监听系统主题变化（仅在未手动设置偏好时跟随）
  if (window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', (e) => {
      if (getStoredTheme() === null) {
        isDark.value = e.matches;
        applyToDom(e.matches);
      }
    });
  }
});
</script>

<template>
  <button
    :aria-label="ariaLabel"
    :aria-pressed="isDark"
    :class="
      cn(
        'relative inline-flex size-9 items-center justify-center rounded-md border border-border',
        'bg-background text-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'transition-all duration-200',
      )
    "
    :title="ariaLabel"
    type="button"
    @click="toggleTheme"
  >
    <!-- 太阳 → 亮色（暗色模式下显示，点击可切回亮色） -->
    <Sun
      :class="
        cn(
          'size-4 transition-all duration-300',
          isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0',
        )
      "
    />
    <!-- 月亮 → 暗色（亮色模式下显示，点击可切到暗色） -->
    <Moon
      :class="
        cn(
          'absolute size-4 transition-all duration-300',
          isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100',
        )
      "
    />
  </button>
</template>
