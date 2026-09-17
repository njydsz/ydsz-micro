<!--
 * 表单树选择：YdPopoverBase + YdTree 组合（ElTreeSelect 等价物）。
 *
 * YdTree 不假定数据结构（labelField/valueField/childrenField 可配），
 * 本组件在其上补齐「触发器 + 弹层 + 选中回显」的表单形态；
 * 单选选中即收起，多选保持弹层以便连续勾选。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-tree-select.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, ref } from 'vue';

import {
  YdPopoverBase,
  YdPopoverContentBase,
  YdPopoverTriggerBase,
  YdTree,
} from '@ydsz-core/shadcn-ui';
import { ChevronDown, CircleX } from 'lucide-vue-next';

interface TreeNode {
  [key: string]: unknown;
}

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    childrenField?: string;
    disabled?: boolean;
    labelField?: string;
    multiple?: boolean;
    placeholder?: string;
    treeData?: TreeNode[];
    valueField?: string;
  }>(),
  {
    allowClear: true,
    childrenField: 'children',
    disabled: false,
    labelField: 'label',
    multiple: false,
    placeholder: '',
    treeData: () => [],
    valueField: 'value',
  },
);

const model = defineModel<string | number | Array<string | number>>();

/** 弹层开关 */
const open = ref(false);

/**
 * 深度优先收集树中命中选中值的节点标签。
 *
 * @param nodes 当前层节点
 * @param values 选中值集合
 * @param acc 标签累积器
 */
function collectLabels(
  nodes: TreeNode[],
  values: Set<string>,
  acc: string[],
): void {
  for (const node of nodes) {
    const value = node[props.valueField];
    if (value !== undefined && value !== null && values.has(String(value))) {
      acc.push(String(node[props.labelField] ?? value));
    }
    const children = node[props.childrenField];
    if (Array.isArray(children)) {
      collectLabels(children as TreeNode[], values, acc);
    }
  }
}

/** 触发器回显文本：多选逗号拼接，单选取首个 */
const selectedLabel = computed(() => {
  const raw = model.value;
  if (raw === undefined || raw === null || raw === '') return '';
  const values = new Set<string>(
    Array.isArray(raw) ? raw.map(String) : [String(raw)],
  );
  const labels: string[] = [];
  collectLabels(props.treeData, values, labels);
  return labels.join('、');
});

/**
 * 清空选中值；禁用时不响应。
 */
function handleClear(): void {
  if (props.disabled) return;
  model.value = props.multiple ? [] : undefined;
}

/**
 * 树节点更新回调：单选时收起弹层。
 *
 * @param value YdTree 回写的新值
 */
function handleUpdate(value: string | number | Array<string | number>): void {
  model.value = value;
  if (!props.multiple) {
    open.value = false;
  }
}
</script>

<template>
  <YdPopoverBase v-model:open="open">
    <YdPopoverTriggerBase as-child>
      <button
        :aria-expanded="open"
        :aria-haspopup="'listbox'"
        :class="props.disabled ? 'cursor-not-allowed opacity-50' : ''"
        class="border-input bg-input-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2"
        :disabled="props.disabled"
        type="button"
      >
        <span
          v-if="selectedLabel"
          class="truncate"
        >{{ selectedLabel }}</span>
        <span v-else class="text-muted-foreground">
          {{ props.placeholder }}
        </span>
        <span class="flex items-center gap-1">
          <CircleX
            v-if="props.allowClear && selectedLabel && !props.disabled"
            aria-label="清除选择"
            class="size-4 cursor-pointer opacity-50 hover:opacity-100"
            role="button"
            tabindex="0"
            @click.stop.prevent="handleClear"
          />
          <ChevronDown aria-hidden="true" class="size-4 opacity-50" />
        </span>
      </button>
    </YdPopoverTriggerBase>
    <YdPopoverContentBase :align="'start'" class="w-[--radix-popover-trigger-width] p-2">
      <YdTree
        :children-field="props.childrenField"
        :label-field="props.labelField"
        :multiple="props.multiple"
        :tree-data="props.treeData"
        :value-field="props.valueField"
        :model-value="(model ?? undefined) as string | number | Array<string | number> | undefined"
        bordered
        @update:model-value="handleUpdate"
      />
    </YdPopoverContentBase>
  </YdPopoverBase>
</template>
