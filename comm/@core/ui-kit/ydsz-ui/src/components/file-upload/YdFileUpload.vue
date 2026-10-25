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
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\YdFileUpload.vue
 * @author ydsz-team
 * @since 26.10.12
 */

import type {
  YdFileUploadEmits,
  YdFileUploadProps,
  UploadFileItem,
  UploadFileStatus,
} from './types';
import type { ChunkUploadHandle } from '../../composables/use-chunk-upload';

import {
  computed,
  ref,
} from 'vue';

defineOptions({ name: 'YdFileUpload' });

import { useDropZone } from '@vueuse/core';

import { cn } from '@ydsz-core/shared/utils';
import { createLogger } from '@ydsz-core/shared/utils';

import {
  useChunkUpload,
} from '../../composables/use-chunk-upload';
import { useComponentI18n } from '../../composables/use-component-i18n';
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
/* 模块级日志                                                      */
/* ============================================================ */

const logger = createLogger('YdFileUpload');

/* ============================================================ */
/* 常量                                                            */
/* ============================================================ */

/** 默认分片大小 5 MB（字节） */
const DEFAULT_CHUNK_BYTES = 5 * 1024 * 1024;

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
  locale: 'zh',
  maxCount: undefined,
  maxSize: undefined,
  method: 'POST',
  multipartApiBase: '/api/v1/system/file/multipart',
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

const fileUploadMessages = {
  en: {
    fileUpload: {
      clickToUpload: 'Click to upload',
      dragAndDrop: 'Drag and drop files here',
      exceedCount: 'Maximum {maxCount} files allowed',
      exceedSize: 'File size exceeds {maxSize} limit',
      fileSize: 'Size',
      preview: 'Preview',
      remove: 'Remove',
      retry: 'Retry',
      submit: 'Upload all',
      uploadFailed: 'Upload failed',
      uploading: 'Uploading',
    },
  },
  zh: {
    fileUpload: {
      clickToUpload: '点击上传',
      dragAndDrop: '将文件拖拽至此处',
      exceedCount: '最多允许上传 {maxCount} 个文件',
      exceedSize: '文件大小超过 {maxSize} 限制',
      fileSize: '大小',
      preview: '预览',
      remove: '移除',
      retry: '重试',
      submit: '全部上传',
      uploadFailed: '上传失败',
      uploading: '上传中',
    },
  },
};

const { t } = useComponentI18n({
  defaultLocale: props.locale,
  messages: fileUploadMessages,
});

/* ============================================================ */
/* 内部状态                                                         */
/* ============================================================ */

/** 内部维护的文件列表 */
const internalFileList = ref<UploadFileItem[]>([]);

/** 受控模式：使用外部 fileList */
const isControlled = computed(() => props.fileList !== undefined && props.fileList !== null);

/** 当前展示的文件列表 */
const currentFileList = computed(() =>
  isControlled.value ? (props.fileList ?? []) : internalFileList.value,
);

/** 文件 input 引用 */
const fileInput = ref<HTMLInputElement | null>(null);

/** 拖拽区域 ref */
const dropZoneRef = ref<HTMLElement | null>(null);

/** 预览模态可见 */
const previewVisible = ref(false);
const previewFile = ref<UploadFileItem | null>(null);

/** 每个文件对应的 AbortController（用于中止上传） */
const abortControllers = ref<Map<string, AbortController>>(new Map());

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
/* 分片上传                                                        */
/* ============================================================ */

const chunkUploader: ChunkUploadHandle | null = props.chunked
  ? useChunkUpload({
      chunkSize: DEFAULT_CHUNK_BYTES,
      multipart: {
        baseURL: props.multipartApiBase ?? '/api/v1/system/file/multipart',
        withCredentials: props.withCredentials,
      },
      withCredentials: props.withCredentials,
    })
  : null;

/* ============================================================ */
/* 工具函数                                                        */
/* ============================================================ */

/**
 * 生成唯一 uid。
 */
function generateUid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 格式化文件大小。
 *
 * @param bytes - 字节数
 */
function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0 || Number.isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * 根据 MIME 返回文件类型图标名。
 *
 * @param type - MIME 类型
 */
function getFileIconType(type: string): 'image' | 'pdf' | 'text' | 'file' {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('text/')) return 'text';
  return 'file';
}

/**
 * 判断为图片文件。
 *
 * @param type - MIME 类型
 */
function isImage(type: string): boolean {
  return type.startsWith('image/');
}

/**
 * 生成缩略图 URL。
 *
 * @param file - UploadFileItem
 */
