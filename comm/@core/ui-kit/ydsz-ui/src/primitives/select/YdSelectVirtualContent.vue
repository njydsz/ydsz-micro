<!--
 * 带虚拟滚动的选择器下拉面板：基于 useVirtualList 实现千级选项下的流畅滚动。
 *
 * 痛点：传统 YdSelect 在 options > 500 时全量渲染 DOM，导致面板展开慢、滚动卡顿。
 * 与 YdSelectContent 的区别：
 *  - 接收 items 数组而非 slot 注入 YdSelectItem 子项，借此在渲染前拿到总数做切片；
 *  - 仅渲染可视窗口内的 DOM 节点，配合 spacer 撑出总高度保持滚动条比例；
 *  - 点击选项后需要手动关闭浮层（缺少 YdSelectItem 的 rpc 与 Root 通信）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\YdSelectVirtualContent.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts" generic="T = Record<string, unknown>">
import { computed } from 'vue';

import { useVirtualList } from '../../composables';

import { cn } from '@ydsz-core/shared/utils';

import {
  YdSelectContent,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from '@ydsz-core/ydsz-vue';

import type {
  SelectContentEmits,
  SelectContentProps,
} from '@ydsz-core/ydsz-vue';

defineOptions({
  inheritAttrs: false,
});

/**
 * YdSelectVirtualContent 组件的 props。
 *
 * 在 SelectContentProps 基础上增加虚拟滚动相关配置。
 */
export interface SelectVirtualContentProps<T = Record<string, unknown>>
  extends SelectContentProps {
  /** 下拉数据项数组 */
  items: T[];
  /** 每项的预估高度（像素），默认 36 */
  itemHeight?: number;
  /** 视口高度（像素），默认 256 */
  viewportHeight?: number;
  /** 上下两侧额外渲染的项数（缓冲区大小），默认 5 */
  overscan?: number;
  /** 从数据项提取唯一 key 的函数 */
  getKey: (item: T, index: number) => string | number;
  /** 从数据项提取显示文本的函数 */
  getLabel: (item: T) => string;
  /** 从数据项提取值（用于 v-model 绑定） */
  getValue: (item: T) => string | number;
  /** 当前已选值（用于高亮展示） */
  modelValue?: (string | number)[] | string | number;
  /** 自定义类名 */
  class?: string;
}

const props = withDefaults(defineProps<SelectVirtualContentProps<T>>(), {
  itemHeight: 36,
  overscan: 5,
  position: 'popper',
  viewportHeight: 256,
});

const emits = defineEmits<
  SelectContentEmits & {
    /** 选项点击事件：通知父级更新 modelValue 并关闭下拉 */
    itemClick: [value: string | number];
  }
>();

const delegatedProps = computed(() => {
  const {
    class: _,
    getKey,
    getLabel,
    getValue,
    items,
    itemHeight,
    modelValue: _modelValue,
    overscan,
    viewportHeight,
    ...delegated
  } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const {
  containerProps,
  scrollTop,
  spacerProps,
  visibleItems,
} = useVirtualList(
  computed(() => props.items),
  {
    getKey: props.getKey,
    itemHeight: props.itemHeight,
    overscan: props.overscan,
    viewportHeight: props.viewportHeight,
  },
);

/**
 * 处理选项点击：通知父级 YdVSelect 更新选中并关闭。
 *
 * 不直接修改 modelValue，而是通过 emit 交由 @see YdVSelect 统一处理，
 * 确保单选/多选逻辑一致。
 *
 * @param value - 被点击项的值
 */
function handleItemClick(value: string | number): void {
  emits('itemClick', value);
}

/**
 * 处理选中项滚动：当选中项不在可视窗口内时滚动到其位置。
 *
 * @param value - 目标值
 */
function scrollToValue(value: string | number): void {
  const index = props.items.findIndex(
    (item) => props.getValue(item) === value,
  );
  if (index >= 0) {
    scrollTop.value = index * props.itemHeight;
  }
}

defineExpose({
  scrollToValue,
});
</script>

<template>
  <SelectPortal>
    <YdSelectContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-popup relative min-w-32 overflow-hidden rounded-md border border-border shadow-md',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          $props.class,
        )
      "
    >
      <!-- 虚拟滚动容器：固定高度 + y 轴溢出滚动 -->
      <SelectViewport
        v-bind="containerProps"
        :class="
          cn(
            'p-1',
            position === 'popper' &&
              'h-[--radix-select-trigger-height] w-full min-w-[--radix-select-trigger-width]',
          )
        "
        :style="{ height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }"
      >
        <!-- spacer 撑出总高度，生成符合内容比例的滚动条 -->
        <div v-bind="spacerProps">
          <!-- 仅渲染可视窗口内的项目，通过 transform 定位 -->
          <div
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${
                visibleItems.length > 0 ? visibleItems[0].offsetY : 0
              }px)`,
            }"
          >
            <div
              v-for="item in visibleItems"
              :key="item.key"
              :class="
                cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:bg-accent focus:text-accent-foreground',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  'data-[selected=true]:bg-accent/50 data-[selected=true]:font-medium',
                )
              "
              :style="{ height: `${itemHeight}px` }"
              :data-selected="
                Array.isArray(modelValue)
                  ? modelValue.includes(props.getValue(item.data))
                  : modelValue === props.getValue(item.data)
              "
              role="option"
              :aria-selected="
                Array.isArray(modelValue)
                  ? modelValue.includes(props.getValue(item.data))
                  : modelValue === props.getValue(item.data)
              "
              tabindex="-1"
              @click="handleItemClick(props.getValue(item.data))"
            >
              <span class="flex-1 truncate">{{ props.getLabel(item.data) }}</span>
            </div>
          </div>
        </div>
      </SelectViewport>
    </YdSelectContent>
  </SelectPortal>
</template>
