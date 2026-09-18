<!--
 * YdAiBuilderToolbar — AI 生成器顶栏（输入 + 触发按钮）。
 *
 * <p>包含自然语言输入框、页面类型选择、生成按钮。
 *
 * @path comm\@core\ui-kit\ai-builder\src\components\YdAiBuilderToolbar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup generic="">
import { computed } from 'vue';

import type { PageIntent } from '../types';

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
  generateButtonText: '生成页面',
});

const emit = defineEmits<{
  generate: [];
  reset: [];
}>();

const placeholder = computed<string>(() => {
  const typeMap: Record<string, string> = {
    form: '例如：创建一个新建用户表单，需要姓名、年龄、邮箱字段',
    table: '例如：创建一个订单列表，支持按状态筛选和导出功能',
    dashboard: '例如：创建一个销售数据看板，展示每日营收、订单量、转化率',
    detail: '例如：创建一个客户详情页，展示基本信息和关联订单',
  };
  return props.pageType ? typeMap[props.pageType] ?? typeMap.form : '自然语言描述您要创建的页面（支持中英文混合）';
});
</script>

<template>
  <div class="yai-toolbar flex flex-col gap-3">
    <!-- 输入框区域 -->
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-foreground">
        页面描述
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
        AI 将根据描述的字段和业务关键词自动推断页面结构
      </span>
      <div class="flex gap-2">
        <button
          type="button"
          :disabled="isGenerating"
          class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          @click="emit('reset')"
        >
          重置
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
          {{ isGenerating ? '生成中...' : generateButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>
