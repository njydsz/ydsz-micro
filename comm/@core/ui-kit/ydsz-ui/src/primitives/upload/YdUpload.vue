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
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\upload\YdUpload.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type {
  UploadFile,
  UploadRequestOptions,
  UploadUserFile,
} from './types';
import { UploadStatus } from './types';

import { computed, ref } from 'vue';

import { useDropZone } from '@vueuse/core';

import { cn } from '@ydsz-core/shared/utils';

import { CloudUpload } from 'lucide-vue-next';

import YdUploadItem from './YdUploadItem.vue';

const props = withDefaults(
  defineProps<{
    /** 必填 - 上传地址 */
    action?: string;
    /** 是否启用拖拽上传 */
    drag?: boolean;
    /** v-model:file-list */
    fileList?: UploadUserFile[];
    /** 是否禁用 */
    disabled?: boolean;
    /** 限制文件类型，如 '.png,.jpg' 或 'image/*' */
    accept?: string;
    /** 是否多选 */
    multiple?: boolean;
    /** 是否显示文件列表 */
    showFileList?: boolean;
    /** 随请求附带的额外字段 */
    data?: Record<string, string | Blob>;
    /** 自定义请求头 */
    headers?: Record<string, string>;
    /** 表单字段名 */
    name?: string;
    /** 是否携带 cookie */
    withCredentials?: boolean;
    /** 最大上传数量 */
    limit?: number;
    /** 上传前钩子 */
    beforeUpload?: (file: File) => boolean | Promise<boolean>;
    /** 自定义上传方法 */
    httpRequest?: (options: UploadRequestOptions) => Promise<any> | void;
    /** 上传成功回调 */
    onSuccess?: (response: any, file: UploadFile) => void;
    /** 上传失败回调 */
    onError?: (error: Error, file: UploadFile) => void;
    /** 上传进度回调 */
    onProgress?: (percent: number, file: UploadFile) => void;
    /** 文件移除钩子 */
    onRemove?: (file: UploadFile) => void;
  }>(),
  {
    autoUpload: true,
    disabled: false,
    drag: false,
    listType: 'text',
    multiple: false,
    name: 'file',
    showFileList: true,
    withCredentials: false,
  },
);

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
  // 阻止默认行为
  preventDefaultForUnhandled: true,
});

/** 是否已达到数量限制 */
const isLimitReached = computed(() => {
  if (!props.limit) {
    return false;
  }
  return uploadFileList.value.length >= props.limit;
});

/** 拖拽区域样式 */
const dropZoneClass = computed(() =>
  cn(
    'border-border bg-muted/20 hover:bg-muted/30 flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
    isOverDropZone.value && 'border-primary bg-primary/5',
    props.disabled && 'pointer-events-none opacity-50',
  ),
);

/** 触发文件选择 */
function openFilePicker(): void {
  if (props.disabled || isLimitReached.value) {
    return;
  }
  fileInput.value?.click();
}

/**
 * 处理文件改变。
 *
 * @param fileList —— 本次选中的文件列表（原生 File[]）
 */
function handleFiles(fileList: File[]): void {
  for (const file of fileList) {
    if (isLimitReached.value) {
      break;
    }
    // beforeUpload 钩子
    if (props.beforeUpload) {
      const result = props.beforeUpload(file);
      if (result === false) {
        return;
      }
      // Promise 形式
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

  // 使用自定义 http-request
  if (props.httpRequest) {
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
        },
      });
      const pendingValue = uploadItemList.value.map((file) => ({
        name: file.name,
        url: file.url,
      }));
      emit('update:fileList', pendingValue);
    } catch {
      uploadItem.status = UploadStatus.FAIL;
      props.onError?.(new Error('upload failed'), uploadItem);
    }
    return; // 自定义请求完成
  }

  // 默认 fetch 上传
  try {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    // 使用 props.name 作为字段名，未取到用 ‘file’ 兜底
    formData.append(props.name || 'file', rawFile);
    if (props.data) {
      for (const [key, value] of Object.entries(props.data)) {
        formData.append(key, value);
      }
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        uploadItem.percentage = Math.round((event.loaded / event.total) * 100);
        props.onProgress?.(uploadItem.percentage!, uploadItem);
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
        const pendingValue = uploadItemList.value.map((file) => ({
          name: file.name,
          url: file.url,
        }));
        emit('update:fileList', pendingValue);
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
  const pendingValue = uploadItemList.value.map((f) => ({
    name: f.name,
    url: f.url,
  }));
  emit('update:fileList', pendingValue);
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
  <div class="upload-wrapper flex flex-col gap-3">
    <!-- 拖拽区域 或 普通按钮 -->
    <div
      v-if="drag"
      ref="dropZoneRef"
      :class="dropZoneClass"
      role="button"
      tabindex="0"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
    >
      <CloudUpload class="text-muted-foreground h-10 w-10" />
      <span class="text-muted-foreground text-sm">
        将文件拖到此处，或<SPAN class="text-primary cursor-pointer">点击上传</SPAN>
      </span>
    </div>

    <!-- 普通按钮 -->
    <button
      v-else
      :class="cn(
        'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center gap-1 rounded-md px-4 text-sm font-medium',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
      )"
      :disabled="disabled || isLimitReached"
      type="button"
      @click="openFilePicker"
    >
      <CloudUpload class="h-4 w-4" />
      <span>点击上传</span>
    </button>

    <!-- 隐藏 input -->
    <input
      ref="fileInput"
      :accept="accept"
      :disabled="disabled"
      class="hidden"
      :multiple="multiple"
      type="file"
      @change="handleInputChange"
    />

    <!-- 文件列表 -->
    <div
      v-if="showFileList && uploadFileList.length > 0"
      class="flex flex-col gap-2"
    >
      <YdUploadItem
        v-for="file in uploadFileList"
        :key="file.name"
        :file="file"
        @remove="removeFile"
      />
    </div>
  </div>
</template>
