<!--
 * spinner 通用组件
 *
 * @path comm\effects\common-ui\src\components\loading\spinner.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { REMISpinner } from '@remi-core/shadcn-ui';
import { cn } from '@remi-core/shared/utils';

interface SpinnerProps {
  class?: string;
  /**
   * @zh_CN 最小加载时间
   * @en_US Minimum loading time
   */
  minLoadingTime?: number;
  /**
   * @zh_CN loading状态开启
   */
  spinning?: boolean;
}
defineOptions({ name: 'Spinner' });
const props = defineProps<SpinnerProps>();
</script>
<template>
  <div :class="cn('relative min-h-20', props.class)">
    <slot></slot>
    <REMISpinner
      :min-loading-time="props.minLoadingTime"
      :spinning="props.spinning"
    />
  </div>
</template>
