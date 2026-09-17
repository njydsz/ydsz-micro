<!--
 * analysis-charts-tabs Vue 组件
 *
 * @path comm\effects\common-ui\src\ui\dashboard\analysis\analysis-charts-tabs.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { TabOption } from '@ydsz/types';

import { computed } from 'vue';

import { YdTabs, YdTabsContent, YdTabsList, YdTabsTrigger } from '@ydsz-core/ydsz-ui';

interface Props {
  tabs?: TabOption[];
}

defineOptions({
  name: 'AnalysisChartsTabs',
});

const props = withDefaults(defineProps<Props>(), {
  tabs: () => [],
});

const defaultValue = computed(() => {
  return props.tabs?.[0]?.value;
});
</script>

<template>
  <div class="card-box w-full px-4 pb-5 pt-3">
    <YdTabs :default-value="defaultValue">
      <YdTabsList>
        <template v-for="tab in tabs" :key="tab.label">
          <YdTabsTrigger :value="tab.value"> {{ tab.label }} </YdTabsTrigger>
        </template>
      </YdTabsList>
      <template v-for="tab in tabs" :key="tab.label">
        <YdTabsContent :value="tab.value" class="pt-4">
          <slot :name="tab.value"></slot>
        </YdTabsContent>
      </template>
    </YdTabs>
  </div>
</template>
