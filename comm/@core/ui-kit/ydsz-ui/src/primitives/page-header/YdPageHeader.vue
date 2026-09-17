<!--
 * PageHeader 页头：页面顶部标题区域，支持面包屑 / 返回按钮 / 操作区。
 *
 * 与 Ant Design PageHeader 对齐：
 * - title / subtitle 渲染在左
 * - extra 渲染在右
 * - avatar / tags / footer 按需显示
 * - onBack 提供返回按钮
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\page-header\YdPageHeader.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';
import { ArrowLeft } from 'lucide-vue-next';

import { YdBreadcrumb } from '../breadcrumb';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否显示返回按钮 */
  backIcon?: boolean;
  /** 面包屑数据 */
  breadcrumb?: Array<{ title: string; onClick?: () => void }>;
  /** 副标题 */
  subtitle?: string;
  /** 标题 */
  title?: string;
  /** 标签区域 */
  tags?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  backIcon: false,
  breadcrumb: () => [],
  tags: () => [],
});

const emit = defineEmits<{
  back: [];
}>();
</script>

<template>
  <header
    :class="cn('bg-background flex flex-col gap-3 px-6 py-4', props.class)"
    role="banner"
  >
    <!-- 顶部行：返回 / 面包屑 / extra -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          v-if="props.backIcon"
          :aria-label="'返回上级'"
          class="hover:bg-muted flex size-7 items-center justify-center rounded-md transition-colors"
          type="button"
          @click="emit('back')"
        >
          <ArrowLeft class="size-4" />
        </button>
        <YdBreadcrumb v-if="props.breadcrumb.length" :items="props.breadcrumb" />
        <slot name="breadcrumb"></slot>
      </div>
      <div class="flex items-center gap-2">
        <slot name="extra"></slot>
      </div>
    </div>

    <!-- 标题行 -->
    <div class="flex items-center gap-3">
      <slot name="avatar"></slot>
      <div class="flex flex-1 flex-col gap-0.5">
        <h1 class="text-foreground text-xl font-semibold">{{ props.title }}</h1>
        <p v-if="props.subtitle" class="text-muted-foreground text-sm">{{ props.subtitle }}</p>
      </div>
    </div>

    <!-- 标签行 -->
    <div v-if="props.tags.length" class="flex gap-1.5">
      <slot name="tags">
        <span
          v-for="tag in props.tags"
          :key="tag"
          class="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {{ tag }}
        </span>
      </slot>
    </div>

    <!-- 底部内容（tabs 等） -->
    <slot name="footer"></slot>
  </header>
</template>
