<script setup lang="ts">
import { useForwardPropsEmits } from '../../shared/index.ts';
import { TreeItem, TreeRoot, type TreeRootEmits, type TreeRootProps } from '..';
import { Icon } from '@iconify/vue';

const props = defineProps<Omit<TreeRootProps, 'items' | 'getKey'>>();
const emits = defineEmits<TreeRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);

const items = [
  { title: 'index.vue', icon: 'vue' },
  {
    title: 'lib',
    icon: 'folder',
    children: [
      {
        title: 'tree',
        icon: 'folder',
        children: [
          {
            title: 'Tree.vue',
            icon: 'vue',
          },
          {
            title: 'TreeView.vue',
            icon: 'vue',
          },
        ],
      },
      {
        title: 'icons',
        icon: 'folder',
        children: [
          { title: 'JS.vue', icon: 'vue' },
          { title: 'vue.vue', icon: 'vue' },
        ],
      },
      {
        title: 'index.js',
        icon: 'js',
      },
    ],
  },
  {
    title: 'routes',
    icon: 'folder',
    children: [
      {
        title: 'contents',
        icon: 'folder',
        children: [
          {
            title: '+layout.vue',
            icon: 'vue',
          },
          {
            title: '+page.vue',
            icon: 'vue',
          },
        ],
      },
    ],
  },
];
</script>

<template>
  <TreeRoot
    v-slot="{ flattenItems }"
    v-bind="forwarded"
    class="text-blackA11 w-64 select-none list-none rounded-md bg-white p-2 text-sm font-medium"
    :items="items"
    :get-key="(item) => item.title"
  >
    <TreeItem
      v-for="item in flattenItems"
      :key="item._id"
      class="focus:ring-grass9 data-[selected]:bg-grass4 my-0.5 flex w-max items-center rounded px-2 py-1 outline-none focus:ring-2"
      :style="{ 'margin-left': `${item.level}rem` }"
      v-bind="item.bind"
    >
      <Icon v-if="item.hasChildren" icon="radix-icons:chevron-down" class="h-4 w-4" />
      <div class="pl-2">
        {{ item.value.title }}
      </div>
    </TreeItem>
  </TreeRoot>
</template>
