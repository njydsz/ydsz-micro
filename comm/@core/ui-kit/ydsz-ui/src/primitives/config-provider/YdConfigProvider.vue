<!--
 * YdConfigProvider —— 全局配置容器，对外暴露 theme / size / locale / prefixCls / 渲染空状态等上下文。
 *
 * 设计目标：
 *  - 在应用根节点包裹一次，下游组件通过 `useConfigProvider()` 获取统一配置；
 *  - 内嵌 useTheme 桥接：将 size / theme 偏好映射到运行时主题句柄，
 *    让组件级样式与运行时主题联动；
 *  - 响应式切换：size / locale / prefixCls / isDisabled 变更后自动 propagate。
 *
 * 输入契约：
 *  - `config` 对象：包含 size / theme / locale / prefixCls / isDisabled / renderEmpty / wave。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\YdConfigProvider.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts">
/**
 * 配置上下文注入 key（常规 script 块，供 index.ts 直接 re-export）。
 */
import type { InjectionKey } from 'vue';

import type { ConfigContext } from './types';

/** YdConfigProvider 注入 key */
export const CONFIG_INJECTION_KEY: InjectionKey<ConfigContext> = Symbol('ydsz-config');
</script>

<script lang="ts" setup>
import { computed, provide } from 'vue';

import { THEME_INJECTION_KEY } from '../theme/ThemeProvider.vue';
import { useTheme } from '../theme/use-theme';

import type { ThemeHandle } from '../theme/use-theme';

import type { ConfigContext } from './types';

const props = withDefaults(
  defineProps<{
    config?: ConfigContext;
  }>(),
  {
    config: () => ({}),
  },
);

/** 深层合并：运行时根据 config 动态计算主题可响应切换 */
const resolvedConfig = computed<ConfigContext>(() => ({
  density: props.config.density ?? 'default',
  isDisabled: props.config.isDisabled ?? false,
  locale: props.config.locale ?? {},
  prefixCls: props.config.prefixCls ?? 'yd',
  renderEmpty: props.config.renderEmpty,
  size: props.config.size ?? 'default',
  theme: props.config.theme ?? { mode: 'auto', preset: 'light' },
  wave: props.config.wave ?? { isDisabled: false },
}));

/** 桥接到 useTheme：把 config.theme 映射为运行时主题句柄 */
const themeHandle: ThemeHandle = useTheme({
  initialPreset: resolvedConfig.value.theme?.preset ?? 'light',
});

// 同步主题到 document（SSR 安全：document 不存在时跳过）
if (typeof document !== 'undefined') {
  const mode = resolvedConfig.value.theme?.mode ?? 'auto';
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.classList.remove('dark');
  }
  // 'auto' 模式由 useTheme / ThemeProvider 的 prefers-color-scheme 负责
}

/** 暴露主题句柄给子组件 */
provide(THEME_INJECTION_KEY, themeHandle);
/** 暴露完整配置上下文 */
provide(CONFIG_INJECTION_KEY, resolvedConfig.value);
</script>

<template>
  <div
    :class="[
      `${resolvedConfig.prefixCls}-config-provider`,
      {
        'yd-density-compact': resolvedConfig.density === 'compact',
        'yd-density-loose': resolvedConfig.density === 'loose',
        'yd-size-sm': resolvedConfig.size === 'small',
        'yd-size-lg': resolvedConfig.size === 'large',
        'yd-disabled': resolvedConfig.isDisabled,
      },
    ]"
    :data-density="resolvedConfig.density"
    :data-size="resolvedConfig.size"
  >
    <slot
      :config="resolvedConfig"
      :theme="themeHandle"
    />
  </div>
</template>
