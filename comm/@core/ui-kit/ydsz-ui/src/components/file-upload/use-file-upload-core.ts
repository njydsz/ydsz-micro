/**
 * useFileUploadCore —— YdFileUpload 脚本核心逻辑（组合入口）。
 *
 * <p>本文件为组合入口，职责拆分如下：
 * <ul>
 *   <li>{@link file-upload-utils.ts} —— 纯函数（formatFileSize / getFileIconType / isImage / getThumbnailUrl / generateUid）</li>
 *   <li>{@link use-file-list.ts} —— 文件列表状态管理（currentFileList / updateFileList / patchFileItem / clearFiles）</li>
 *   <li>{@link use-file-validation.ts} —— 文件校验（maxSize / maxCount）</li>
 *   <li>{@link use-upload-executor.ts} —— 上传执行（XHR / 分片上传 / 中止控制）</li>
 * </ul>
 *
 * <p>本文件负责编排上述模块，并保留 incoming 文件处理、预览、
 * 移除 / 重试 / 命令式 API 等胶水逻辑。
 * 行为契约（props / emits / expose）完全不变。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\use-file-upload-core.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import type {
  UploadFileItem,
  UploadFileStatus,
  YdFileUploadEmits,
  YdFileUploadProps,
} from './types';
import type { ChunkUploadHandle } from '../../composables/use-chunk-upload';
import type { ComputedRef, Ref, UnwrapRef } from 'vue';

import { ref } from 'vue';

import { useChunkUpload } from '../../composables/use-chunk-upload';

import { useFileList } from './use-file-list';
import { validateFiles } from './use-file-validation';
import { useUploadExecutor } from './use-upload-executor';
import {
  DEFAULT_CHUNK_BYTES,
  formatFileSize,
  generateUid,
  getFileIconType,
  getThumbnailUrl,
  isImage,
} from './file-upload-utils';

import type { FileValidationResult } from './use-file-validation';

/* ============================================================ */
/* Re-export（保持对外 API 完全不变）                              */
/* ============================================================ */

export { DEFAULT_CHUNK_BYTES, formatFileSize, getFileIconType, getThumbnailUrl, isImage };
export type { FileValidationResult };

/* ============================================================ */
/* 类型定义                                                      */
/* ============================================================ */

/** useFileUploadCore 配置 */
export interface UseFileUploadCoreOptions {
  /** 组件 props（响应式） */
  props: UnwrapRef<YdFileUploadProps>;
  /** 组件 emits 触发器 */
  emit: YdFileUploadEmits;
  /** 原生 file input 引用（由组件持有） */
  fileInput: Ref<HTMLInputElement | null>;
}

/** useFileUploadCore 返回句柄 */
export interface UseFileUploadCoreReturn {
  /** 当前展示的文件列表（受控取 props.fileList，否则取内部） */
  currentFileList: ComputedRef<UploadFileItem[]>;
  /** 受控模式标记 */
  isControlled: ComputedRef<boolean>;
  /** 预览模态可见 */
  previewVisible: Ref<boolean>;
  /** 当前预览文件 */
  previewFile: Ref<UploadFileItem | null>;
  /** 触发文件选择器 */
  openFilePicker: () => void;
  /** 处理 input change */
  handleInputChange: (event: Event) => void;
  /** 处理进入的文件（校验 + 入库 + 自动上传） */
  handleIncomingFiles: (files: File[]) => void;
  /** 移除文件 */
  removeFile: (item: UploadFileItem) => void;
  /** 重试上传 */
  retryFile: (item: UploadFileItem) => void;
  /** 中止上传（不传 uid 则中止全部） */
  abortFileUpload: (uid?: string) => void;
  /** 预览图片 */
  handlePreview: (item: UploadFileItem) => void;
  /** 手动上传所有 ready 文件 */
  submitReadyFiles: () => void;
  /** 清空文件列表 */
  clearFiles: () => void;
  /** 格式化文件大小 */
  formatFileSize: (bytes: number | undefined) => string;
  /** 根据 MIME 返回文件类型图标名 */
  getFileIconType: (type: string) => 'image' | 'pdf' | 'text' | 'file';
  /** 判断为图片文件 */
  isImage: (type: string) => boolean;
  /** 生成缩略图 URL */
  getThumbnailUrl: (file: UploadFileItem) => string | undefined;
  /** 文件是否上传中 */
  isFileUploading: (item: UploadFileItem) => boolean;
  /** 文件是否失败 */
  isFileError: (item: UploadFileItem) => boolean;
  /** 文件是否成功 */
  isFileSuccess: (item: UploadFileItem) => boolean;
  /** 文件是否就绪 */
  isFileReady: (item: UploadFileItem) => boolean;
  /** 获取当前列表快照 */
  getFileList: () => UploadFileItem[];
}

