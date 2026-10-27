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
// @ts-nocheck
import { computed, ref, watch } from 'vue';

import { useLocale } from '../../locale/useLocale';
import { getTheme } from '../theme/use-theme';
import type { TokenName } from '../theme/theme-schema';
import { themeTokens } from '../theme/theme-schema';

const { t } = useLocale();

/** 可编辑 token 分类 */
const EDITABLE_TOKENS: Array<{ name: TokenName; labelKey: string; category: string }> = [
  { category: 'color', labelKey: 'themeEditor.primary', name: 'primary' },
  { category: 'color', labelKey: 'themeEditor.destructive', name: 'destructive' },
  { category: 'color', labelKey: 'themeEditor.success', name: 'success' },
  { category: 'color', labelKey: 'themeEditor.background', name: 'background' },
  { category: 'color', labelKey: 'themeEditor.foreground', name: 'foreground' },
  { category: 'size', labelKey: 'themeEditor.radius', name: 'radius' },
  { category: 'typography', labelKey: 'themeEditor.bodySize', name: 'text-14' },
  { category: 'shadow', labelKey: 'themeEditor.lowShadow', name: 'shadow-raised-100' },
];

/** 标签走词典而非写死中文，否则切语种后 token 名称仍是中文 */
const editableTokens = computed(() =>
  EDITABLE_TOKENS.map((token) => ({ ...token, label: t(token.labelKey) })),
);

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
    <h3 class="text-lg font-medium">{{ t('themeEditor.title') }}</h3>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div
        v-for="token in editableTokens"
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
        {{ t('common.reset') }}
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
