/**
 * YdThemeEditor —— 可视化主题编辑器。
 *
 * 实时预览并编辑 design token（主色 / 圆角 / 阴影 / 字号 / 动效），
 * 一键导出为 CSS 自定义属性字符串或 JSON。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\theme-editor\YdThemeEditor.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script lang="ts" setup>
import { ref, watch } from 'vue';

import { getTheme } from '../../primitives/theme/use-theme';

import type { TokenName } from '../../primitives/theme/theme-schema';

import { themeTokens } from '../../primitives/theme/theme-schema';

/** 可编辑 token 分类 */
const EDITABLE_TOKENS: Array<{ name: TokenName; label: string; category: string }> = [
  { category: 'color', label: '主色', name: 'primary' },
  { category: 'color', label: '危险色', name: 'destructive' },
  { category: 'color', label: '成功色', name: 'success' },
  { category: 'color', label: '背景色', name: 'background' },
  { category: 'color', label: '文字色', name: 'foreground' },
  { category: 'size', label: '基础圆角', name: 'radius' },
  { category: 'typography', label: '正文字号', name: 'text-14' },
  { category: 'shadow', label: '低阴影', name: 'shadow-raised-100' },
];

const theme = getTheme();

/** 本地覆盖值 */
const overrides = ref<Partial<Record<TokenName, string>>>({});

/** 导出格式 */
const exportFormat = ref<'css' | 'json'>('css');

/**
 * 应用 token 覆盖。
 */
function setToken(name: TokenName, value: string): void {
  overrides.value[name] = value;
  theme.set(name, value);
}

/**
 * 重置所有覆盖。
 */
function resetAll(): void {
  overrides.value = {};
  theme.reset();
}

/**
 * 生成导出字符串。
 */
function generateExport(): string {
  if (exportFormat.value === 'json') {
    return JSON.stringify(overrides.value, null, 2);
  }
  // CSS 格式
  const lines = Object.entries(overrides.value).map(([name, value]) => {
    const def = themeTokens[name as TokenName]; // cast for Object.entries key widening
    const cssVar = def?.cssVar ?? name;
    return `  --${cssVar}: ${value};`;
  });
  return `:root {\n${lines.join('\n')}\n}`;
}

/** 当前导出内容 */
const exportContent = ref('');

watch([overrides, exportFormat], () => {
  exportContent.value = generateExport();
}, { deep: true, immediate: true });
</script>

<template>
  <div class="space-y-4 p-4">
    <h3 class="text-lg font-medium">主题编辑器</h3>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div
        v-for="token in EDITABLE_TOKENS"
        :key="token.name"
        class="flex items-center justify-between gap-2"
      >
        <label class="text-sm text-muted-foreground">{{ token.label }}</label>
        <input
          :value="overrides[token.name] ?? themeTokens[token.name]?.defaultValue ?? ''"
          class="h-8 w-32 rounded border px-2 text-sm"
          type="text"
          @input="setToken(token.name, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
    <div class="flex gap-2">
      <button
        class="rounded bg-destructive px-3 py-1.5 text-sm text-white"
        type="button"
        @click="resetAll"
      >
        重置
      </button>
      <select
        v-model="exportFormat"
        class="rounded border px-2 py-1 text-sm"
      >
        <option value="css">CSS</option>
        <option value="json">JSON</option>
      </select>
    </div>
    <pre class="max-h-40 overflow-auto rounded bg-muted/30 p-2 text-xs">{{ exportContent }}</pre>
  </div>
</template>
