<!--
 * YdUploadItem —— 单个上传文件行/卡片。
 *
 * 展示文件名、状态图标、进度条、重试按钮与移除按钮。
 * 支持 text / picture-card 两种呈现模式。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\upload\YdUploadItem.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { UploadFile, UploadStatus as UploadStatusType } from './types';

import { computed } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  AlertCircle,
  CheckCircle2,
  File,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-vue-next';

import { useComponentI18n } from '../../composables/use-component-i18n';

const props = withDefaults(
  defineProps<{
    /** 文件对象 */
    file: UploadFile;
    /** 当前语言，默认 'zh' */
    locale?: string;
    /** 上传进度（0-100），覆盖 file.percentage */
    progress?: number;
    /** 是否显示重试按钮 */
    showRetry?: boolean;
    /** 呈现模式：text | picture-card */
    listType?: 'text' | 'picture-card';
  }>(),
  {
    listType: 'text',
    locale: 'zh',
    progress: undefined,
    showRetry: true,
  },
);

const emit = defineEmits<{
  (e: 'remove', file: UploadFile): void;
  (e: 'retry', file: UploadFile): void;
}>();

/** i18n 消息 */
const uploadItemMessages = {
  en: {
    uploadItem: {
      fail: 'Upload failed',
      removeAriaLabel: 'Remove file',
      retry: 'Retry',
      retryAriaLabel: 'Retry upload',
      size: 'Size',
      uploading: 'Uploading',
    },
  },
  zh: {
    uploadItem: {
      fail: '上传失败',
      removeAriaLabel: '移除文件',
      retry: '重试',
      retryAriaLabel: '重试上传',
      size: '大小',
      uploading: '上传中',
    },
  },
};

const { t } = useComponentI18n({
  defaultLocale: props.locale,
  messages: uploadItemMessages,
});

/**
 * 状态分类。
 *
 * @return 状态变体：success / error / uploading / default
 */
const statusVariant = computed<'success' | 'error' | 'uploading' | 'default'>(
  () => {
    const status = props.file.status;
    if (status === ('success' as UploadStatusType) || status === 'success') {
      return 'success';
    }
    if (status === ('fail' as UploadStatusType) || status === 'fail') {
      return 'error';
    }
    if (
      status === ('uploading' as UploadStatusType) ||
      status === 'uploading'
    ) {
      return 'uploading';
    }
    return 'default';
  },
);

/** 进度百分比 */
const computedPercent = computed(() =>
  Math.round(props.progress ?? props.file.percentage ?? 0),
);

/** 是否正在上传中 */
const isUploading = computed(() => statusVariant.value === 'uploading');

/** 是否上传失败 */
const isFailed = computed(() => statusVariant.value === 'error');

/** 是否上传成功 */
const isSuccess = computed(() => statusVariant.value === 'success');

/**
 * 自动格式化文件大小。
 *
 * <p>自动换算 B / KB / MB / GB。
 *
 * @param bytes - 字节数
 * @return 格式化后的文件大小字符串
 *
 * @example
 * ```ts
 * formatFileSize(1024); // '1.0 KB'
 * formatFileSize(1536); // '1.5 KB'
 * ```
 */
function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0 || Number.isNaN(bytes)) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/** 是否为图片文件（用于 picture-card 缩略图） */
const isImageFile = computed(() => {
  const mime = props.file.raw?.type ?? '';
  return mime.startsWith('image/');
});

/** 缩略图 URL（ObjectURL 或 file.url） */
const thumbnailUrl = computed<string | undefined>(() => {
  if (props.file.url) return props.file.url;
  if (isImageFile.value && props.file.raw) {
    return URL.createObjectURL(props.file.raw);
  }
  return undefined;
});
</script>

