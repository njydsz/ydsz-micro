<!--
 * analysis-chart-card Vue 组件
 *
 * @path comm\effects\common-ui\src\ui\dashboard\analysis\analysis-chart-card.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { YdCard, YdCardContent, YdCardHeader, YdCardTitle } from '@ydsz-core/ydsz-ui';

interface Props {
  title: string;
}

defineOptions({
  name: 'AnalysisChartCard',
});

withDefaults(defineProps<Props>(), {});
</script>

<template>
  <YdCard>
    <YdCardHeader>
      <YdCardTitle class="text-xl">{{ title }}</YdCardTitle>
    </YdCardHeader>
    <YdCardContent>
      <slot></slot>
    </YdCardContent>
  </YdCard>
</template>
