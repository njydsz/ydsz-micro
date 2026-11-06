<script setup lang="ts">
/**
 * YdFileUpload —— 业务复合文件上传组件（对标 PrimeVue FileUpload 增强版）。
 *
 * <p>功能特性：
 * <ul>
 *   <li>拖拽上传 / 点击上传</li>
 *   <li>多文件选择 + 文件类型/大小/数量限制</li>
 *   <li>自动上传 / 手动上传队列（submit）</li>
 *   <li>图片预览缩略图</li>
 *   <li>上传进度（YdProgress 组件）</li>
 *   <li>上传失败重试</li>
 *   <li>分片上传（可选）</li>
 *   <li>自定义请求头 / 附加数据</li>
 * </ul>
 *
 * <p>两种呈现模式：text（文件列表）/ picture-card（缩略图卡片）。
 *
 * <p>脚本核心逻辑（列表管理 / 校验 / 上传 / 中止 / 预览）已抽取到
 * {@link useFileUploadCore}，本文件只负责 props / emits、i18n 与模板渲染。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\YdFileUpload.vue
 * @author ydsz-team
 * @since 26.10.12
 */

import type { YdFileUploadEmits, YdFileUploadProps } from './types';

import { computed, ref } from 'vue';

defineOptions({ name: 'YdFileUpload' });

import { useDropZone } from '@vueuse/core';

import { cn } from '@ydsz-core/shared/utils';

import { useLocale } from '../../locale/useLocale';
import { useFileUploadCore } from './use-file-upload-core';
import { YdProgress } from '.././progress';

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  File,
  FileImage,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-vue-next';

/* ============================================================ */
/* Props / Emits                                                   */
/* ============================================================ */

const props = withDefaults(defineProps<YdFileUploadProps>(), {
  accept: undefined,
  action: undefined,
  autoUpload: true,
  chunkSize: 5,
  chunked: false,
  data: () => ({}),
  disabled: false,
  draggable: false,
  dragText: undefined,
  fileList: () => [],
  headers: () => ({}),
  listType: 'text',
  maxCount: undefined,
  maxSize: undefined,
  method: 'POST',
  multipartApiBase: '/api/file/multipart',
  multiple: false,
  name: 'file',
  preview: false,
  showFileList: true,
  uploadText: undefined,
  withCredentials: false,
});

const emit = defineEmits<YdFileUploadEmits>();

/* ============================================================ */
/* i18n                                                            */
/* ============================================================ */

const { t } = useLocale();

/* ============================================================ */
/* 核心逻辑（composable）                                           */
/* ============================================================ */

/** 文件 input 引用 */
const fileInput = ref<HTMLInputElement | null>(null);

/** 拖拽区域 ref */
const dropZoneRef = ref<HTMLElement | null>(null);

const {
  abortFileUpload,
  clearFiles,
  currentFileList,
  formatFileSize,
  getFileIconType,
  getFileList,
  getThumbnailUrl,
  handleInputChange,
  handleIncomingFiles,
  handlePreview,
  isFileError,
  isFileReady,
  isFileSuccess,
  isFileUploading,
  isImage,
  openFilePicker,
  previewFile,
  previewVisible,
  removeFile,
  retryFile,
  submitReadyFiles,
} = useFileUploadCore({ emit, fileInput, props });

/* ============================================================ */
/* useDropZone                                                     */
/* ============================================================ */

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files: File[] | null) => {
    if (files && files.length > 0) {
      handleIncomingFiles(files);
    }
  },
  preventDefaultForUnhandled: true,
});

/* ============================================================ */
/* 命令式 API（defineExpose）                                       */
/* ============================================================ */

defineExpose({
  abort: abortFileUpload,
  clear: () => {
    abortFileUpload();
    clearFiles();
  },
  getFileList,
  submit: submitReadyFiles,
});

/* ============================================================ */
/* 样式计算属性                                                     */
/* ============================================================ */

const isPictureCard = computed(() => props.listType === 'picture-card');
const isLimitReached = computed(() =>
  props.maxCount ? currentFileList.value.length >= props.maxCount : false,
);

const resolvedUploadText = computed(() => props.uploadText ?? t('fileUpload.clickToUpload'));
const resolvedDragText = computed(() => props.dragText ?? t('fileUpload.dragAndDrop'));

const dropZoneClass = computed(() =>
  cn(
    'border-border bg-muted/20 hover:bg-muted/30 flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
    isOverDropZone.value && 'border-primary bg-primary/5',
    props.disabled && 'pointer-events-none opacity-50',
  ),
);

const pictureCardDropClass = computed(() =>
  cn(
    'border-border bg-accent/10 hover:bg-accent/20 flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors',
    isOverDropZone.value && 'border-primary bg-primary/5',
    props.disabled && 'pointer-events-none opacity-50',
  ),
);
</script>

