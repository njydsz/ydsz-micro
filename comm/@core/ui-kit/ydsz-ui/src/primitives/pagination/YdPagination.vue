<!--
 * Pagination 分页：页码切换控件。
 *
 * 与 Ant Design Pagination 对齐：页码列表 + 上/下一页 + 每页条数跳转。
 * 简化模式（simple）只显示输入框跳转。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\pagination\YdPagination.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-vue-next';

import { YdSelect } from '../select';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 当前页（受控） */
  current?: number;
  /** 禁用 */
  disabled?: boolean;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 每页条数 */
  pageSize?: number;
  /** 是否显示每页条数选择 */
  showSizeChanger?: boolean;
  /** 是否显示快速跳转 */
  showQuickJumper?: boolean;
  /** 是否显示总数 */
  showTotal?: boolean;
  /** 简化模式 */
  simple?: boolean;
  /** 总数 */
  total?: number;
}

const props = withDefaults(defineProps<Props>(), {
  current: 1,
  disabled: false,
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100],
  showQuickJumper: false,
  showSizeChanger: true,
  showTotal: true,
  simple: false,
  total: 0,
});

const emit = defineEmits<{
  change: [page: number, pageSize: number];
  'update:current': [page: number];
  'update:pageSize': [pageSize: number];
}>();

const totalPages = computed(() => Math.max(1, Math.ceil((props.total ?? 0) / props.pageSize)));

/** 页码列表生成 */
const pageList = computed(() => {
  const pages: Array<number | 'ellipsis'> = [];
  const cur = props.current ?? 1;
  const total = totalPages.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  // 边界 1
  pages.push(1);

  if (cur > 4 && total > 7) {
    pages.push('ellipsis');
  }

  // 中间窗口
  const start = Math.max(2, cur - 1);
  const end = Math.min(total - 1, cur + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (cur < total - 3 && total > 7) {
    pages.push('ellipsis');
  }

  // 边界 2
  pages.push(total);

  return pages;
});

function handlePageChange(page: number): void {
  if (page < 1 || page > totalPages.value || page === props.current) return;
  emit('update:current', page);
  emit('change', page, props.pageSize);
}

function handlePageSizeChange(size: number): void {
  emit('update:pageSize', size);
  emit('change', 1, size);
}
</script>

<template>
  <div :class="cn('flex items-center gap-2', props.class)">
    <!-- 总数 -->
    <span v-if="props.showTotal" class="text-sm text-muted-foreground">
      共 {{ props.total }} 条
    </span>

    <!-- 上一页 -->
    <button
      :class="
        cn(
          'flex size-8 items-center justify-center rounded-md border text-sm transition-colors',
          props.current <= 1 || props.disabled
            ? 'cursor-not-allowed opacity-40'
            : 'hover:bg-muted',
        )
      "
      :disabled="props.current <= 1 || props.disabled"
      aria-label="上一页"
      type="button"
      @click="handlePageChange((props.current ?? 1) - 1)"
    >
      <ChevronLeft class="size-4" />
    </button>

    <!-- 页码列表 -->
    <div class="flex items-center gap-1">
      <template v-for="(p, i) in pageList" :key="i">
        <span v-if="p === 'ellipsis'" class="inline-flex size-8 justify-center text-muted-foreground">
          <MoreHorizontal class="size-4" />
        </span>
        <button
          v-else
          :class="
            cn(
              'inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors',
              p === props.current
                ? 'bg-primary font-medium text-primary-foreground'
                : 'hover:bg-muted',
            )
          "
          :aria-current="p === props.current ? 'page' : undefined"
          :aria-label="`第 ${p} 页`"
          type="button"
          @click="handlePageChange(p)"
        >
          {{ p }}
        </button>
      </template>
    </div>

    <!-- 下一页 -->
    <button
      :class="
        cn(
          'flex size-8 items-center justify-center rounded-md border text-sm transition-colors',
          (props.current ?? 1) >= totalPages || props.disabled
            ? 'cursor-not-allowed opacity-40'
            : 'hover:bg-muted',
        )
      "
      :disabled="(props.current ?? 1) >= totalPages || props.disabled"
      aria-label="下一页"
      type="button"
      @click="handlePageChange((props.current ?? 1) + 1)"
    >
      <ChevronRight class="size-4" />
    </button>

    <!-- 每页条数 -->
    <YdSelect
      v-if="props.showSizeChanger"
      :disabled="props.disabled"
      :model-value="String(props.pageSize)"
      options={props.pageSizeOptions.map((s) => ({ label: `${s} 条/页`, value: String(s) }))}
      size="sm"
      class="w-24"
      @update:model-value="(v) => handlePageSizeChange(Number(v))"
    />
  </div>
</template>
