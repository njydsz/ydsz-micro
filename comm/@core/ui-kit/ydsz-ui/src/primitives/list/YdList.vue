<!--
 * List 列表：通用列表容器（ul），支持分页、加载更多、边框等。
 *
 * 与 Ant Design List 对齐：分页、边框、大号 / 小号、网格布局。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\list\YdList.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdPagination } from '../pagination';
import { YdSpin } from '../spin';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 数据源 */
  dataSource?: unknown[];
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示分割线 */
  split?: boolean;
  /** 尺寸 */
  size?: 'default' | 'large' | 'small';
  /** 是否加载中 */
  loading?: boolean;
  /** 分页配置 */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  } | false;
  /** 网格布局 */
  grid?: {
    column: number;
    gutter?: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  bordered: true,
  dataSource: () => [],
  grid: undefined,
  loading: false,
  pagination: false,
  size: 'default',
  split: true,
});

/** 尺寸→padding map */
const sizeClass = computed(() => {
  switch (props.size) {
    case 'large':
      return 'px-6 py-4';
    case 'small':
      return 'px-3 py-1.5';
    default:
      return 'px-4 py-2';
  }
});

/** 容器 class */
const containerClass = computed(() => {
  if (props.grid) {
    return cn('grid', props.bordered && '');
  }
  return cn(
    'divide-y divide-border overflow-hidden',
    props.bordered && 'rounded-lg border',
  );
});
</script>

<template>
  <div :class="cn(props.class)">
    <!-- 主体 -->
    <ul :class="containerClass">
      <slot :dataSource="dataSource">
        <!-- 默认渲染方式：通过 slot 注入 -->
      </slot>
    </ul>

    <!-- 分页 -->
    <div v-if="props.pagination" class="mt-4 flex justify-end">
      <YdPagination
        :current="pagination!.current"
        :page-size="pagination!.pageSize"
        :total="pagination!.total"
        @change="pagination!.onChange"
      />
    </div>
  </div>
</template>
