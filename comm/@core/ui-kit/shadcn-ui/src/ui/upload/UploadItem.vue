<!--
 * UploadItem —— 单个上传文件行。
 *
 * 展示文件名、状态图标和进度条。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\upload\UploadItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { UploadFile, UploadStatus } from './types';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { AlertCircle, CheckCircle2, YdFileIcon, Loader2, X } from 'lucide-vue-next';

const props = defineProps<{
  file: UploadFile;
}>();

const emit = defineEmits<{
  (e: 'remove', file: UploadFile): void;
}>();

/** 状态颜色映射 */
const statusVariant = computed<'success' | 'error' | 'uploading' | 'default'>(() => {
  const status = props.file.status;
  if (status === UploadStatus.SUCCESS || status === 'success') {
    return 'success';
  }
  if (status === UploadStatus.FAIL || status === 'fail') {
    return 'error';
  }
  if (status === UploadStatus.UPLOADING || status === 'uploading') {
    return 'uploading';
  }
  return 'default';
});

/** 进度百分比 */
const computedPercent = computed(() => Math.round(props.file.percentage ?? 0));
</script>

<template>
  <div
    :class="
      cn(
        'border-border bg-accent/20 hover:bg-accent/40 flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
      )
    "
  >
    <!-- 文件图标 -->
    <YdFileIcon class="text-muted-foreground h-4 w-4 shrink-0" />

    <!-- 名称 + 进度条 -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between gap-2">
        <span class="truncate">{{ file.name }}</span>
        <span
          v-if="statusVariant === 'uploading'"
          class="text-muted-foreground shrink-0 text-xs"
        >
          {{ computedPercent }}%
        </span>
      </div>
      <!-- 进度条 -->
      <div
        v-if="statusVariant === 'uploading'"
        class="bg-primary/20 mt-1 h-1 overflow-hidden rounded-full"
      >
        <div
          class="bg-primary h-full transition-all duration-300"
          :style="{ width: `${computedPercent}%` }"
        />
      </div>
    </div>

    <!-- 状态图标 -->
    <CheckCircle2
      v-if="statusVariant === 'success'"
      class="h-4 w-4 shrink-0 text-green-500"
    />
    <AlertCircle
      v-else-if="statusVariant === 'error'"
      class="h-4 w-4 shrink-0 text-red-500"
    />
    <Loader2
      v-else-if="statusVariant === 'uploading'"
      class="h-4 w-4 shrink-0 animate-spin"
    />

    <!-- 删除 -->
    <button
      aria-label="移除文件"
      class="hover:bg-accent rounded p-0.5"
      type="button"
      @click="emit('remove', file)"
    >
      <X class="text-muted-foreground hover:text-foreground h-3.5 w-3.5" />
    </button>
  </div>
</template>
