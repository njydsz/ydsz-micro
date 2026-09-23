<!--
 * ThemeProvider —— 在 provide/inject 层暴露 useTheme 句柄。
 *
 * 设计目标：
 *  - 在应用根节点包裹一次，下游组件通过 `useThemeContext()` 获取操作入口；
 *  - 自动将当前主题状态 class（dark / light）同步到 document.documentElement；
 *  - 提供响应式 isDark ref，便于 UI 根据主题切换图标 / 文字；
 *  - 可选侦测系统 prefers-color-scheme；
 *  - 支持 density 档位切换（default / compact / loose）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\theme\ThemeProvider.vue
 * @author ydsz-team
 * @since 5.6.0
-->
<script lang="ts">
/** ThemeProvider 注入 key */
import type { InjectionKey } from 'vue';

import type { ThemeHandle } from './use-theme';

export const THEME_INJECTION_KEY: InjectionKey<ThemeHandle> = Symbol('ydsz-theme');
</script>

<script lang="ts" setup="setup>
import { onBeforeUnmount, onMounted, provide, ref } from 'vue';

import { useTheme } from './use-theme';

const props = withDefaults(
  defineProps<{
    /** 预设主题名：light | dark | compact | loose */
    preset?: string;
    /** 密度档位：default | compact | loose */
    density?: 'default' | 'compact' | 'loose';
    /** 是否监听系统 prefers-color-scheme */
    autoDetect?: boolean;
  }>(),
  {
    autoDetect: true,
    density: 'default',
    preset: 'light',
  },
);

const themeHandle = useTheme({
  density: props.density,
  initialPreset: props.preset,
});

/** 响应式 isDark：同步 document.documentElement 上的 dark class */
const isDark = ref(
  globalThis.document?.documentElement?.classList.contains('dark') ?? false,
);

/** 监听系统 dark 模式媒体查询 */
let mediaQuery: MediaQueryList | null = null;

function handleSystemThemeChange(event: MediaQueryListEvent): void {
  isDark.value = event.matches;
  themeHandle.toggleDark(event.matches);
}

onMounted(() => {
  if (props.autoDetect && globalThis.window?.matchMedia) {
    mediaQuery = globalThis.window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    isDark.value = mediaQuery.matches;
  }
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', handleSystemThemeChange);
});

provide(THEME_INJECTION_KEY, themeHandle);
</script>

<template>
  <div
    :data-density="props.density"
    :data-theme="isDark ? 'dark' : 'light'"
    class="contents"
  >
    <slot
      :density="props.density"
      :is-dark="isDark"
      :theme="themeHandle"
    />
  </div>
</template>
