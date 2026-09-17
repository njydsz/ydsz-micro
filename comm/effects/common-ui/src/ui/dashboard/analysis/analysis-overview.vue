<!--
 * analysis-overview Vue 组件
 *
 * @path comm\effects\common-ui\src\ui\dashboard\analysis\analysis-overview.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { AnalysisOverviewItem } from '../typing';

import {
  YdCard,
  YdCardContent,
  YdCardFooter,
  YdCardHeader,
  YdCardTitle,
  YdCountToAnimator,
  YdIcon,
} from '@ydsz-core/ydsz-ui';

interface Props {
  items?: AnalysisOverviewItem[];
}

defineOptions({
  name: 'AnalysisOverview',
});

withDefaults(defineProps<Props>(), {
  items: () => [],
});
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <template v-for="item in items" :key="item.title">
      <YdCard :title="item.title" class="w-full">
        <YdCardHeader>
          <YdCardTitle class="text-xl">{{ item.title }}</YdCardTitle>
        </YdCardHeader>

        <YdCardContent class="flex items-center justify-between">
          <YdCountToAnimator
            :end-val="item.value"
            :start-val="1"
            class="text-xl"
            prefix=""
          />
          <YdIcon :icon="item.icon" class="size-8 flex-shrink-0" />
        </YdCardContent>
        <YdCardFooter class="justify-between">
          <span>{{ item.totalTitle }}</span>
          <YdCountToAnimator
            :end-val="item.totalValue"
            :start-val="1"
            prefix=""
          />
        </YdCardFooter>
      </YdCard>
    </template>
  </div>
</template>
