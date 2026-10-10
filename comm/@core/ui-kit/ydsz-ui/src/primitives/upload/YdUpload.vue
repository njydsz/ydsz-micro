<!--
 * YdUpload 组件 - 文件上传封装，提供与 ElUpload 对齐的核心 API。
 *
 * 支持属性：
 * - action: 必填，上传 URL
 * - multiple: 是否允许多选
 * - accept: 限制文件类型
 * - disabled: 禁用
 * - file-list: v-model 双向绑定文件列表
 * - show-file-list: 是否展示文件列表
 * - drag: 是否启用拖拽上传
 * - before-upload: 上传前钩子（返回 false 或 Promise<false> 则阻止上传）
 * - on-success / on-error / on-progress: 回调钩子
 * - http-request: 自定义上传方法（覆盖默认 fetch）
 * - name: 表单字段名，默认 'file'
 * - data: 随请求附带的额外字段
 * - headers: 自定义请求头
 * - with-credentials: 是否携带 cookie
 * - limit: 最大允许上传数量
 * - auto-upload: 是否自动上传，默认 true
 * - list-type: text | picture-card，默认 text
 * - enable-chunk-upload: 是否启用分片上传，默认 false
 * - chunk-size: 分片大小（字节），默认 5MB
 * - max-retries: 分片最大重试次数，默认 3
 * - max-concurrency: 分片并发数，默认 3
 * - multipart-api-base: 分片上传 API 基础路径
 * - storage-key: 对象存储路径（启用分片上传时必填）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\upload\YdUpload.vue
 * @author ydsz-team
 * @since 26.09.24
-->
<script setup lang="ts">
import type {
  ChunkHttpRequestOptions,
  ChunkUploadHandle,
} from '../../composables/use-chunk-upload';
import type {
  UploadFile,
  UploadRequestOptions,
  UploadUserFile,
} from './types';
import { UploadStatus } from './types';

import { computed, ref } from 'vue';

import { useDropZone } from '@vueuse/core';

import {
  useChunkUpload,
} from '../../composables/use-chunk-upload';
import { cn } from '@ydsz-core/shared/utils';

import { CloudUpload, Plus } from 'lucide-vue-next';

import { useComponentI18n } from '../../composables/use-component-i18n';

import YdUploadItem from './YdUploadItem.vue';

/** Upload 组件 i18n 消息定义 */
const uploadMessages = {
  zh: {
    upload: {
      chunkUploading: '分片上传中 ({percent}%)',
      clickToUpload: '点击上传',
      dragTipPrefix: '将文件拖到此处，或',
      retry: '重试',
      uploadError: '上传失败',
      uploadSuccess: '上传成功',
      uploading: '上传中',
    },
  },
  en: {
    upload: {
      chunkUploading: 'Chunk uploading ({percent}%)',
      clickToUpload: 'Click to upload',
      dragTipPrefix: 'Drag files here, or ',
      retry: 'Retry',
      uploadError: 'Upload failed',
      uploadSuccess: 'Upload success',
      uploading: 'Uploading',
    },
  },
};

