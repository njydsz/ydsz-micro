<script lang="ts" setup generic="">
/**
* YdAiBuilderToolbar — AI 生成器顶栏（输入 + 触发按钮）。
* 
 * <p>包含自然语言输入框、页面类型选择、生成按钮。
* 
 * @path comm\@core\ui-kit\ai-builder\src\components\YdAiBuilderToolbar.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed } from 'vue';

import type { PageIntent } from '../types';

import { useLocale } from '@ydsz-core/ydsz-ui/locale';

const description = defineModel<string>('description', { required: true });
const props = withDefaults(defineProps<{
  /** 是否正在生成 */
  isGenerating?: boolean;
  /** 描述是否为空 */
  isDescriptionEmpty?: boolean;
  /** 生成按钮文字 */
  generateButtonText?: string;
  /** 页面类型预设（传入时自动锁定分类） */
  pageType?: PageIntent['pageType'];
}>(), {
  isGenerating: false,
  isDescriptionEmpty: true,
});

const { t } = useLocale();

const emit = defineEmits<{
  generate: [];
  reset: [];
}>();

const placeholder = computed<string>(() => {
  if (!props.pageType) {
    return t('aiBuilder.defaultPromptPlaceholder');
  }
  // 逐型显式 t()：「类型 → 键」映射表的裸值对门禁不可见，缺键会把键名渲染到界面
  switch (props.pageType) {
    case 'table': {
      return t('aiBuilder.exampleTable');
    }
    case 'detail': {
      return t('aiBuilder.exampleDetail');
    }
    case 'dashboard': {
      return t('aiBuilder.exampleDashboard');
    }
    default: {
      return t('aiBuilder.exampleForm');
    }
  }
});

/**
 * 生成按钮文案。
 *
 * <p>默认值不写在 withDefaults 里：props 默认值在模块求值时定型，之后切换语种不会跟着变，
 * 只能留成 undefined 由渲染处的 t() 兜底。
 */
const generateLabel = computed<string>(() => {
  if (props.isGenerating) {
    return t('aiBuilder.generating');
  }
  return props.generateButtonText ?? t('aiBuilder.generatePage');
});
</script>

<template>
  <div class="yai-toolbar flex flex-col gap-3">
    <!-- 输入框区域 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-foreground">
        {{ t('aiBuilder.pageDescription') }}
      </label>
      <textarea
        v-model="description"
        :placeholder="placeholder"
        :disabled="isGenerating"
        rows="3"
        class="resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>

    <!-- 工具栏按钮 -->
    <div class="flex items-center justify-between">
      <span class="text-xs text-muted-foreground">
        {{ t('aiBuilder.autoHint') }}
      </span>
      <div class="flex gap-2">
        <button
          type="button"
          :disabled="isGenerating"
          class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          @click="emit('reset')"
        >
          {{ t('common.reset') }}
        </button>
        <button
          type="button"
          :disabled="isDescriptionEmpty || isGenerating"
          class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          @click="emit('generate')"
        >
          <svg
            v-if="isGenerating"
            class="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ generateLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