/* ============================================================ */
/* 主入口                                                        */
/* ============================================================ */

/**
 * 装配 YdFileUpload 的核心上传逻辑。
 *
 * @param options - props / emit / fileInput
 * @returns 上传核心句柄
 */
export function useFileUploadCore(options: UseFileUploadCoreOptions): UseFileUploadCoreReturn {
  const { emit, fileInput, props } = options;

  /* ---------------------------------------------------------- */
  /* 子模块装配                                                    */
  /* ---------------------------------------------------------- */

  const fileListOps = useFileList({ emit, props });

  const chunkUploader: ChunkUploadHandle | null = props.chunked
    ? useChunkUpload({
        chunkSize: DEFAULT_CHUNK_BYTES,
        multipart: {
          baseURL: props.multipartApiBase ?? '/api/file/multipart',
          withCredentials: props.withCredentials,
        },
        withCredentials: props.withCredentials,
      })
    : null;

  const uploadExecutor = useUploadExecutor({
    chunkUploader,
    emit,
    listOps: {
      currentFileList: fileListOps.currentFileList,
      patchFileItem: fileListOps.patchFileItem,
    },
    props,
  });

  /* ---------------------------------------------------------- */
  /* 预览状态                                                    */
  /* ---------------------------------------------------------- */

  /** 预览模态可见 */
  const previewVisible = ref(false);
  const previewFile = ref<UploadFileItem | null>(null);

  /* ---------------------------------------------------------- */
  /* 文件处理                                                    */
  /* ---------------------------------------------------------- */

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
    const current = fileListOps.currentFileList.value;

    // 多选过滤
    const acceptedFiles = props.multiple ? files : files.slice(0, 1);

    // 校验
    const result = validateFiles(acceptedFiles, current.length, props.maxSize, props.maxCount);

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
      raw: file,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uid: generateUid(),
      name: file.name,
      percent: 0,
      status: 'ready' as UploadFileStatus,
    }));

    // 数量限制截断（添加后总长度）
    let finalItems = [...current, ...newItems];
    if (props.maxCount && finalItems.length > props.maxCount) {
      finalItems = finalItems.slice(0, props.maxCount);
    }

    // 更新列表
    fileListOps.updateFileList(finalItems);

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
          void uploadExecutor.uploadFile(item);
        }
      }
    }
  }

  /* ---------------------------------------------------------- */
  /* 移除 / 重试 / 预览                                          */
  /* ---------------------------------------------------------- */

  /**
   * 移除文件。
   *
   * @param item - 要移除的文件
   */
  function removeFile(item: UploadFileItem): void {
    // 先中止可能正在进行的上传
    uploadExecutor.abortFileUpload(item.uid);

    const list = fileListOps.currentFileList.value.filter((f) => f.uid !== item.uid);
    fileListOps.updateFileList(list);
    emit('remove', item, list);
    emit('change', item, list);
  }

  /**
   * 重试上传。
   *
   * @param item - 上传失败的文件
   */
  function retryFile(item: UploadFileItem): void {
    fileListOps.patchFileItem(item.uid, { status: 'ready', percent: 0, error: undefined });
    void uploadExecutor.uploadFile(item);
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

  /* ---------------------------------------------------------- */
  /* 命令式 API                                                   */
  /* ---------------------------------------------------------- */

  /**
   * 手动上传所有 ready 状态的文件。
   */
  function submitReadyFiles(): void {
    const ready = fileListOps.currentFileList.value.filter((f) => f.status === 'ready');
    for (const item of ready) {
      void uploadExecutor.uploadFile(item);
    }
  }

  return {
    abortFileUpload: uploadExecutor.abortFileUpload,
    clearFiles: fileListOps.clearFiles,
    currentFileList: fileListOps.currentFileList,
    formatFileSize,
    getFileIconType,
    getFileList: fileListOps.getFileList,
    getThumbnailUrl,
    handleInputChange,
    handleIncomingFiles,
    handlePreview,
    isControlled: fileListOps.isControlled,
    isFileError: fileListOps.isFileError,
    isFileReady: fileListOps.isFileReady,
    isFileSuccess: fileListOps.isFileSuccess,
    isFileUploading: fileListOps.isFileUploading,
    isImage,
    openFilePicker,
    previewFile,
    previewVisible,
    removeFile,
    retryFile,
    submitReadyFiles,
  };
}