const props = withDefaults(
  defineProps<{
    /** 上传地址 */
    action?: string;
    /** 是否自动上传 */
    autoUpload?: boolean;
    /** 分片上传 API 基础路径 */
    multipartApiBase?: string;
    /** 分片大小（字节），默认 5 MB */
    chunkSize?: number;
    /** 限制文件类型，如 '.png,.jpg' 或 'image/*' */
    accept?: string;
    /** 随请求附带的额外字段 */
    data?: Record<string, string | Blob>;
    /** 是否启用拖拽上传 */
    isDrag?: boolean;
    /** v-model:file-list */
    fileList?: UploadUserFile[];
    /** 是否禁用 */
    isDisabled?: boolean;
    /** 自定义请求头 */
    headers?: Record<string, string>;
    /** 最大上传数量 */
    limit?: number;
    /** 当前语言，默认 'zh' */
    locale?: string;
    /** 分片并发数，默认 3 */
    maxConcurrency?: number;
    /** 分片最大重试次数，默认 3 */
    maxRetries?: number;
    /** 是否多选 */
    isMultiple?: boolean;
    /** 是否启用分片上传 */
    enableChunkUpload?: boolean;
    /** 呈现模式：text | picture-card */
    listType?: 'text' | 'picture-card';
    /** 表单字段名 */
    name?: string;
    /** 是否显示文件列表 */
    showFileList?: boolean;
    /** 对象存储 key（分片上传时可选） */
    storageKey?: string;
    /** 是否携带 cookie */
    withCredentials?: boolean;
    /** 上传前钩子 */
    beforeUpload?: (file: File) => boolean | Promise<boolean>;
    /** 自定义上传方法 */
    httpRequest?: (options: UploadRequestOptions) => Promise<unknown> | void;
    /** 上传成功回调 */
    onSuccess?: (response: unknown, file: UploadFile) => void;
    /** 上传失败回调 */
    onError?: (error: Error, file: UploadFile) => void;
    /** 上传进度回调 */
    onProgress?: (percent: number, file: UploadFile) => void;
    /** 文件移除钩子 */
    onRemove?: (file: UploadFile) => void;
  }>(),
  {
    autoUpload: true,
    chunkSize: 5 * 1024 * 1024,
    enableChunkUpload: false,
    isDisabled: false,
    isDrag: false,
    isMultiple: false,
    listType: 'text',
    locale: 'zh',
    maxConcurrency: 3,
    maxRetries: 3,
    multipartApiBase: '/api/v1/system/file/multipart',
    name: 'file',
    showFileList: true,
    withCredentials: false,
  },
);

const { t } = useComponentI18n({
  defaultLocale: props.locale,
  messages: uploadMessages,
});

const emit = defineEmits<{
  (e: 'update:fileList', value: UploadUserFile[]): void;
}>();

/** 内部上传中的文件列表 */
const uploadFileList = ref<UploadFile[]>([]);

/** 文件 input 引用 */
const fileInput = ref<HTMLInputElement | null>(null);

/** 拖拽区域 */
const dropZoneRef = ref<HTMLElement | null>(null);
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files: File[] | null) => {
    if (files && files.length > 0) {
      handleFiles(files);
    }
  },
  preventDefaultForUnhandled: true,
});

/**
 * 分片上传句柄 —— 仅在 enableChunkUpload=true 时构造。
 */
const chunkUploader: ChunkUploadHandle = useChunkUpload({
  chunkSize: props.chunkSize,
  maxConcurrency: props.maxConcurrency,
  maxRetries: props.maxRetries,
  multipart: props.enableChunkUpload
    ? {
        baseURL: props.multipartApiBase,
        withCredentials: props.withCredentials,
      }
    : undefined,
  withCredentials: props.withCredentials,
});

/** 是否已达到数量限制 */
const isLimitReached = computed(() => {
  if (!props.limit) {
    return false;
  }
  return uploadFileList.value.length >= props.limit;
});

/** 是否为 picture-card 模式 */
const isPictureCard = computed(() => props.listType === 'picture-card');

/** 拖拽区域样式 */
const dropZoneClass = computed(() =>
  cn(
    'border-border bg-muted/20 hover:bg-muted/30 flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
    isOverDropZone.value && 'border-primary bg-primary/5',
    props.isDisabled && 'pointer-events-none opacity-50',
  ),
);

/** picture-card 拖拽区域样式 */
const pictureCardDropClass = computed(() =>
  cn(
    'border-border bg-accent/10 hover:bg-accent/20 flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors',
    isOverDropZone.value && 'border-primary bg-primary/5',
    props.isDisabled && 'pointer-events-none opacity-50',
  ),
);

/** 触发文件选择 */
function openFilePicker(): void {
  if (props.isDisabled || isLimitReached.value) {
    return;
  }
  fileInput.value?.click();
}

/**
 * 处理文件改变。
 *
 * @param files —— 本次选中的文件列表（原生 File[]）
 */
function handleFiles(files: File[]): void {
  for (const file of files) {
    if (isLimitReached.value) {
      break;
    }
    if (props.beforeUpload) {
      const result = props.beforeUpload(file);
      if (result === false) {
        return;
      }
      if (result instanceof Promise) {
        void result.then((allowed) => {
          if (allowed) {
            void uploadFile(file);
          }
        });
        return;
      }
    }
    void uploadFile(file);
  }
}

