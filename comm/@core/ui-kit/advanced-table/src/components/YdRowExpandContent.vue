<!--
 * YdRowExpandContent — 行展开内容渲染器。
 *
 * <p>根据加载状态展示：loading spinner / 子表格 / 错误信息。
 *
 * @path comm\@core\ui-kit\advanced-table\src\components\YdRowExpandContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
defineProps<{
  /** 加载状态 */
  state: 'idle' | 'loading' | 'loaded' | 'error';
  /** 子数据 */
  children?: Array<Record<string, unknown>>;
}>();

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="adt-row-expand w-full bg-muted/20 px-6 py-3">
    <!-- Loading -->
    <div
      v-if="state === 'loading'"
      class="flex items-center justify-center py-4 text-sm text-muted-foreground"
    >
      <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      加载中...
    </div>

    <!-- Error -->
    <div
      v-else-if="state === 'error'"
      class="flex items-center justify-center py-4 text-sm text-destructive"
    >
      <span>子数据加载失败</span>
      <button
        type="button"
        class="ml-2 text-xs text-primary hover:underline"
        @click="emit('retry')"
      >
        重试
      </button>
    </div>

    <!-- Children data -->
    <div v-else-if="state === 'loaded' && children?.length" class="py-2">
      <div class="mb-2 text-xs font-medium text-muted-foreground">关联数据</div>
      <div class="grid gap-2">
        <div
          v-for="(child, idx) in children"
          :key="idx"
          class="flex items-center gap-4 rounded border bg-background px-3 py-2 text-xs"
        >
          <template v-for="(value, key) in child" :key="key">
            <span class="text-muted-foreground">{{ key }}:</span>
            <span>{{ String(value) }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Idle / Empty -->
    <div
      v-else
      class="py-4 text-center text-xs text-muted-foreground"
    >
      暂无数据
    </div>
  </div>
</template>
