<script lang="ts" setup>
/**
* YdVTree —— 带虚拟滚动的树形选择组件。
* 
 * <p>基于 useTreeVirtual composable 实现，仅渲染视口可见的树节点 + overscan 缓冲区，
 * 支持 5000+ 节点的深层树流畅滚动。
* 
 * <p>与 YdTree 的边界：
 *  - YdTree 适合 < 500 节点、需要完整 TransitionGroup 动效的场景；
 *  - YdVTree 适合大数据量、可接受无展开动效的高性能场景。
* 
 * <p>API 参考 TanStack Virtual 的 estimateSize 模式：
 *  - estimateSize? number  — 每项估算行高（px），默认 28
 *  - overscan? number      — 上下缓冲行数，默认 5
 *  - viewportHeight? number — 滚动容器高度（px），默认 300
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tree\YdVTree.vue
 * @author ydsz-team
 * @since 26.09.17
 */
// @ts-nocheck
import type { FlattenedItem } from '@ydsz-core/ydsz-vue';

import type { ClassType, Recordable } from '@ydsz-core/typings';
import type { TreeProps } from './types';

import { computed, ref, watchEffect } from 'vue';

import { ChevronRight, IconifyIcon } from '@ydsz-core/icons';
import { cn, get } from '@ydsz-core/shared/utils';

import { TreeRoot } from '@ydsz-core/ydsz-vue';

import { useTreeVirtual } from '../../composables/use-tree-virtual';

import type { FlatTreeNode } from '../../composables/use-tree-virtual';

import { YdCheckbox } from '../checkbox';

/**
 * YdVTree 组件的 props。
 *
 * 扩展 TreeProps，增加虚拟滚动相关配置。
 */
export interface VTreeProps extends Omit<TreeProps, 'class'> {
  /** 每项估算行高（px），默认 28 */
  estimateSize?: number;
  /** 上下缓冲行数，默认 5 */
  overscan?: number;
  /** 滚动容器高度（px），默认 300 */
  viewportHeight?: number;
  /** 是否启用虚拟滚动，默认 true（节点数 >= 50 时生效） */
  virtualEnabled?: boolean;
  /** 虚拟滚动启用阈值（节点数），默认 50 */
  virtualThreshold?: number;
  /** 自定义类名 */
  class?: ClassType;
}

const props = withDefaults(defineProps<VTreeProps>(), {
  allowClear: false,
  autoCheckParent: true,
  bordered: false,
  checkStrictly: false,
  defaultExpandedKeys: () => [],
  defaultExpandedLevel: 0,
  disabled: false,
  disabledField: 'disabled',
  estimateSize: 28,
  expanded: () => [],
  iconField: 'icon',
  labelField: 'label',
  multiple: false,
  overscan: 5,
  showIcon: true,
  valueField: 'value',
  childrenField: 'children',
  virtualEnabled: true,
  virtualThreshold: 50,
  viewportHeight: 300,
});

const emits = defineEmits<{
  expand: [value: FlattenedItem<Recordable<any>>];
  select: [value: FlattenedItem<Recordable<any>>];
}>();

/** 内部扁平化节点 */
interface InnerFlattenItem<T = Recordable<any>, P = number | string> {
  hasChildren: boolean;
  level: number;
  parents: P[];
  value: T;
}

function flatten<T = Recordable<any>, P = number | string>(
  items: T[],
  childrenField: string = 'children',
  level = 0,
  parents: P[] = [],
): InnerFlattenItem<T, P>[] {
  const result: InnerFlattenItem<T, P>[] = [];
  items.forEach((item) => {
    const children = get(item, childrenField) as Array<T>;
    const val = {
      hasChildren: Array.isArray(children) && children.length > 0,
      level,
      parents: [...parents],
      value: item,
    };
    result.push(val);
    if (val.hasChildren)
      result.push(
        ...flatten(children, childrenField, level + 1, [
          ...parents,
          get(item, props.valueField),
        ]),
      );
  });
  return result;
}

const flattenData = ref<Array<InnerFlattenItem>>([]);
const expanded = ref<Array<number | string>>(props.defaultExpandedKeys ?? []);
const expandedSet = computed(() => new Set(expanded.value));

watchEffect(() => {
  flattenData.value = flatten(props.treeData, props.childrenField);
});

/** 将 InnerFlattenItem 转换为 useTreeVirtual 期望的 FlatTreeNode */
const flatTreeNodes = computed<FlatTreeNode[]>(() =>
  flattenData.value.map((item) => ({
    data: item.value,
    hasChildren: item.hasChildren,
    level: item.level,
    parents: item.parents,
    value: get(item.value, props.valueField),
  })),
);

/** 是否启用虚拟滚动（节点数 >= 阈值 + 开关打开） */
const isVirtualActive = computed(
  () =>
    props.virtualEnabled &&
    flatTreeNodes.value.length >= props.virtualThreshold,
);

/** 虚拟滚动句柄 */
const treeVirtual = useTreeVirtual({
  expandedKeys: expandedSet,
  flattenedNodes: flatTreeNodes,
  itemHeight: props.estimateSize,
  overscan: props.overscan,
  viewportHeight: props.viewportHeight,
});