<template>
  <!-- text 模式 -->
  <div
    v-if="listType === 'text'"
    :class="
      cn(
        'bg-accent/20 hover:bg-accent/40 border-border flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
      )
    "
  >
    <!-- 文件图标 -->
    <File class="text-muted-foreground h-4 w-4 shrink-0" />

    <!-- 名称 + 进度条 -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between gap-2">
        <span class="truncate">{{ file.name }}</span>
        <span
          v-if="isUploading"
          class="text-muted-foreground shrink-0 text-xs"
        >
          {{ computedPercent }}%
        </span>
      </div>

      <!-- 文件大小 -->
      <div
        v-if="file.size !== undefined && !isUploading"
        class="text-muted-foreground mt-0.5 text-xs"
      >
        {{ formatFileSize(file.size) }}
      </div>

      <!-- 进度条 -->
      <div
        v-if="isUploading"
        class="bg-muted mt-1 h-1 overflow-hidden rounded-full"
      >
        <div
          class="bg-primary h-full transition-all duration-300"
          :style="{ width: `${computedPercent}%` }"
        />
      </div>

      <!-- 错误提示 -->
      <div
        v-else-if="isFailed"
        class="mt-0.5 text-xs text-red-500"
      >
        {{ t('uploadItem.fail') }}
      </div>
    </div>

    <!-- 状态图标 -->
    <CheckCircle2
      v-if="isSuccess"
      class="h-4 w-4 shrink-0 text-green-500"
    />
    <AlertCircle
      v-else-if="isFailed"
      class="h-4 w-4 shrink-0 text-red-500"
    />
    <Loader2
      v-else-if="isUploading"
      class="h-4 w-4 shrink-0 animate-spin text-blue-500"
    />

    <!-- 重试按钮（仅失败时） -->
    <button
      v-if="isFailed && showRetry"
      :aria-label="t('uploadItem.retryAriaLabel')"
      class="hover:bg-accent rounded p-0.5"
      :title="t('uploadItem.retry')"
      type="button"
      @click="emit('retry', file)"
    >
      <RefreshCw class="text-muted-foreground hover:text-foreground h-3.5 w-3.5" />
    </button>

    <!-- 移除按钮 -->
    <button
      :aria-label="t('uploadItem.removeAriaLabel')"
      class="hover:bg-accent rounded p-0.5"
      type="button"
      @click="emit('remove', file)"
    >
      <X class="text-muted-foreground hover:text-foreground h-3.5 w-3.5" />
    </button>
  </div>

  <!-- picture-card 模式 -->
  <div
    v-else
    :class="
      cn(
        'border-border bg-accent/10 group relative flex h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-lg border',
        isFailed && 'border-2 border-dashed border-red-400',
        isSuccess && 'border-green-400',
      )
    "
  >
    <!-- 缩略图 -->
    <img
      v-if="thumbnailUrl"
      :alt="file.name"
      class="h-full w-full object-cover"
      :src="thumbnailUrl"
    />

    <!-- 非图片图标占位 -->
    <div
      v-else
      class="text-muted-foreground flex h-full w-full items-center justify-center"
    >
      <File class="h-8 w-8" />
    </div>

    <!-- 遮罩：上传中 -->
    <div
      v-if="isUploading"
      class="absolute inset-0 flex flex-col items-center justify-center bg-black/40"
    >
      <Loader2 class="h-5 w-5 animate-spin text-white" />
      <span class="mt-1 text-xs text-white">{{ computedPercent }}%</span>
    </div>

    <!-- 遮罩：成功 -->
    <div
      v-else-if="isSuccess"
      class="absolute inset-0 flex items-center justify-center bg-black/30"
    >
      <CheckCircle2 class="h-6 w-6 text-green-400" />
    </div>

    <!-- 遮罩：失败 -->
    <div
      v-else-if="isFailed"
      class="bg-destructive/10 absolute inset-0 flex flex-col items-center justify-center"
    >
      <AlertCircle class="h-5 w-5 text-red-500" />
      <button
        v-if="showRetry"
        class="hover:bg-accent mt-1 rounded px-1 py-0.5 text-xs text-red-600"
        type="button"
        @click="emit('retry', file)"
      >
        {{ t('uploadItem.retry') }}
      </button>
    </div>

    <!-- Hover 操作层 -->
    <div
      class="absolute inset-0 hidden items-center justify-center gap-1 bg-black/50 group-hover:flex"
    >
      <button
        :aria-label="t('uploadItem.removeAriaLabel')"
        class="rounded-full bg-white/90 p-1"
        type="button"
        @click="emit('remove', file)"
      >
        <X class="text-foreground h-4 w-4" />
      </button>
    </div>

    <!-- 文件名 -->
    <div
      class="text-muted-foreground absolute -bottom-5 left-0 w-full truncate text-center text-xs"
    >
      {{ file.name }}
    </div>
  </div>
</template>
