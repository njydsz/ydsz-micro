/**
 * YdThemeEditor —— 可视化主题编辑器组件。
 *
 * <p>允许用户实时调整主题 token（主色、背景、字体、圆角等），
 * 预览效果即时生效，主题配置可导出为 JSON 复制到配置系统。
 *
 * <p>核心特性：
 * <ul>
 *   <li>分区块编辑：color / size / radius</li>
 *   <li>实时预览：CSS 变量即时写入 :root</li>
 *   <li>重置按钮：恢复默认主题 token</li>
 *   <li>导出配置：payload JSON</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\theme-editor\YdThemeEditor.vue
 * @author ydsz-team
 * @since 26.09.17
 */
import { computed, reactive } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdButton } from '../../primitives/button';

interface TokenGroup {
  key: string;
  label: string;
}

const TOKEN_GROUPS: TokenGroup[] = [
  { key: 'color', label: '颜色' },
  { key: 'radius', label: '圆角' },
  { key: 'size', label: '尺寸' },
];

const COLOR_TOKENS = [
  { description: '主色', key: 'primary' },
  { description: '背景色', key: 'background' },
  { description: '前景色（文字）', key: 'foreground' },
  { description: '危险操作色', key: 'destructive' },
  { description: '卡片与弹窗背景', key: 'card' },
  { description: '次级文字', key: 'muted-foreground' },
  { description: '强调/悬浮色', key: 'accent' },
  { description: '边框色', key: 'border' },
];

const SIZE_TOKENS = [
  { description: '基础圆角', key: 'radius' },
];

interface Props {
  /** 自定义类名 */
  class?: string;
  /** 是否自动输出到 :root，默认 true */
  apply?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  apply: true,
});

const emit = defineEmits<{
  'update': [tokens: Record<string, string>];
}>();

/** 默认主题 token */
const DEFAULT_TOKENS: Record<string, string> = {
  accent: '240 5% 96%',
  background: '0 0% 100%',
  border: '240 6% 90%',
  card: '0 0% 100%',
  destructive: '0 84% 60%',
  foreground: '240 10% 4%',
  'muted-foreground': '240 4% 46%',
  primary: '240 6% 10%',
  radius: '0.5rem',
};

/** 当前 token（响应式） */
const tokens = reactive<Record<string, string>>({ ...DEFAULT_TOKENS });

// 初始化时写入 CSS 变量
if (props.apply && typeof document !== 'undefined') {
  const root = document.documentElement;
  for (const [key, val] of Object.entries(tokens)) {
    root.style.setProperty(`--${key}`, val);
  }
}

/**
 * 更新单个 token。
 */
function updateToken(key: string, value: string): void {
  tokens[key] = value;
  if (props.apply && typeof document !== 'undefined') {
    document.documentElement.style.setProperty(`--${key}`, value);
  }
  emit('update', { ...tokens });
}

/**
 * 重置为默认 token。
 */
function resetTokens(): void {
  for (const [key, val] of Object.entries(DEFAULT_TOKENS)) {
    updateToken(key, val);
  }
}

/** 序列化 token 为 JSON */
const tokenJson = computed(() => JSON.stringify(tokens, null, 2));
</script>

<template>
  <div :class="cn('flex flex-col gap-4 rounded-lg border p-5', class)">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold">主题编辑器</h3>
      <YdButton size="sm" variant="outline" @click="resetTokens">
        重置默认
      </YdButton>
    </div>

    <!-- 颜色 tokens -->
    <section v-for="group in TOKEN_GROUPS" :key="group.key" class="flex flex-col gap-2">
      <h4 class="text-sm font-medium text-muted-foreground">{{ group.label }}</h4>

      <div class="grid grid-cols-2 gap-3">
        <template v-if="group.key === 'color'">
          <div
            v-for="token in COLOR_TOKENS"
            :key="token.key"
            class="flex flex-col gap-1"
          >
            <label class="text-xs text-muted-foreground" :for="`token-${token.key}`">
              {{ token.description }}
            </label>
            <input
              :id="`token-${token.key}`"
              type="text"
              :value="tokens[token.key]"
              class="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              @input="updateToken(token.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </template>

        <template v-if="group.key === 'radius'">
          <div
            v-for="token in SIZE_TOKENS"
            :key="token.key"
            class="flex flex-col gap-1"
          >
            <label class="text-xs text-muted-foreground" :for="`token-${token.key}`">
              {{ token.description }}
            </label>
            <input
              :id="`token-${token.key}`"
              type="text"
              :value="tokens[token.key]"
              class="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              @input="updateToken(token.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </template>

        <template v-if="group.key === 'size'">
          <div class="col-span-2 text-xs text-muted-foreground">
            尺寸 token 通过 theme schema 定义，未来可扩展为滑块控件。
          </div>
        </template>
      </div>
    </section>

    <!-- 导出配置 -->
    <details class="rounded border p-3">
      <summary class="cursor-pointer text-sm font-medium">导出 Token JSON</summary>
      <pre class="mt-2 overflow-auto rounded bg-muted p-3 text-xs"><code>{{ tokenJson }}</code></pre>
    </details>
  </div>
</template>
