<!--
 * YdThemeScope —— 组件级暗色模式独立开关。
 *
 * <p>允许在页面局部区域强制使用 light/dark 模式，与全局主题解耦。
 * 适用于"暗色侧边栏中嵌入一个亮色卡片预览"等场景。
 *
 * <p>典型用法：
 * <pre>
 * &lt;YdThemeScope mode="dark"&gt;
 *   &lt;!-- 其子元素将在暗色模式下渲染 --&gt;
 *   &lt;YdCard&gt;...&lt;/YdCard&gt;
 * &lt;/YdThemeScope&gt;
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\theme\YdThemeScope.vue
 * @author ydsz-team
 * @since 26.09.17
-->
<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'inherit';

interface Props {
  /** 主题模式，默认 'inherit'（跟随全局） */
  mode?: ThemeMode;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'inherit',
});

const scopeRef = ref<HTMLElement | null>(null);
const isReady = ref(false);

/**
 * 应用主题模式到作用域元素。
 */
function applyScope(): void {
  if (!isReady.value || !scopeRef.value) return;
  const el = scopeRef.value;

  el.classList.remove('yd-theme-light', 'yd-theme-dark');

  if (props.mode === 'dark') {
    el.classList.add('dark', 'yd-theme-dark');
  } else if (props.mode === 'light') {
    el.classList.remove('dark');
    el.classList.add('yd-theme-light');
  }
  // 'inherit' —— 不强制，由全局 ThemeProvider 决定
}

watch(() => props.mode, applyScope);

onMounted(() => {
  isReady.value = true;
  applyScope();
});

/** 作用域外层 class */
const containerClass = computed(() => 'yd-theme-scope');
</script>

<template>
  <div ref="scopeRef" :class="containerClass">
    <slot />
  </div>
</template>
