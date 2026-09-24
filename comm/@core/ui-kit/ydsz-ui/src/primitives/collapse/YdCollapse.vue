<!--
 * Collapse 折叠面板：点击展开/收起内容区域。
 *
 * 受控 + 非受控双模式：
 * - 受控：v-model:activeKeys 完全接管
 * - 非受控：内部维护 Set<string>
 *
 * accordion 模式限制同时间只展开一个面板。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\collapse\YdCollapse.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { computed, provide, readonly, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdCollapseItem, type CollapseItemInstance } from './YdCollapseItem.vue';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 手风琴模式 */
  accordion?: boolean;
  /** 默认展开的 key */
  defaultActiveKeys?: string[];
  /** 受控展开 key */
  activeKeys?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  accordion: false,
  defaultActiveKeys: () => [],
});

const emit = defineEmits<{
  'update:activeKeys': [keys: string[]];
  change: [keys: string[]];
}>();

/** 内部展开 key 集合（非受控模式使用） */
const internalActiveKeys = ref<Set<string>>(new Set(props.defaultActiveKeys));

/** 合并后的展开 key 集合 */
const mergedKeys = computed(() => {
  if (props.activeKeys !== undefined) {
    return new Set(props.activeKeys);
  }
  return internalActiveKeys.value;
});

function toggle(key: string): void {
  const next = new Set(mergedKeys.value);

  if (next.has(key)) {
    next.delete(key);
  } else {
    if (props.accordion) {
      next.clear();
    }
    next.add(key);
  }

  internalActiveKeys.value = next;
  const keys = Array.from(next);
  emit('update:activeKeys', keys);
  emit('change', keys);
}

function isActive(key: string): boolean {
  return mergedKeys.value.has(key);
}

provide('ydsz-collapse', {
  isActive,
  toggle,
});
</script>

<template>
  <div :class="cn('divide-border divide-y rounded-lg border', props.class)">
    <slot></slot>
  </div>
</template>
