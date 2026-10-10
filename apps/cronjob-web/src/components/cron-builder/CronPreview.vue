<!--
 * Cron 表达式预览子组件
 *
 * <p>展示当前 Cron 表达式的可读描述与接下来 5 次触发时间。
 *
 * @path apps\cronjob-web\src\components\cron-builder\CronPreview.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup name="CronPreview">
/**
 * Cron 表达式预览子组件
 * <p>纯展示型组件，数据完全由父组件传入。
 *
 * @author ydsz-team
 * @since 1.0.0
 */

import { useI18n } from 'vue-i18n';
import type { ComputedRef } from 'vue';

interface Props {
  /** Cron 表达式字符串 */
  cronExpression: string;
  /** 人类可读的 Cron 描述 */
  cronDescription: string;
  /** 接下来 N 次触发时间列表 */
  nextRunTimes: string[] | ComputedRef<string[]>;
}

const props = defineProps<Props>();

const { t } = useI18n();
</script>

<template>
  <div class="mt-3 space-y-2 rounded bg-muted/40 p-3">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium">{{ t('cronBuilder.preview') }}</span>
      <span class="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
        {{ props.cronExpression }}
      </span>
    </div>
    <div class="text-xs text-muted-foreground">
      {{ t('cronBuilder.previewDescription') }}: {{ props.cronDescription }}
    </div>
    <div v-if="props.nextRunTimes.length > 0" class="space-y-1">
      <div class="text-xs font-medium">{{ t('cronBuilder.previewNextRuns') }}</div>
      <ul class="ml-3 space-y-0.5">
        <li v-for="run in props.nextRunTimes" :key="run" class="font-mono text-xs text-muted-foreground">
          {{ run }}
        </li>
      </ul>
    </div>
  </div>
</template>