<template>
  <div :class="[isPictureCard ? 'flex flex-wrap gap-3' : 'flex flex-col gap-3']">
    <!-- ========== 拖拽区域（text 模式 + draggable） ========== -->
    <div
      v-if="!isPictureCard && draggable"
      ref="dropZoneRef"
      :class="dropZoneClass"
      role="button"
      tabindex="0"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
    >
      <UploadCloud class="text-muted-foreground h-10 w-10" />
      <span class="text-muted-foreground text-sm font-medium">
        {{ resolvedDragText }}
      </span>
      <span class="text-muted-foreground text-xs">
        {{ resolvedUploadText }}
      </span>
    </div>

    <!-- ========== 普通按钮（text 模式，非 draggable） ========== -->
    <button
      v-else-if="!isPictureCard"
      :class="
        cn(
          'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium',
          'focus-visible:outline-none focus-visible:ring-2',
          'disabled:pointer-events-none disabled:opacity-50',
        )
      "
      :disabled="disabled || isLimitReached"
      type="button"
      @click="openFilePicker"
    >
      <UploadCloud class="h-4 w-4" />
      <span>{{ resolvedUploadText }}</span>
    </button>

    <!-- ========== picture-card 上传卡片 ========== -->
    <div
      v-if="isPictureCard && !isLimitReached"
      ref="dropZoneRef"
      :class="pictureCardDropClass"
      role="button"
      tabindex="0"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
    >
      <Plus class="text-muted-foreground h-7 w-7" />
      <span class="text-muted-foreground text-xs">
        {{ resolvedUploadText }}
      </span>
    </div>

    <!-- ========== 隐藏 input ========== -->
    <input
      ref="fileInput"
      :accept="accept"
      :disabled="disabled"
      class="hidden"
      :multiple="multiple"
      type="file"
      @change="handleInputChange"
    />

    <!-- ========== 文件列表：text 模式 ========== -->
    <div
      v-if="showFileList && !isPictureCard && currentFileList.length > 0"
      class="flex flex-col gap-2"
      role="list"
      :aria-label="t('upload.fileListAriaLabel')"
    >
      <div
        v-for="item in currentFileList"
        :key="item.uid"
        :class="
          cn(
            'bg-accent/20 hover:bg-accent/40 border-border flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
            isFileError(item) && 'border-destructive/30 bg-destructive/5',
            isFileSuccess(item) && 'border-green-400/40',
          )
        "
        role="listitem"
      >
        <!-- 文件类型图标 -->
        <FileImage
          v-if="getFileIconType(item.type) === 'image'"
          class="h-4 w-4 shrink-0 text-blue-500"
        />
        <FileText
          v-else-if="getFileIconType(item.type) === 'pdf'"
          class="h-4 w-4 shrink-0 text-red-500"
        />
        <FileText
          v-else-if="getFileIconType(item.type) === 'text'"
          class="text-muted-foreground h-4 w-4 shrink-0"
        />
        <File v-else class="text-muted-foreground h-4 w-4 shrink-0" />

        <!-- 文件名 + 进度/状态 -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate font-medium">{{ item.name }}</span>
            <span v-if="!isFileUploading(item)" class="text-muted-foreground shrink-0 text-xs">
              {{ formatFileSize(item.size) }}
            </span>
            <span
              v-if="isFileUploading(item)"
              class="text-muted-foreground shrink-0 text-xs tabular-nums"
            >
              {{ item.percent ?? 0 }}%
            </span>
          </div>

          <!-- 进度条（上传中） -->
          <div v-if="isFileUploading(item)" class="mt-1.5">
            <YdProgress :percentage="item.percent ?? 0" />
          </div>

          <!-- 错误提示（失败） -->
          <div
            v-else-if="isFileError(item)"
            class="mt-0.5 flex items-center gap-1 text-xs text-red-500"
          >
            <AlertCircle class="h-3 w-3" />
            <span>{{ item.error ?? t('upload.error') }}</span>
          </div>

          <!-- ready 状态提示 -->
          <div v-else-if="isFileReady(item)" class="text-muted-foreground mt-0.5 text-xs">
            {{ t('fileUpload.fileSize') }}: {{ formatFileSize(item.size) }}
          </div>
        </div>

        <!-- 状态图标 -->
        <CheckCircle2 v-if="isFileSuccess(item)" class="h-4 w-4 shrink-0 text-green-500" />
        <AlertCircle v-else-if="isFileError(item)" class="h-4 w-4 shrink-0 text-red-500" />
        <Loader2
          v-else-if="isFileUploading(item)"
          class="h-4 w-4 shrink-0 animate-spin text-blue-500"
        />

        <!-- 操作按钮组 -->
        <div class="flex shrink-0 items-center gap-0.5">
          <!-- 预览（仅图片 + preview=true） -->
          <button
            v-if="preview && isImage(item.type)"
            :title="t('upload.preview')"
            class="hover:bg-accent rounded p-1"
            type="button"
            @click="handlePreview(item)"
          >
            <Eye class="text-muted-foreground hover:text-foreground h-3.5 w-3.5" />
          </button>

          <!-- 重试（失败时） -->
          <button
            v-if="isFileError(item)"
            :title="t('upload.retry')"
            class="hover:bg-accent rounded p-1"
            type="button"
            @click="retryFile(item)"
          >
            <RefreshCw class="text-muted-foreground hover:text-foreground h-3.5 w-3.5" />
          </button>

          <!-- 移除 -->
          <button
            :title="t('upload.remove')"
            class="hover:bg-accent rounded p-1"
            type="button"
            @click="removeFile(item)"
          >
            <X class="text-muted-foreground hover:text-foreground h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 文件列表：picture-card 模式 ========== -->
    <div
      v-if="showFileList && isPictureCard && currentFileList.length > 0"
      class="flex flex-wrap gap-3"
      role="list"
      :aria-label="t('upload.fileListAriaLabel')"
    >
      <div
        v-for="item in currentFileList"
        :key="item.uid"
        :class="
          cn(
            'border-border bg-accent/10 group relative flex h-28 w-28 flex-col items-center justify-center overflow-hidden rounded-lg border transition-colors',
            isFileError(item) && 'border-destructive/50 border-2 border-dashed',
            isFileSuccess(item) && 'border-green-400/60',
          )
        "
        role="listitem"
      >
        <!-- 缩略图 -->
        <img
          v-if="getThumbnailUrl(item)"
          :alt="item.name"
          class="h-full w-full object-cover"
          :src="getThumbnailUrl(item)"
        />

        <!-- 非图片占位 -->
        <div
          v-else
          class="text-muted-foreground flex h-full w-full flex-col items-center justify-center"
        >
          <File class="h-8 w-8" />
        </div>

        <!-- 遮罩：上传中 -->
        <div
          v-if="isFileUploading(item)"
          class="absolute inset-0 flex flex-col items-center justify-center bg-black/50"
        >
          <Loader2 class="h-5 w-5 animate-spin text-white" />
          <span class="mt-1 text-xs font-medium tabular-nums text-white">
            {{ item.percent ?? 0 }}%
          </span>
        </div>

        <!-- 遮罩：成功 -->
        <div v-else-if="isFileSuccess(item)" class="absolute right-1 top-1">
          <CheckCircle2 class="h-5 w-5 rounded-full bg-white/80 text-green-500" />
        </div>

        <!-- 遮罩：失败 -->
        <div
          v-else-if="isFileError(item)"
          class="bg-destructive/10 absolute inset-0 flex flex-col items-center justify-center"
        >
          <AlertCircle class="h-5 w-5 text-red-500" />
          <span class="mt-0.5 text-[10px] text-red-600">
            {{ item.error ?? t('upload.error') }}
          </span>
        </div>

        <!-- Hover 操作层 -->
        <div
          class="absolute inset-0 hidden items-center justify-center gap-1 bg-black/50 group-hover:flex"
        >
          <button
            v-if="preview && isImage(item.type)"
            :title="t('upload.preview')"
            class="rounded-full bg-white/90 p-1.5"
            type="button"
            @click="handlePreview(item)"
          >
            <Eye class="text-foreground h-4 w-4" />
          </button>
          <button
            v-if="isFileError(item)"
            :title="t('upload.retry')"
            class="rounded-full bg-white/90 p-1.5"
            type="button"
            @click="retryFile(item)"
          >
            <RefreshCw class="text-foreground h-4 w-4" />
          </button>
          <button
            :title="t('upload.remove')"
            class="rounded-full bg-white/90 p-1.5"
            type="button"
            @click="removeFile(item)"
          >
            <X class="text-foreground h-4 w-4" />
          </button>
        </div>

        <!-- 文件名 -->
        <div
          class="text-muted-foreground absolute -bottom-5 left-0 w-full truncate text-center text-xs"
          :title="item.name"
        >
          {{ item.name }}
        </div>
      </div>
    </div>

    <!-- ========== 图片预览模态 ========== -->
    <Teleport to="body">
      <div
        v-if="previewVisible && previewFile"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
        role="dialog"
        :aria-label="t('common.preview')"
        @click="previewVisible = false"
      >
        <div class="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg" @click.stop>
          <img
            v-if="getThumbnailUrl(previewFile)"
            :alt="previewFile.name"
            class="max-h-[90vh] max-w-[90vw] object-contain"
            :src="getThumbnailUrl(previewFile)"
          />
          <button
            class="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
            type="button"
            @click="previewVisible = false"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="text-muted-foreground absolute bottom-6 left-0 w-full text-center text-sm">
          {{ previewFile.name }} ({{ formatFileSize(previewFile.size) }})
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* 组件作用域样式 —— 绝大部分表现已由 Tailwind + CSS 变量控制 */
</style>
