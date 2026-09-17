<!--
 * 分段控制器：基于 Tabs 语义实现单选切换，而不是普通按钮组 ——
 * 这样能直接获得 tablist / tab 的无障碍语义与键盘左右切换能力。
 *
 * 等宽布局由内联 grid-template-columns 按 tabs.length 均分，指示器宽度同为 100/n%，
 * 分段数量变化时无需改动任何样式；defaultValue 缺省时回退到第一个分段，
 * 保证组件始终有选中项，避免出现「无高亮」的中间态。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\segmented\segmented.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SegmentedItem } from './types';

import { computed } from 'vue';

import { TabsTrigger } from 'radix-vue';

import { Tabs, TabsContent, TabsList } from '../../ui';
import TabsIndicator from './tabs-indicator.vue';

interface Props {
  defaultValue?: string;
  tabs?: SegmentedItem[];
}

const props = withDefaults(defineProps<Props>(), {
  defaultValue: '',
  tabs: () => [],
});

const activeTab = defineModel<string>();

const getDefaultValue = computed(() => {
  return props.defaultValue || props.tabs[0]?.value;
});

const tabsStyle = computed(() => {
  return {
    'grid-template-columns': `repeat(${props.tabs.length}, minmax(0, 1fr))`,
  };
});

const tabsIndicatorStyle = computed(() => {
  return {
    width: `${(100 / props.tabs.length).toFixed(0)}%`,
  };
});
</script>

<template>
  <Tabs v-model="activeTab" :default-value="getDefaultValue">
    <TabsList :style="tabsStyle" class="bg-accent relative grid w-full" role="tablist">
      <TabsIndicator :style="tabsIndicatorStyle" />
      <template v-for="tab in tabs" :key="tab.value">
        <TabsTrigger
          :value="tab.value"
          class="z-20 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium disabled:pointer-events-none disabled:opacity-50"
          role="tab"
          :aria-label="tab.label"
        >
          {{ tab.label }}
        </TabsTrigger>
      </template>
    </TabsList>
    <template v-for="tab in tabs" :key="tab.value">
      <TabsContent :value="tab.value">
        <slot :name="tab.value"></slot>
      </TabsContent>
    </template>
  </Tabs>
</template>