/**
 * 上传单个文件。
 *
 * <p>当 enableChunkUpload=true 时 > chunkSize 的文件走分片上传，
 * 小文件或未启用分片时走整文件上传。
 *
 * @param rawFile —— 原生 File
 */
async function uploadFile(rawFile: File): Promise<void> {
  const uploadItem: UploadFile = {
    name: rawFile.name,
    percentage: 0,
    raw: rawFile,
    size: rawFile.size,
    status: UploadStatus.UPLOADING,
    id: `${Date.now()}-${rawFile.name}`,
  };
  uploadFileList.value.push(uploadItem);

  // 1. 自定义 httpRequest 优先级最高
  if (props.httpRequest) {
    await handleCustomRequest(rawFile, uploadItem);
    return;
  }

  // 2. 分片上传模式
  if (props.enableChunkUpload) {
    return handleChunkUpload(rawFile, uploadItem);
  }

  // 3. 默认整文件上传
  return handleDefaultUpload(rawFile, uploadItem);
}

/**
 * 自定义 http-request 上传。
 *
 * @param rawFile —— 原生 File
 * @param uploadItem —— 上传文件对象
 */
async function handleCustomRequest(
  rawFile: File,
  uploadItem: UploadFile,
): Promise<void> {
  if (!props.httpRequest) return;
  try {
    await props.httpRequest({
      action: props.action ?? '',
      data: props.data,
      file: rawFile,
      headers: props.headers,
      name: props.name,
      onError: (err) => {
        uploadItem.status = UploadStatus.FAIL;
        props.onError?.(err, uploadItem);
      },
      onProgress: (event) => {
        uploadItem.percentage = event.percent;
        props.onProgress?.(event.percent, uploadItem);
      },
      onSuccess: (response) => {
        uploadItem.status = UploadStatus.SUCCESS;
        uploadItem.response = response;
        props.onSuccess?.(response, uploadItem);
        syncFileListToEmit();
      },
    });
  } catch {
    uploadItem.status = UploadStatus.FAIL;
    props.onError?.(new Error('upload failed'), uploadItem);
  }
}

/**
 * 分片上传模式。
 *
 * @param rawFile —— 原生 File
 * @param uploadItem —— 上传文件对象
 */
function handleChunkUpload(
  rawFile: File,
  uploadItem: UploadFile,
): void {
  const chunkReq: ChunkHttpRequestOptions = {
    action: props.action ?? '',
    file: rawFile,
    filename: props.name,
    headers: props.headers,
    onError: (err) => {
      uploadItem.status = UploadStatus.FAIL;
      props.onError?.(err, uploadItem);
    },
    onProgress: ({ percentage }) => {
      uploadItem.percentage = percentage;
      props.onProgress?.(percentage, uploadItem);
    },
    onSuccess: (response) => {
      uploadItem.status = UploadStatus.SUCCESS;
      uploadItem.response = response;
      props.onSuccess?.(response, uploadItem);
      syncFileListToEmit();
    },
    storageKey: props.storageKey,
    withCredentials: props.withCredentials,
  };

  void chunkUploader.httpRequest(chunkReq);
}

/**
 * 默认 XHR 整文件上传。
 *
 * @param rawFile —— 原生 File
 * @param uploadItem —— 上传文件对象
 */
function handleDefaultUpload(
  rawFile: File,
  uploadItem: UploadFile,
): void {
  try {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append(props.name || 'file', rawFile);
    if (props.data) {
      for (const [key, value] of Object.entries(props.data)) {
        formData.append(key, value);
      }
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        uploadItem.percentage = Math.round((event.loaded / event.total) * 100);
        props.onProgress?.(uploadItem.percentage, uploadItem);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        uploadItem.status = UploadStatus.SUCCESS;
        try {
          uploadItem.response = JSON.parse(xhr.responseText);
        } catch {
          uploadItem.response = xhr.responseText;
        }
        props.onSuccess?.(uploadItem.response, uploadItem);
        syncFileListToEmit();
      } else {
        uploadItem.status = UploadStatus.FAIL;
        props.onError?.(new Error(`HTTP ${xhr.status}`), uploadItem);
      }
    };

    xhr.onerror = () => {
      uploadItem.status = UploadStatus.FAIL;
      props.onError?.(new Error('Network error'), uploadItem);
    };

    xhr.open('POST', props.action ?? '');
    if (props.headers) {
      for (const [key, value] of Object.entries(props.headers)) {
        xhr.setRequestHeader(key, value);
      }
    }
    if (props.withCredentials) {
      xhr.withCredentials = true;
    }
    xhr.send(formData);
  } catch (error) {
    uploadItem.status = UploadStatus.FAIL;
    props.onError?.(error as Error, uploadItem);
  }
}

