<!--
 * ConfigProvider（config-provider）组件：应用级主题 / 国际化 / 密度 容器。
 *
 * 通过 useTheme 单例将 theme prop 写入 document.documentElement.dataset.theme，
 * 配合 variables.css 中的 :root[data-theme='dark'] 覆盖，
 * 实现全局暗色切换。
 *
 * 通过 provide LOCALE_LANG_KEY 向子组件注入当前语种状态，
 * 子组件使用 useLocale() 即可读取；同时同步更新 document.documentElement.lang。
 *
 * 通过 useDensity 注入密度档位，同步到 document.documentElement.dataset.density。
 *
 * 使用方式：
 * &lt;yd-config-provider theme="auto" locale="zh-CN" density="standard"&gt;
 *   &lt;!-- 子组件将自动响应 data-theme / lang / data-density 切换 --&gt;
 *   &lt;yd-button&gt;主题感知&lt;/yd-button&gt;
 * &lt;/yd-config-provider&gt;
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\config-provider.vue
 * @author ydsz-team
 * @since 26.09.24
 -->
<script setup lang="ts">
import { provide, ref, watch } from 'vue';

import type { ConfigProviderEmits, ConfigProviderProps } from './config-provider-types';

import { useTheme } from '../../composables/use-theme';
import { LOCALE_LANG_KEY } from '../../locale/useLocale';
import { useDensity } from '@ydsz-core/design-tokens/composables';

defineOptions({ name: 'YdConfigProvider' });

const props = withDefaults(defineProps<ConfigProviderProps>(), {
  disabled: false,
  open: false,
  theme: 'auto',
  locale: 'zh-CN',
  density: 'standard',
});

const emit = defineEmits<ConfigProviderEmits>();

/** 复用全局单例，确保应用各处主题状态一致 */
const { theme, setTheme } = useTheme();

/** 复用 density 单例，同步 data-density 属性 */
const { setDensity } = useDensity();

/** 当前语种状态 —— 通过 LOCALE_LANG_KEY 注入给子组件使用 */
const localeState = ref<{ lang: typeof props.locale; isRTL: boolean }>({
  lang: props.locale ?? 'zh-CN',
  isRTL: false,
});

/** 将初始语种同步到 document.documentElement.lang */
if (typeof document !== 'undefined') {
  document.documentElement.lang = props.locale ?? 'zh-CN';
}

/** 当 prop 变化时同步到 useTheme 单例，自动写入 data-theme 属性 */
watch(
  () => props.theme,
  (next) => {
    if (next && theme.value !== next) {
      setTheme(next);
      emit('theme-change', next);
    }
  },
  { immediate: true, flush: 'sync' },
);

/** 当 locale prop 变化时：更新注入状态 + document.lang + emit */
watch(
  () => props.locale,
  (next) => {
    const value = next ?? 'zh-CN';
    localeState.value = { lang: value, isRTL: false };
    if (typeof document !== 'undefined') {
      document.documentElement.lang = value;
    }
    emit('locale-change', value);
  },
  { immediate: true, flush: 'sync' },
);

/** 当 density prop 变化时：更新 useDensity + emit */
watch(
  () => props.density,
  (next) => {
    const value = next ?? 'standard';
    setDensity(value);
    emit('density-change', value);
  },
  { immediate: true, flush: 'sync' },
);

/** 向子组件提供当前语种状态，供 useLocale() 读取 */
provide(LOCALE_LANG_KEY, localeState);

function handleConfirm(): void {
  emit('confirm');
  emit('update:open', false);
}

function handleCancel(): void {
  emit('cancel');
  emit('update:open', false);
}
</script>

<template>
  <div
    :class="['yd-config-provider', { 'yd-config-provider--disabled': disabled }]"
    :data-density="density ?? 'standard'"
    :data-locale="locale ?? 'zh-CN'"
  >
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