function getThumbnailUrl(file: UploadFileItem): string | undefined {
  if (file.url) return file.url;
  if (file.raw && isImage(file.type)) {
    return URL.createObjectURL(file.raw);
  }
  return undefined;
}

/* ============================================================ */
/* 文件验证                                                        */
/* ============================================================ */

interface ValidationResult {
  valid: boolean;
  invalidFiles: File[];
  reason?: 'size' | 'count';
}

/**
 * 验证文件是否超出限制。
 *
 * @param files - 待验证的文件
 * @param existingCount - 现有文件数量
 */
function validateFiles(files: File[], existingCount: number): ValidationResult {
  const invalidFiles: File[] = [];

  // 大小校验
  if (props.maxSize) {
    for (const file of files) {
      if (file.size > props.maxSize) {
        invalidFiles.push(file);
      }
    }
  }

  if (invalidFiles.length > 0) {
    return { reason: 'size', valid: false, invalidFiles };
  }

  // 数量校验
  if (props.maxCount) {
    const totalAfterAdd = existingCount + files.length;
    if (totalAfterAdd > props.maxCount) {
      // 超出部分标记为无效
      const available = Math.max(0, props.maxCount - existingCount);
      return { count: 'count', valid: false, invalidFiles: files.slice(available) } as ValidationResult;
    }
  }

  return { valid: true, invalidFiles: [] };
}

/* ============================================================ */
/* 文件处理                                                        */
/* ============================================================ */

/**
 * 触发文件选择器。
 */
function openFilePicker(): void {
  if (props.disabled) return;
  fileInput.value?.click();
}

/**
 * 处理 input change 事件。
 */
function handleInputChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  if (files.length > 0) {
    handleIncomingFiles(files);
  }
  // 清空 value 保证同一文件可重复选择
  target.value = '';
}

/**
 * 处理进入的文件列表（校验 + 创建条目）。
 *
 * @param files - 原生 File 数组
 */
function handleIncomingFiles(files: File[]): void {
  const current = currentFileList.value;

  // 多选过滤
  const acceptedFiles = props.multiple ? files : files.slice(0, 1);

  // 校验
  const result = validateFiles(acceptedFiles, current.length);

  // 数量裁剪（如果超出 maxCount 但部分仍可添加）
  let filesToProcess = acceptedFiles;
  if (!result.valid && result.reason === 'count' && props.maxCount) {
    const available = Math.max(0, props.maxCount - current.length);
    const validFiles = acceptedFiles.slice(0, available);
    const excessFiles = acceptedFiles.slice(available);
    filesToProcess = validFiles;
    if (excessFiles.length > 0) {
      emit('exceed', excessFiles, current);
    }
  } else if (!result.valid && result.reason === 'size') {
    emit('exceed', result.invalidFiles, current);
    // 过滤掉大小超出的文件
    const invalidSet = new Set(result.invalidFiles);
    filesToProcess = acceptedFiles.filter((f) => !invalidSet.has(f));
  }

  if (filesToProcess.length === 0) return;

  const newItems: UploadFileItem[] = filesToProcess.map((file) => ({
    uid: generateUid(),
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    status: 'ready' as UploadFileStatus,
    percent: 0,
    raw: file,
  }));

  // 数量限制截断（添加后总长度）
  let finalItems = [...current, ...newItems];
  if (props.maxCount && finalItems.length > props.maxCount) {
    finalItems = finalItems.slice(0, props.maxCount);
  }

  // 更新列表
  updateFileList(finalItems);

  // 触发 change
  for (const item of newItems) {
    if (finalItems.includes(item)) {
      emit('change', item, finalItems);
    }
  }

  // 自动上传
  if (props.autoUpload) {
    for (const item of newItems) {
      if (finalItems.includes(item)) {
        void uploadFile(item);
      }
    }
  }
}

/* ============================================================ */
/* 列表同步                                                        */
/* ============================================================ */

/**
 * 同步文件列表到受控 / 非受控状态。
 *
 * @param list - 新文件列表
 */
function updateFileList(list: UploadFileItem[]): void {
  if (isControlled.value) {
    emit('update:fileList', list);
  } else {
    internalFileList.value = list;
  }
}

/**
 * 更新单个文件项。
 *
 * @param uid  - 文件 uid
 * @param patch - 部分更新字段
 */
function patchFileItem(uid: string, patch: Partial<UploadFileItem>): void {
  const list = [...currentFileList.value];
  const idx = list.findIndex((f) => f.uid === uid);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch } as UploadFileItem;
  updateFileList(list);
}

/* ============================================================ */
/* 上传执行                                                        */
/* ============================================================ */

/**
 * 上传单个文件。
 *
 * @param item - UploadFileItem
 */
