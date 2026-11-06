<script setup lang="ts">
/**
 * YDSZ UI Playground —— 组件目录 + 实时 Props 调试。
 *
 * <p>提供：
 *  - 左侧组件目录（按分类分组）；
 *  - 右侧实时预览（JSON props 驱动）；
 *  - Props 编辑器（JSON 输入，实时应用）；
 *  - 代码片段生成（复制即用）；
 *  - 主题切换（light/dark/auto）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\playground\App.vue
 * @author ydsz-team
 * @since 26.11.06
 */
import { computed, h, ref } from 'vue';

import { YdButton } from '../src/components/button';
import { YdInput } from '../src/components/input';
import { YdSelect } from '../src/components/select';
import { YdCheckbox } from '../src/components/checkbox';
import { YdSwitch } from '../src/components/switch';
import { YdSlider } from '../src/components/slider';
import { YdBadge } from '../src/components/badge';
import { YdTag } from '../src/components/tag';
import { YdProgress } from '../src/components/progress';
import { YdTooltip } from '../src/components/tooltip';
import { YdAvatar } from '../src/components/avatar';
import { YdAlert } from '../src/components/alert';
import { YdTabs } from '../src/components/tabs';
import { YdCard } from '../src/components/card';
import { YdDivider } from '../src/components/divider';
import { YdConfigProvider } from '../src/components/config-provider';

/** 组件目录项 */
interface ComponentEntry {
  /** 组件名 */
  name: string;
  /** 分类 */
  category: string;
  /** 默认 props（JSON 字符串） */
  defaultProps: string;
  /** 渲染函数 */
  render: (props: Record<string, unknown>) => unknown;
}

/** 组件目录 */
const COMPONENTS: ComponentEntry[] = [
  {
    category: '通用',
    defaultProps: JSON.stringify({ children: '按钮文本' }, null, 2),
    name: 'YdButton',
    render: (props) => h(YdButton, props),
  },
  {
    category: '表单',
    defaultProps: JSON.stringify({ placeholder: '请输入' }, null, 2),
    name: 'YdInput',
    render: (props) => h(YdInput, props),
  },
  {
    category: '表单',
    defaultProps: JSON.stringify(
      {
        multiple: false,
        options: [
          { label: '选项 A', value: 'a' },
          { label: '选项 B', value: 'b' },
        ],
      },
      null,
      2,
    ),
    name: 'YdSelect',
    render: (props) => h(YdSelect, props),
  },
  {
    category: '表单',
    defaultProps: JSON.stringify({ children: '复选框' }, null, 2),
    name: 'YdCheckbox',
    render: (props) => h(YdCheckbox, props),
  },
  {
    category: '表单',
    defaultProps: JSON.stringify({ modelValue: true }, null, 2),
    name: 'YdSwitch',
    render: (props) => h(YdSwitch, props),
  },
  {
    category: '表单',
    defaultProps: JSON.stringify({ modelValue: 50 }, null, 2),
    name: 'YdSlider',
    render: (props) => h(YdSlider, props),
  },
  {
    category: '数据展示',
    defaultProps: JSON.stringify({ children: '徽章' }, null, 2),
    name: 'YdBadge',
    render: (props) => h(YdBadge, props),
  },
  {
    category: '数据展示',
    defaultProps: JSON.stringify({ children: '标签' }, null, 2),
    name: 'YdTag',
    render: (props) => h(YdTag, props),
  },
  {
    category: '数据展示',
    defaultProps: JSON.stringify({ value: 60 }, null, 2),
    name: 'YdProgress',
    render: (props) => h(YdProgress, props),
  },
  {
    category: '数据展示',
    defaultProps: JSON.stringify({ src: 'https://i.pravatar.cc/150?img=1', alt: '头像' }, null, 2),
    name: 'YdAvatar',
    render: (props) => h(YdAvatar, props),
  },
  {
    category: '反馈',
    defaultProps: JSON.stringify({ children: '提示内容', type: 'info' }, null, 2),
    name: 'YdAlert',
    render: (props) => h(YdAlert, props),
  },
  {
    category: '反馈',
    defaultProps: JSON.stringify({ content: '提示文本' }, null, 2),
    name: 'YdTooltip',
    render: (props) => h(YdTooltip, props),
  },
  {
    category: '导航',
    defaultProps: JSON.stringify(
      {
        items: [
          { key: '1', label: '标签一' },
          { key: '2', label: '标签二' },
        ],
        modelValue: '1',
      },
      null,
      2,
    ),
    name: 'YdTabs',
    render: (props) => h(YdTabs, props),
  },
  {
    category: '布局',
    defaultProps: JSON.stringify({ children: '卡片内容', title: '卡片标题' }, null, 2),
    name: 'YdCard',
    render: (props) => h(YdCard, props),
  },
  {
    category: '布局',
    defaultProps: JSON.stringify({ orientation: 'horizontal' }, null, 2),
    name: 'YdDivider',
    render: (props) => h(YdDivider, props),
  },
];