/**
 * 同步内部文件列表到 v-model 输出。
 */
function syncFileListToEmit(): void {
  const pendingValue = uploadFileList.value.map((file) => ({
    name: file.name,
    url: file.url,
  }));
  emit('update:fileList', pendingValue);
}

/**
 * 触发原生 input change。
 *
 * @param event —— input change 事件
 */
function handleInputChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  handleFiles(files);
  // 清空 value 保证同一文件可以再次选择
  target.value = '';
}

/**
 * 移除文件。
 *
 * @param file —— 待移除的文件对象
 */
function removeFile(file: UploadFile): void {
  uploadFileList.value = uploadFileList.value.filter((f) => f !== file);
  props.onRemove?.(file);
  syncFileListToEmit();
}

/**
 * 重试上传失败的文件。
 *
 * @param file —— 需要重试的文件对象
 */
function retryFile(file: UploadFile): void {
  if (file.raw) {
    void uploadFile(file.raw);
  }
}

/** 暴露 clearFiles 方法，对齐 ElUpload 暴露的实例方法 */
function clearFiles(): void {
  uploadFileList.value = [];
  emit('update:fileList', []);
}

defineExpose({
  clearFiles,
});
</script>

<template>
  <div :class="[isPictureCard ? 'flex flex-wrap gap-3' : 'flex flex-col gap-3']">
    <!-- text 模式：拖拽区域 -->
    <div
      v-if="!isPictureCard && isDrag"
      ref="dropZoneRef"
      :class="dropZoneClass"
      role="button"
      tabindex="0"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
    >
      <CloudUpload class="text-muted-foreground h-10 w-10" />
      <span class="text-muted-foreground text-sm">
        {{ t('upload.dragTipPrefix') }}<span class="text-primary cursor-pointer">{{ t('upload.clickToUpload') }}</span>
      </span>
    </div>

    <!-- text 模式：普通按钮 -->
    <button
      v-else-if="!isPictureCard"
      :class="cn(
        'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-1 rounded-md px-4 text-sm font-medium',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
      )"
      :disabled="isDisabled || isLimitReached"
      type="button"
      @click="openFilePicker"
    >
      <CloudUpload class="h-4 w-4" />
      <span>{{ t('upload.clickToUpload') }}</span>
    </button>

    <!-- 隐藏 input -->
    <input
      ref="fileInput"
      :accept="accept"
      :disabled="isDisabled"
      class="hidden"
      :multiple="isMultiple"
      type="file"
      @change="handleInputChange"
    />

    <!-- picture-card 模式：上传卡片始终在file list顶部 -->
    <div
      v-if="isPictureCard && !isLimitReached"
      :ref="(el: unknown) => { dropZoneRef = (el as HTMLElement) ?? null; }"
      :class="pictureCardDropClass"
      role="button"
      tabindex="0"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
    >
      <Plus class="text-muted-foreground h-6 w-6" />
      <span class="text-muted-foreground text-xs">
        {{ t('upload.clickToUpload') }}
      </span>
    </div>

    <!-- 文件列表 -->
    <div
      v-if="showFileList && uploadFileList.length > 0"
      :class="isPictureCard ? 'flex flex-wrap gap-3' : 'flex flex-col gap-2'"
    >
      <YdUploadItem
        v-for="file in uploadFileList"
        :key="file.id ?? file.name"
        :file="file"
        :list-type="listType"
        :locale="locale"
        @remove="removeFile"
        @retry="retryFile"
      />
    </div>
  </div>
</template>
