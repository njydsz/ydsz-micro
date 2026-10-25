<script setup lang="ts" generic="T = unknown">
/**
* YdVirtualList —— 通用虚拟滚动列表组件。
* 
 * <p>纯展示型组件，仅负责按视口可见区间渲染列表项，不介入业务逻辑。
 * 与 useVirtualList composable 的区别：
 *  - useVirtualList 是 headless 计算层，返回 visibleItems / containerProps 等；
 *  - YdVirtualList 是带壳的 Vue 组件，封装了容器 / spacer / translateY 定位骨架，
 *    通过默认 slot 将可见项与定位信息注入给调用方。
* 
 * <p>适用场景：
 *  - 大数据下拉面板（见 YdSelectSmart 的虚拟分支）
 *  - 大数据级联列（见 YdVCascader）
 *  - 通用长列表替换 ul > li 结构
* 
 * <p>性能特征（以 itemHeight=32, viewportHeight=256 为例）：
 *  - 10000 项数据下，仅渲染 visibleCount(~8) + overscan*2(~10) ≈ 18 个 DOM 节点
* 
 * <p>API 参考 PrimeVue VirtualScroller：
 *  - props: items, itemHeight, scrollHeight, overscan
 *  - slot: default { items: VisibleItem[], totalHeight: number }
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\components\virtual-table\YdVirtualList.vue
 * @author ydsz-team
 * @since 26.09.17
 */
import { computed, ref } from 'vue';

import { useVirtualList } from '../../composables/use-virtual-list';

import type { VisibleItem } from '../../composables/use-virtual-list';
import type { VirtualListProps } from './virtual-list-types';

/**
 * YdVirtualList 的 props。
 *
 * @see VirtualListProps 获取完整类型定义。
 */
const props = withDefaults(defineProps<VirtualListProps>(), {
  itemHeight: 32,
  overscan: 5,
  scrollHeight: 256,
});

/** 规范化 getKey：未传入时使用 index */
const resolveKey = computed(() => {
  return props.getKey ?? ((_item: unknown, index: number) => index);
});

/** 动态高度映射（由 getItemHeight 预填充） */
const measuredHeights = ref(new Map<number, number>());

/** 调用 composable 计算可见区间 */
const {
  visibleItems,
  totalHeight,
  offsetY,
  containerProps,
  spacerProps,
} = useVirtualList(
  computed(() => props.items as T[]),
  {
    itemHeight: props.itemHeight,
    getKey: resolveKey.value,
    measuredHeights,
    overscan: props.overscan,
    viewportHeight: props.scrollHeight,
  },
);

defineExpose({
  scrollTop: containerProps,
  visibleItems,
});
</script>

<template>
  <div
    v-bind="containerProps"
    :class="['relative overflow-y-auto', props.class]"
    :tabindex="tabindex"
    role="listbox"
  >
    <!-- spacer 撑出总高度，生成符合内容比例的滚动条 -->
    <div v-bind="spacerProps">
      <!-- 可见项包裹容器：translateY 定位 -->
      <div
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `${visibleItems.length > 0 ? `translateY(${(visibleItems[0] as VisibleItem<T>).offsetY}px)` : 'translateY(0px)'}`,
        }"
      >
        <!-- 
          默认 slot 向调用方注入可见项与总高度。
          调用方自行决定每项的渲染样式（li / div / 自定义组件）。
        -->
        <slot
          :items="(visibleItems as VisibleItem<T>[])"
          :total-height="totalHeight"
          :offset-y="offsetY"
        >
          <!-- 默认降级：当调用方不传 slot 时渲染简单 div 列表 -->
          <div
            v-for="item in (visibleItems as VisibleItem<T>[])"
            :key="item.key"
            :style="{ height: `${itemHeight}px` }"
            role="option"
          >
            {{ (item.data as any)?.label ?? item.index }}
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