function isNodeDisabled(item: Recordable<any>) {
  return props.disabled || get(item, props.disabledField);
}

function onToggle(item: FlattenedItem<Recordable<any>>) {
  emits('expand', item);
}

function onSelect(item: FlattenedItem<Recordable<any>>) {
  emits('select', item);
}

function handleToggle(value: Arrayable<number | string>) {
  const keys = Array.isArray(value) ? value : [value];
  keys.forEach((key) => {
    if (expanded.value.includes(key)) {
      expanded.value = expanded.value.filter((k) => k !== key);
    } else {
      expanded.value = [...expanded.value, key];
    }
  });
}

defineExpose({
  expandAll() {
    expanded.value = flattenData.value
      .filter((item) => item.hasChildren)
      .map((item) => get(item.value, props.valueField));
  },
  collapseAll() {
    expanded.value = [];
  },
});
</script>

<template>
  <TreeRoot
    :get-key="(item: any) => get(item, valueField)"
    :get-children="(item: any) => get(item, childrenField)"
    :items="treeData"
    v-model:expanded="expanded as string[]"
    :default-expanded="defaultExpandedKeys as string[]"
    :propagate-select="!checkStrictly"
    :multiple="multiple"
    :disabled="disabled"
    :selection-behavior="allowClear || multiple ? 'toggle' : 'replace'"
    v-slot="{ flattenItems }"
    :class="
      cn(
        'text-blackA11 container select-none list-none rounded-lg p-2 text-sm font-medium',
        $attrs.class as unknown as ClassType,
        bordered ? 'border' : '',
      )
    "
  >
    <!-- 虚拟滚动模式：仅渲染可见节点 -->
    <div
      v-if="isVirtualActive"
      :style="treeVirtual.containerStyle.value"
      class="relative overflow-y-auto"
      role="tree"
    >
      <div :style="treeVirtual.spacerStyle.value">
        <div
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${treeVirtual.offsetY.value}px)`,
          }"
        >
          <div
            v-for="vNode in treeVirtual.visibleSlice.value"
            :key="vNode.key"
            :style="{
              paddingLeft: `${(vNode.data.level - 0.5)}rem`,
              height: `${estimateSize}px`,
            }"
            class="tree-node focus:ring-grass8 my-0.5 flex cursor-pointer items-center rounded px-2 py-1 outline-none focus:ring-2"
            role="treeitem"
            :aria-expanded="expandedSet.has(String(vNode.data.value))"
            @click="
              () => {
                if (vNode.data.hasChildren) handleToggle(String(vNode.data.value));
                onSelect(flattenItems[vNode.index]);
              }
            "
          >
            <ChevronRight
              v-if="vNode.data.hasChildren"
              class="size-4 cursor-pointer transition"
              :class="{ 'rotate-90': expandedSet.has(String(vNode.data.value)) }"
              @click.stop="handleToggle(String(vNode.data.value))"
            />
            <div v-else class="h-4 w-4" />
            <YdCheckbox
              v-if="multiple"
              :disabled="disabled"
              @click.stop
            />
            <div class="flex items-center gap-1 pl-2">
              <IconifyIcon
                v-if="showIcon && get(vNode.data.data as any, iconField)"
                class="size-4"
                :icon="get(vNode.data.data as any, iconField)"
              />
              {{ get(vNode.data.data as any, labelField) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 非虚拟模式：小数据量回退 -->
    <div v-else class="w-full">
      <div
        v-for="item in flattenItems"
        :key="(item as any)._id"
        :style="{ 'padding-left': `${(item as any).level - 0.5}rem` }"
        class="tree-node focus:ring-grass8 my-0.5 flex cursor-pointer items-center rounded px-2 py-1 outline-none focus:ring-2"
        role="treeitem"
      >
        <ChevronRight
          v-if="
            (item as any).hasChildren &&
            Array.isArray((item as any).value[childrenField]) &&
            (item as any).value[childrenField].length > 0
          "
          class="size-4 cursor-pointer transition"
          @click.stop="
            () => {
              handleToggle(get((item as any).value, valueField));
              onToggle(item);
            }
          "
        />
        <div v-else class="h-4 w-4" />
        <YdCheckbox
          v-if="multiple"
          :disabled="isNodeDisabled((item as any).value)"
          @click="
            (event: MouseEvent) => {
              if (isNodeDisabled((item as any).value)) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              onSelect(item);
            }
          "
        />
        <div
          class="flex items-center gap-1 pl-2"
          @click="
            (event: MouseEvent) => {
              if (isNodeDisabled((item as any).value)) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              event.stopPropagation();
              event.preventDefault();
              onSelect(item);
            }
          "
        >
          <slot name="node" v-bind="item">
            <IconifyIcon
              class="size-4"
              v-if="showIcon && get((item as any).value, iconField)"
              :icon="get((item as any).value, iconField)"
            />
            {{ get((item as any).value, labelField) }}
          </slot>
        </div>
      </div>
    </div>

    <div class="w-full" v-if="$slots.footer">
      <slot name="footer"> </slot>
    </div>
  </TreeRoot>
</template>
