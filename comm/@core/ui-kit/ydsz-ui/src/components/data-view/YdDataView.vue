<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * YdDataView - generic data view container.
 *
 * Supports list/grid layout, pagination, header/footer slots.
 * Individual items rendered via default slot (prop: item).
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\data-view\YdDataView.vue
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed } from 'vue';

import { useLocale } from '../../locale/useLocale';

import { YdPagination } from '.././pagination';
import type { DataViewLayout, YdDataViewEmits, YdDataViewProps } from './types';

const { t } = useLocale();

defineOptions({ name: 'YdDataView' });

const props = withDefaults(defineProps<YdDataViewProps<T>>(), {
  data: () => [],
  layout: 'list',
  pageSize: 10,
  paginated: true,
});

const emit = defineEmits<YdDataViewEmits>();

/** 当前页码（受控） */
const page = defineModel<number>('page', { default: 1 });

/* ============================================================ */
/* 计算                                                           */
/* ============================================================ */

/** 总条数 */
const totalCount = computed(() => props.data.length);

/** 当前页实际数据 */
const currentPageData = computed<T[]>(() => {
  if (!props.paginated) return props.data;
  const start = ((page.value ?? 1) - 1) * (props.pageSize ?? 10);
  const end = start + (props.pageSize ?? 10);
  return props.data.slice(start, end);
});

/** grid 布局样式 */
const gridClasses = computed<DataViewLayout>(() => props.layout);

/* ============================================================ */
/* 事件                                                           */
/* ============================================================ */

function handlePageChange(newPage: number, newPageSize: number): void {
  emit('update:page', newPage);
  emit('update:pageSize', newPageSize);
  emit('page-change', newPage, newPageSize);
}
</script>

<template>
  <div class="yd-data-view flex flex-col">
    <!-- 头部插槽 -->
    <div
      v-if="$slots.header"
      class="yd-data-view__header mb-3"
    >
      <slot name="header" />
    </div>

    <!-- 内容区 -->
    <div class="yd-data-view__body flex-1">
      <!-- 空状态 -->
      <div
        v-if="props.data.length === 0"
        class="flex items-center justify-center py-12 text-sm text-[hsl(var(--ydsz-text-tertiary))]"
      >
        <slot name="empty">
          {{ t('table.empty') }}
        </slot>
      </div>

      <!-- list 布局 -->
      <ul
        v-else-if="gridClasses === 'list'"
        class="flex flex-col gap-1"
        role="list"
        :aria-label="t('dataView.listAriaLabel')"
      >
        <li
          v-for="(item, idx) in currentPageData"
          :key="idx"
          class="rounded-md border border-[hsl(var(--ydsz-border-subtle))] bg-[hsl(var(--ydsz-surface-1))] transition-colors hover:bg-[hsl(var(--ydsz-comp-surface-hover))]"
        >
          <slot :item="item" :index="((page ?? 1) - 1) * (props.pageSize ?? 10) + idx" />
        </li>
      </ul>

      <!-- grid 布局 -->
      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        :aria-label="t('dataView.gridAriaLabel')"
      >
        <div
          v-for="(item, idx) in currentPageData"
          :key="idx"
          class="rounded-lg border border-[hsl(var(--ydsz-border-subtle))] bg-[hsl(var(--ydsz-surface-1))] transition-colors hover:shadow-[var(--ydsz-shadow-low)]"
        >
          <slot :item="item" :index="((page ?? 1) - 1) * (props.pageSize ?? 10) + idx" />
        </div>
      </div>
    </div>

    <!-- 底部插槽 -->
    <div
      v-if="$slots.footer"
      class="yd-data-view__footer mt-3"
    >
      <slot name="footer" />
    </div>

    <!-- 分页 -->
    <div
      v-if="props.paginated && props.data.length > 0"
      class="yd-data-view__pagination mt-4 flex items-center justify-end"
    >
      <slot
        name="pagination"
        :page="page ?? 1"
        :page-size="props.pageSize ?? 10"
        :total="totalCount"
      >
        <YdPagination
          :current="page ?? 1"
          :page-size="props.pageSize ?? 10"
          :total="totalCount"
          show-size-changer
          @change="handlePageChange"
        />
      </slot>
    </div>
  </div>
</template>

<style scoped>
.yd-data-view {
  container-type: inline-size;
}
</style>
