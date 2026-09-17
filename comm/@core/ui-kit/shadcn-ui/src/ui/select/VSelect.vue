<!--
 * VSelect —— 带虚拟滚动的高性能选择器，用于替代原生 Select 处理大数据场景。
 *
 * 设计目标：
 *  - 应对 500 ~ 10000+ 选项列表，通过虚拟滚动保持渲染节点恒定；
 *  - 对外暴露标准的 v-model 双向绑定 API，降低替换成本；
 *  - 内置显示文本计算、清除按钮、远程搜索等高频能力。
 *
 * 与原生 Select 的边界：
 *  - Select 适合数量少（< 100）且需要 rich slot 自定义项内容的场景；
 *  - VSelect 适合纯数据驱动的扁平列表，牺牲部分定制灵活性换取数量级性能。
 *
 * 性能特征：
 *  - items < virtualThreshold（默认 100）时直接走 SelectContent 分支，避免虚拟滚动开销；
 *  - items >= virtualThreshold 时启用虚拟滚动，仅渲染可见窗口 + overscan 项。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\VSelect.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref } from 'vue';

import { useVModel } from '@vueuse/core';

import { SelectRoot } from 'radix-vue';

import type { SelectRootEmits, SelectRootProps } from 'radix-vue';

import SelectVirtualContent from './SelectVirtualContent.vue';
import VSelectTrigger from './VSelectTrigger.vue';

defineOptions({
  name: 'VSelect',
});

/**
 * VSelect 组件的 props。
 *
 * 扩展 radix SelectRootProps，增加虚拟滚动所需的 items / 字段映射 / 阈值配置。
 */
export interface VSelectProps<T extends Record<string, unknown>>
  extends SelectRootProps {
  /** 选项数据数组 */
  items: T[];
  /** 预估每项高度（像素），默认 36 */
  itemHeight?: number;
  /** 视口高度（像素），默认 256 */
  viewportHeight?: number;
  /** 上下两侧额外渲染的缓冲项数，默认 5 */
  overscan?: number;
  /** 超过此阈值才启用虚拟滚动（项数），默认 100 */
  virtualThreshold?: number;
  /** 从 item 中提取值的字段名或函数，默认 'value' */
  valueField?: string | ((item: T) => string | number);
  /** 从 item 中提取标签的字段名或函数，默认 'label' */
  labelField?: string | ((item: T) => string);
  /** 从 item 唯一 key 的字段名或函数，默认 'value' */
  keyField?: string | ((item: T) => string | number);
  /** 是否允许清除 */
  allowClear?: boolean;
  /** placeholder 文本 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<VSelectProps<T>>(), {
  allowClear: true,
  itemHeight: 36,
  keyField: 'value',
  labelField: 'label',
  overscan: 5,
  placeholder: '请选择',
  valueField: 'value',
  virtualThreshold: 100,
  viewportHeight: 256,
});

const emit = defineEmits<SelectRootEmits>();

/** 内部维护的选中值（支持 v-model 双向绑定） */
const modelValue = useVModel(props, 'modelValue', emit);

/** 虚拟滚动内容组件的 ref，用于受控滚动 */
const contentRef = ref<InstanceType<typeof SelectVirtualContent>>();

/**
 * 统一提取器：将字段配置规范化为 accessor 函数。
 *
 * @param field - 字段名或函数
 * @param fallback  - 默认字段名
 * @return 提取函数
 */
function resolveAccessor(
  field: string | ((item: T) => string | number),
  fallback: string,
): (item: T) => string | number {
  if (typeof field === 'function') {
    return field;
  }
  return (item: T): string | number => {
    const value = item[field];
    if (value === undefined || value === null) {
      const fallbackValue = item[fallback];
      return fallbackValue as string | number;
    }
    return value as string | number;
  };
}

/** 规范化后的 key 提取函数 */
const getKey = resolveAccessor(props.keyField, 'value');

/** 规范化后的 label 提取函数 */
const getLabel = resolveAccessor(props.labelField, 'label');

/** 规范化后的 value 提取函数 */
const getValue = resolveAccessor(props.valueField, 'value');

/** 是否启用虚拟滚动（根据 threshold 判断） */
const isVirtualEnabled = computed<boolean>(() => {
  return props.items.length >= props.virtualThreshold;
});

/** 处理清除事件 */
function handleClear(): void {
  modelValue.value = undefined;
}
</script>

<template>
  <SelectRoot
    v-model="modelValue"
    :disabled="disabled"
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <!-- 触发器：透传 hasValue 与 allowClear -->
    <VSelectTrigger
      :allow-clear="allowClear"
      :placeholder="placeholder"
      :disabled="disabled"
      :has-value="!!modelValue"
      @clear="handleClear"
    >
      <slot name="trigger" />
    </VSelectTrigger>

    <!-- 内容区：根据数据量选择虚拟滚动或原生渲染 -->
    <SelectVirtualContent
      v-if="isVirtualEnabled"
      ref="contentRef"
      :items="items"
      :get-key="getKey as (item: T, index: number) => string | number"
      :get-label="getLabel as (item: T) => string"
      :get-value="getValue as (item: T) => string | number"
      :item-height="itemHeight"
      :viewport-height="viewportHeight"
      :overscan="overscan"
    />
    <slot v-else />
  </SelectRoot>
</template>