async function uploadFile(item: UploadFileItem): Promise<void> {
  const raw = item.raw;
  if (!raw) return;

  patchFileItem(item.uid, { status: 'uploading', percent: 0 });

  // 分片上传
  if (props.chunked && chunkUploader) {
    return handleChunkUpload(item, raw);
  }

  // 标准 XHR 上传
  return handleXhrUpload(item, raw);
}

/**
 * XHR 上传实现。
 *
 * @param item - UploadFileItem
 * @param raw  - File
 */
function handleXhrUpload(item: UploadFileItem, raw: File): void {
  const ctrl = new AbortController();
  abortControllers.value.set(item.uid, ctrl);

  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  formData.append(props.name ?? 'file', raw);

  if (props.data) {
    for (const [key, val] of Object.entries(props.data)) {
      formData.append(key, val);
    }
  }

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const pct = Math.round((event.loaded / event.total) * 100);
      patchFileItem(item.uid, { percent: pct });
      emit('progress', pct, { ...item, percent: pct, status: 'uploading' });
    }
  };

  xhr.onload = () => {
    abortControllers.value.delete(item.uid);
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        patchFileItem(item.uid, { status: 'success', percent: 100, url: response?.data ?? response?.url });
        const updated = currentFileList.value.find((f) => f.uid === item.uid)!;
        emit('success', response, updated);
        emit('change', updated, currentFileList.value);
      } catch {
        patchFileItem(item.uid, { status: 'success', percent: 100 });
        const updated = currentFileList.value.find((f) => f.uid === item.uid)!;
        emit('success', xhr.responseText, updated);
        emit('change', updated, currentFileList.value);
      }
    } else {
      const error = new Error(`HTTP ${xhr.status}`);
      patchFileItem(item.uid, { status: 'error', error: error.message });
      emit('error', error, { ...item, status: 'error' });
    }
  };

  xhr.onerror = () => {
    abortControllers.value.delete(item.uid);
    const error = new Error('Network error');
    patchFileItem(item.uid, { status: 'error', error: error.message });
    emit('error', error, { ...item, status: 'error' });
  };

  xhr.onabort = () => {
    abortControllers.value.delete(item.uid);
    patchFileItem(item.uid, { status: 'ready', percent: 0 });
  };

  xhr.open(props.method ?? 'POST', props.action ?? '');

  if (props.headers) {
    for (const [key, val] of Object.entries(props.headers)) {
      xhr.setRequestHeader(key, val);
    }
  }
  if (props.withCredentials) {
    xhr.withCredentials = true;
  }

  // abort signal 监听
  ctrl.signal.addEventListener('abort', () => xhr.abort());

  try {
    xhr.send(formData);
  } catch (err) {
    abortControllers.value.delete(item.uid);
    const error = err instanceof Error ? err : new Error(String(err));
    patchFileItem(item.uid, { status: 'error', error: error.message });
    emit('error', error, { ...item, status: 'error' });
  }
}

/**
 * 分片上传实现。
 *
 * @param item - UploadFileItem
 * @param raw  - File
 */
function handleChunkUpload(item: UploadFileItem, raw: File): void {
  if (!chunkUploader) return;

  void chunkUploader.httpRequest({
    action: props.action ?? '',
    file: raw,
    filename: props.name ?? 'file',
    headers: props.headers,
    onError: (err) => {
      logger.error('分片上传失败: {}', err.message);
      patchFileItem(item.uid, { status: 'error', error: err.message });
      emit('error', err, { ...item, status: 'error' });
    },
    onProgress: ({ percentage }) => {
      patchFileItem(item.uid, { percent: percentage });
      emit('progress', percentage, { ...item, percent: percentage, status: 'uploading' });
    },
    onSuccess: (response) => {
      patchFileItem(item.uid, { status: 'success', percent: 100 });
      const updated = currentFileList.value.find((f) => f.uid === item.uid)!;
      emit('success', response, updated);
      emit('change', updated, currentFileList.value);
    },
    withCredentials: props.withCredentials,
  });
}

/* ============================================================ */
/* 移除 / 重试 / 预览                                              */
/* ============================================================ */

/**
 * 移除文件。
 *
 * @param item - 要移除的文件
 */
function removeFile(item: UploadFileItem): void {
  // 先中止可能正在进行的上传
  abortFileUpload(item.uid);

  const list = currentFileList.value.filter((f) => f.uid !== item.uid);
  updateFileList(list);
  emit('remove', item, list);
  emit('change', item, list);
}

/**
 * 重试上传。
 *
 * @param item - 上传失败的文件
 */