/** 当前选中组件 */
const activeName = ref(COMPONENTS[0]!.name);

/** 当前组件 */
const activeComponent = computed(
  () => COMPONENTS.find((c) => c.name === activeName.value) ?? COMPONENTS[0]!,
);

/** Props 编辑文本 */
const propsText = ref(activeComponent.value.defaultProps);

/** Props 解析错误 */
const propsError = ref('');

/** 解析后的 props */
const parsedProps = computed<Record<string, unknown>>(() => {
  try {
    return JSON.parse(propsText.value) as Record<string, unknown>;
  } catch (e) {
    propsError.value = (e as Error).message;
    return {};
  }
});

/** 切换组件 */
function selectComponent(name: string): void {
  activeName.value = name;
  const comp = COMPONENTS.find((c) => c.name === name);
  if (comp) {
    propsText.value = comp.defaultProps;
    propsError.value = '';
  }
}

/** 代码片段 */
const codeSnippet = computed(() => {
  const propsStr = Object.entries(parsedProps.value)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join(',\n');
  return `<${activeComponent.value.name}\n${propsStr}\n/>`;
});

/** 复制代码 */
async function copyCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(codeSnippet.value);
  } catch {
    // 剪贴板 API 不可用时静默
  }
}

/** 主题 */
const theme = ref<'light' | 'dark' | 'auto'>('auto');

/** 视图模式：组件 / 主题设计器 */
const viewMode = ref<'components' | 'theme'>('components');

/** 分类列表 */
const categories = computed(() => {
  const map = new Map<string, ComponentEntry[]>();
  COMPONENTS.forEach((c) => {
    const list = map.get(c.category) ?? [];
    list.push(c);
    map.set(c.category, list);
  });
  return [...map.entries()];
});

/* ============================================================ */
/* 主题设计器                                                    */
/* ============================================================ */

/** 可编辑的语义 token（HSL 三元组） */
const EDITABLE_TOKENS = [
  { description: '主色（按钮/链接/选中态）', key: 'primary', label: '主色' },
  { description: '主色悬停态', key: 'primary-hover', label: '主色悬停' },
  { description: '次要色（次要按钮/标签）', key: 'secondary', label: '次要色' },
  { description: '强调色（高亮/聚焦环）', key: 'accent', label: '强调色' },
  { description: '信息色', key: 'info', label: '信息色' },
  { description: '成功色', key: 'success', label: '成功色' },
  { description: '警告色', key: 'warning', label: '警告色' },
  { description: '危险色（删除/错误）', key: 'destructive', label: '危险色' },
] as const;

/** 当前编辑的 token 值（HSL 字符串） */
const tokenEdits = ref<Record<string, string>>({});

/** 应用 token 到 CSS 变量 */
function applyToken(key: string, value: string): void {
  const cssVar = `--ydsz-color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  document.documentElement.style.setProperty(cssVar, value);
}

/** 重置 token */
function resetTokens(): void {
  EDITABLE_TOKENS.forEach((t) => {
    document.documentElement.style.removeProperty(
      `--ydsz-color-${t.key.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
    );
  });
  tokenEdits.value = {};
}

