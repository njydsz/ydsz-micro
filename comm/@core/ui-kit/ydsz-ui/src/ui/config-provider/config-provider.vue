<!--
 * ConfigProvider（config-provider）组件：应用级主题容器。
 *
 * <p>通过 {@link useTheme} 单例将 theme prop 写入
 * <code>document.documentElement.dataset.theme</code>，
 * 配合 variables.css 中的 <code>:root[data-theme='dark']</code> 覆盖，
 * 实现全局暗色切换。
 *
 * <p>使用方式：
 * <pre>{@code
 * <yd-config-provider theme="auto">
 *   <!-- 子组件将自动响应 data-theme 切换 -->
 *   <yd-button>主题感知</yd-button>
 * </yd-config-provider>
 * }</pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\config-provider.vue
 * @author ydsz-team
 * @since 26.09.24
 -->
<script setup lang="ts">
import { watch } from 'vue';

import type { ConfigProviderEmits, ConfigProviderProps } from './config-provider-types';

import { useTheme } from '../../composables/use-theme';

defineOptions({ name: 'YdConfigProvider' });

const props = withDefaults(defineProps<ConfigProviderProps>(), {
  disabled: false,
  open: false,
  theme: 'auto',
});

const emit = defineEmits<ConfigProviderEmits>();

/** 复用全局单例，确保应用各处主题状态一致 */
const { theme, setTheme } = useTheme();

/** 当 prop 变化时同步到 useTheme 单例，自动写入 data-theme 属性 */
watch(
  () => props.theme,
  (next) => {
    if (next && theme.value !== next) {
      setTheme(next);
      emit('theme-change', next);
    }
  },
  { immediate: true },
);

function handleConfirm() {
  emit('confirm');
  emit('update:open', false);
}

function handleCancel() {
  emit('cancel');
  emit('update:open', false);
}
</script>

<template>
  <div :class="['yd-config-provider', { 'yd-config-provider--disabled': disabled }]">
    <slot />
  </div>
</template>

<style scoped>
/* ==================== 容器 ==================== */
.yd-config-provider {
  width: 100%;
  min-height: 100%;
  background-color: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));
  transition:
    background-color var(--ydsz-motion-duration-normal) var(--ydsz-motion-easing-standard),
    color var(--ydsz-motion-duration-normal) var(--ydsz-motion-easing-standard);
}

/* ==================== 禁用态 ==================== */
.yd-config-provider--disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