function retryFile(item: UploadFileItem): void {
  patchFileItem(item.uid, { status: 'ready', percent: 0, error: undefined });
  void uploadFile(item);
}

/**
 * 中止某个文件的上传。
 *
 * @param uid - 文件 uid（可选，不传则中止所有）
 */
function abortFileUpload(uid?: string): void {
  if (uid) {
    const ctrl = abortControllers.value.get(uid);
    if (ctrl) {
      ctrl.abort();
      abortControllers.value.delete(uid);
    }
  } else {
    for (const [id, ctrl] of abortControllers.value) {
      ctrl.abort();
      abortControllers.value.delete(id);
    }
  }
}

/**
 * 预览图片。
 *
 * @param item - 要预览的文件
 */
function handlePreview(item: UploadFileItem): void {
  if (!isImage(item.type)) return;
  previewFile.value = item;
  previewVisible.value = true;
  emit('preview', item);
}

/* ============================================================ */
/* 命令式 API（defineExpose）                                       */
/* ============================================================ */

/**
 * 手动上传所有 ready 状态的文件。
 */
function submitReadyFiles(): void {
  const ready = currentFileList.value.filter((f) => f.status === 'ready');
  for (const item of ready) {
    void uploadFile(item);
  }
}

defineExpose({
  abort: abortFileUpload,
  clear: () => {
    abortFileUpload();
    updateFileList([]);
  },
  submit: submitReadyFiles,
  getFileList: () => currentFileList.value,
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

/* ============================================================ */
/* 文件项状态判断工具                                                */
/* ============================================================ */

function isFileUploading(item: UploadFileItem): boolean {
  return item.status === 'uploading';
}

function isFileError(item: UploadFileItem): boolean {
  return item.status === 'error';
}

function isFileSuccess(item: UploadFileItem): boolean {
  return item.status === 'success';
}

function isFileReady(item: UploadFileItem): boolean {
  return item.status === 'ready';
}
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
      :class="cn(
        'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
      )"
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
      aria-label="上传文件列表"
    >
      <div
        v-for="item in currentFileList"
        :key="item.uid"
        :class="cn(
          'bg-accent/20 hover:bg-accent/40 border-border flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
          isFileError(item) && 'border-destructive/30 bg-destructive/5',
          isFileSuccess(item) && 'border-green-400/40',
        )"
        role="listitem"
      >
        <!-- 文件类型图标 -->
        <FileImage
          v-if="getFileIconType(item.type) === 'image'"
          class="text-blue-500 h-4 w-4 shrink-0"
        />
        <FileText
          v-else-if="getFileIconType(item.type) === 'pdf'"
          class="text-red-500 h-4 w-4 shrink-0"
        />
        <FileText
          v-else-if="getFileIconType(item.type) === 'text'"
          class="text-muted-foreground h-4 w-4 shrink-0"
        />
        <File
          v-else
          class="text-muted-foreground h-4 w-4 shrink-0"
        />

        <!-- 文件名 + 进度/状态 -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate font-medium">{{ item.name }}</span>
            <span
              v-if="!isFileUploading(item)"
              class="text-muted-foreground shrink-0 text-xs"
            >
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
          <div
            v-if="isFileUploading(item)"
            class="mt-1.5"
          >
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
          <div
            v-else-if="isFileReady(item)"
            class="text-muted-foreground mt-0.5 text-xs"
          >
            {{ t('fileUpload.fileSize') }}: {{ formatFileSize(item.size) }}
          </div>
        </div>

        <!-- 状态图标 -->
        <CheckCircle2
          v-if="isFileSuccess(item)"
          class="h-4 w-4 shrink-0 text-green-500"
        />
        <AlertCircle
          v-else-if="isFileError(item)"
          class="h-4 w-4 shrink-0 text-red-500"
        />
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
      aria-label="上传文件列表"
    >
      <div
        v-for="item in currentFileList"
        :key="item.uid"
        :class="cn(
          'border-border bg-accent/10 group relative flex h-28 w-28 flex-col items-center justify-center overflow-hidden rounded-lg border transition-colors',
          isFileError(item) && 'border-destructive/50 border-2 border-dashed',
          isFileSuccess(item) && 'border-green-400/60',
        )"
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
          <span class="mt-1 text-xs font-medium text-white tabular-nums">
            {{ item.percent ?? 0 }}%
          </span>
        </div>

        <!-- 遮罩：成功 -->
        <div
          v-else-if="isFileSuccess(item)"
          class="absolute right-1 top-1"
        >
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
        aria-label="图片预览"
        @click="previewVisible = false"
      >
        <div
          class="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg"
          @click.stop
        >
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