/** 导出的 CSS */
const exportedCss = computed(() => {
  const lines = EDITABLE_TOKENS.filter((t) => tokenEdits.value[t.key]).map((t) => {
    const cssVar = `--ydsz-color-${t.key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    return `  ${cssVar}: ${tokenEdits.value[t.key]};`;
  });
  return `:root {\n${lines.join('\n')}\n}`;
});

/** 复制主题 CSS */
async function copyThemeCss(): Promise<void> {
  try {
    await navigator.clipboard.writeText(exportedCss.value);
  } catch {
    // 剪贴板 API 不可用时静默
  }
}
</script>

<template>
  <YdConfigProvider :theme="theme" locale="zh-CN" density="standard">
    <main class="pg" aria-label="YDSZ UI Playground">
      <!-- 顶栏 -->
      <header class="pg__header">
        <h1 class="pg__title">YDSZ UI Playground</h1>
        <div class="pg__actions">
          <div class="pg__tabs" role="tablist" aria-label="视图切换">
            <button
              type="button"
              role="tab"
              :aria-selected="viewMode === 'components'"
              class="pg__tab"
              :class="{ 'pg__tab--active': viewMode === 'components' }"
              @click="viewMode = 'components'"
            >
              组件
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="viewMode === 'theme'"
              class="pg__tab"
              :class="{ 'pg__tab--active': viewMode === 'theme' }"
              @click="viewMode = 'theme'"
            >
              主题设计器
            </button>
          </div>
          <select v-model="theme" class="pg__select" aria-label="主题切换">
            <option value="auto">自动</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
      </header>

      <!-- 主题设计器视图 -->
      <div v-if="viewMode === 'theme'" class="pg__theme">
        <section class="pg__theme-panel" aria-labelledby="theme-editor-title">
          <h2 id="theme-editor-title" class="pg__section-title">语义 Token 编辑</h2>
          <p class="pg__theme-hint">
            编辑 HSL 三元组（如 <code>222.2 47.4% 11.2%</code>），实时应用到预览区。
          </p>
          <div class="pg__token-grid">
            <div v-for="token in EDITABLE_TOKENS" :key="token.key" class="pg__token">
              <label :for="`token-${token.key}`" class="pg__token-label">
                {{ token.label }}
              </label>
              <input
                :id="`token-${token.key}`"
                :value="tokenEdits[token.key] ?? ''"
                class="pg__token-input"
                placeholder="HSL 三元组"
                @input="
                  tokenEdits[token.key] = ($event.target as HTMLInputElement).value;
                  applyToken(token.key, ($event.target as HTMLInputElement).value);
                "
              />
              <span class="pg__token-desc">{{ token.description }}</span>
            </div>
          </div>
          <div class="pg__theme-actions">
            <YdButton variant="outline" @click="resetTokens">重置</YdButton>
            <YdButton variant="default" @click="copyThemeCss">复制 CSS</YdButton>
          </div>
        </section>

        <section class="pg__theme-preview" aria-labelledby="theme-preview-title">
          <h2 id="theme-preview-title" class="pg__section-title">实时预览</h2>
          <div class="pg__preview pg__preview--theme">
            <YdButton variant="default">主要按钮</YdButton>
            <YdButton variant="secondary">次要按钮</YdButton>
            <YdButton variant="destructive">危险按钮</YdButton>
            <YdBadge variant="default">徽章</YdBadge>
            <YdProgress :value="60" />
          </div>
          <h3 class="pg__section-subtitle">导出 CSS</h3>
          <pre
            class="pg__code"
          ><code>{{ exportedCss || '（编辑 token 后此处显示 CSS）' }}</code></pre>
        </section>
      </div>

      <!-- 组件视图 -->
      <div v-else class="pg__body">
        <!-- 左侧组件目录 -->
        <nav class="pg__nav" aria-label="组件目录">
          <div v-for="[category, items] in categories" :key="category" class="pg__group">
            <h2 class="pg__group-title">{{ category }}</h2>
            <button
              v-for="item in items"
              :key="item.name"
              type="button"
              class="pg__item"
              :class="{ 'pg__item--active': item.name === activeName }"
              @click="selectComponent(item.name)"
            >
              {{ item.name }}
            </button>
          </div>
        </nav>

        <!-- 右侧预览 + 编辑 -->
        <section class="pg__main">
          <!-- 预览区 -->
          <div class="pg__preview" aria-live="polite">
            <component :is="activeComponent.render(parsedProps)" />
          </div>

          <!-- Props 编辑 -->
          <div class="pg__editor">
            <div class="pg__editor-header">
              <span class="pg__editor-title">Props</span>
              <button type="button" class="pg__copy" @click="copyCode">复制代码</button>
            </div>
            <textarea
              v-model="propsText"
              class="pg__textarea"
              aria-label="Props JSON 编辑器"
              spellcheck="false"
            />
            <p v-if="propsError" class="pg__error" role="alert">{{ propsError }}</p>
          </div>

          <!-- 代码片段 -->
          <pre class="pg__code"><code>{{ codeSnippet }}</code></pre>
        </section>
      </div>
    </main>
  </YdConfigProvider>
</template>

<style scoped>
.pg {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: var(--ydsz-spacing-lg, 24px);
  font-family: var(--ydsz-font-family, 'YDSZ Sans', system-ui, sans-serif);
  color: hsl(var(--ydsz-text-primary));
  background-color: hsl(var(--ydsz-surface-1));
}

.pg__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ydsz-spacing-lg, 24px);
  padding-bottom: var(--ydsz-spacing-md, 16px);
  border-bottom: 1px solid hsl(var(--ydsz-border-default));
}

.pg__title {
  margin: 0;
  font-size: var(--ydsz-font-size-2xl, 1.5rem);
  font-weight: var(--ydsz-font-weight-bold, 700);
}

.pg__select {
  padding: 6px 12px;
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: 6px;
  background: hsl(var(--ydsz-surface-2));
  color: hsl(var(--ydsz-text-primary));
}

.pg__body {
  display: grid;
  gap: var(--ydsz-spacing-lg, 24px);
  grid-template-columns: 220px 1fr;
  flex: 1;
}

.pg__nav {
  display: flex;
  flex-direction: column;
  gap: var(--ydsz-spacing-md, 16px);
}

.pg__group-title {
  margin: 0 0 var(--ydsz-spacing-xs, 4px);
  font-size: var(--ydsz-font-size-xs, 0.75rem);
  font-weight: var(--ydsz-font-weight-semibold, 600);
  color: hsl(var(--ydsz-text-tertiary));
  text-transform: uppercase;
}

.pg__item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: hsl(var(--ydsz-text-secondary));
  cursor: pointer;
  font-size: var(--ydsz-font-size-sm, 0.875rem);
  text-align: left;
}

.pg__item:hover {
  background: hsl(var(--ydsz-surface-2));
}

.pg__item--active {
  background: hsl(var(--ydsz-primary) / 10%);
  color: hsl(var(--ydsz-primary));
  font-weight: var(--ydsz-font-weight-medium, 500);
}

.pg__main {
  display: flex;
  flex-direction: column;
  gap: var(--ydsz-spacing-md, 16px);
}

.pg__preview {
  min-height: 200px;
  padding: var(--ydsz-spacing-lg, 24px);
  border: 1px dashed hsl(var(--ydsz-border-default));
  border-radius: 8px;
  background: hsl(var(--ydsz-surface-2));
}

.pg__editor {
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: 8px;
  overflow: hidden;
}

.pg__editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: hsl(var(--ydsz-surface-2));
  border-bottom: 1px solid hsl(var(--ydsz-border-default));
}

.pg__editor-title {
  font-size: var(--ydsz-font-size-xs, 0.75rem);
  font-weight: var(--ydsz-font-weight-medium, 500);
  color: hsl(var(--ydsz-text-tertiary));
}

.pg__copy {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: hsl(var(--ydsz-primary) / 10%);
  color: hsl(var(--ydsz-primary));
  cursor: pointer;
  font-size: var(--ydsz-font-size-xs, 0.75rem);
}

.pg__textarea {
  width: 100%;
  min-height: 160px;
  padding: 12px;
  border: none;
  background: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));
  font-family: var(--ydsz-font-mono, 'Fira Code', monospace);
  font-size: var(--ydsz-font-size-sm, 0.875rem);
  resize: vertical;
}

.pg__error {
  margin: 0;
  padding: 8px 12px;
  color: hsl(var(--ydsz-error, #ef4444));
  font-size: var(--ydsz-font-size-xs, 0.75rem);
  background: hsl(var(--ydsz-error, #ef4444) / 5%);
}

.pg__code {
  margin: 0;
  padding: 12px;
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: 8px;
  background: hsl(var(--ydsz-surface-2));
  color: hsl(var(--ydsz-text-secondary));
  font-family: var(--ydsz-font-mono, 'Fira Code', monospace);
  font-size: var(--ydsz-font-size-xs, 0.75rem);
  overflow-x: auto;
}

/* ==================== 视图切换 ==================== */
.pg__tabs {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 6px;
  background: hsl(var(--ydsz-surface-2));
}

.pg__tab {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: hsl(var(--ydsz-text-secondary));
  cursor: pointer;
  font-size: var(--ydsz-font-size-sm, 0.875rem);
}

.pg__tab--active {
  background: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));
  font-weight: var(--ydsz-font-weight-medium, 500);
  box-shadow: 0 1px 2px rgb(0 0 0 / 5%);
}

/* ==================== 主题设计器 ==================== */
.pg__theme {
  display: grid;
  gap: var(--ydsz-spacing-lg, 24px);
  grid-template-columns: 1fr 1fr;
  flex: 1;
}

.pg__theme-panel,
.pg__theme-preview {
  padding: var(--ydsz-spacing-md, 16px);
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: 8px;
  background: hsl(var(--ydsz-surface-2));
}

.pg__theme-hint {
  margin: 0 0 var(--ydsz-spacing-md, 16px);
  font-size: var(--ydsz-font-size-xs, 0.75rem);
  color: hsl(var(--ydsz-text-tertiary));
}

.pg__theme-hint code {
  padding: 1px 4px;
  border-radius: 3px;
  background: hsl(var(--ydsz-surface-1));
  font-family: var(--ydsz-font-mono, 'Fira Code', monospace);
}

.pg__token-grid {
  display: flex;
  flex-direction: column;
  gap: var(--ydsz-spacing-sm, 8px);
}

.pg__token {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pg__token-label {
  font-size: var(--ydsz-font-size-sm, 0.875rem);
  font-weight: var(--ydsz-font-weight-medium, 500);
  color: hsl(var(--ydsz-text-primary));
}

.pg__token-input {
  padding: 6px 10px;
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: 6px;
  background: hsl(var(--ydsz-surface-1));
  color: hsl(var(--ydsz-text-primary));
  font-family: var(--ydsz-font-mono, 'Fira Code', monospace);
  font-size: var(--ydsz-font-size-sm, 0.875rem);
}

.pg__token-input:focus {
  outline: 2px solid hsl(var(--ydsz-primary));
  outline-offset: -1px;
}

.pg__token-desc {
  font-size: var(--ydsz-font-size-xs, 0.75rem);
  color: hsl(var(--ydsz-text-tertiary));
}

.pg__theme-actions {
  display: flex;
  gap: var(--ydsz-spacing-sm, 8px);
  margin-top: var(--ydsz-spacing-md, 16px);
}

.pg__section-subtitle {
  margin: var(--ydsz-spacing-md, 16px) 0 var(--ydsz-spacing-sm, 8px);
  font-size: var(--ydsz-font-size-sm, 0.875rem);
  font-weight: var(--ydsz-font-weight-semibold, 600);
  color: hsl(var(--ydsz-text-primary));
}

.pg__preview--theme {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ydsz-spacing-sm, 8px);
}

@media (width <= 768px) {
  .pg__theme {
    grid-template-columns: 1fr;
  }
}
</style>
