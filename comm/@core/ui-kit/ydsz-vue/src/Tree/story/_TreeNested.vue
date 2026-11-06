<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { TreeItem } from '../';
// 递归自引用：树节点按层级渲染自身子树，Vue SFC 支持该写法
import Tree from './_TreeNested.vue';

interface TreeNode {
  title: string;
  icon: string;
  children?: TreeNode[];
}

withDefaults(
  defineProps<{
    treeItems: TreeNode[];
    level?: number;
  }>(),
  {
    level: 0,
  },
);
</script>

<template>
  <li v-for="tree in treeItems" :key="tree.title">
    <TreeItem
      v-slot="{ isExpanded }"
      as-child
      :level="level"
      :value="tree"
      :style="{ 'margin-left': `${level}rem` }"
    >
      <button
        class="focus:ring-grass9 data-[selected]:bg-grass4 my-0.5 flex w-max items-center rounded px-2 py-1 outline-none focus:ring-2"
      >
        <Icon v-if="tree.children" icon="radix-icons:chevron-down" class="mr-2 h-4 w-4" />
        <span>
          {{ tree.title }}
        </span>
      </button>

      <ul v-if="isExpanded">
        <template v-if="tree.children">
          <Tree :tree-items="tree.children" :level="level + 1" />
        </template>
      </ul>
    </TreeItem>
  </li>
</template>
