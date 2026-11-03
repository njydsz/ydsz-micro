/**
 * useFileList —— 文件列表状态管理。
 *
 * <p>从 {@link use-file-upload-core.ts} 提取的列表桥接职责：
 * <ul>
 *   <li>受控 / 非受控文件列表桥接（currentFileList / updateFileList）</li>
 *   <li>单个文件项 patch（patchFileItem）</li>
 *   <li>清空文件列表（clearFiles）</li>
 *   <li>状态判断工具（isFileUploading / isFileError / isFileSuccess / isFileReady）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\use-file-list.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import type { UploadFileItem, YdFileUploadEmits, YdFileUploadProps } from './types';
import type { ComputedRef, UnwrapRef } from 'vue';

import { computed, ref } from 'vue';

/** useFileList 配置 */
export interface UseFileListOptions {
  /** 组件 props（响应式） */
  props: UnwrapRef<YdFileUploadProps>;
  /** 组件 emits 触发器 */
  emit: YdFileUploadEmits;
}

/** useFileList 返回句柄 */
export interface UseFileListReturn {
  /** 当前展示的文件列表（受控取 props.fileList，否则取内部） */
  currentFileList: ComputedRef<UploadFileItem[]>;
  /** 受控模式标记 */
  isControlled: ComputedRef<boolean>;
  /** 同步文件列表到受控 / 非受控状态 */
  updateFileList: (list: UploadFileItem[]) => void;
  /** 更新单个文件项 */
  patchFileItem: (uid: string, patch: Partial<UploadFileItem>) => void;
  /** 清空文件列表 */
  clearFiles: () => void;
  /** 获取当前列表快照 */
  getFileList: () => UploadFileItem[];
  /** 文件是否上传中 */
  isFileUploading: (item: UploadFileItem) => boolean;
  /** 文件是否失败 */
  isFileError: (item: UploadFileItem) => boolean;
  /** 文件是否成功 */
  isFileSuccess: (item: UploadFileItem) => boolean;
  /** 文件是否就绪 */
  isFileReady: (item: UploadFileItem) => boolean;
}

/**
 * 装配文件列表状态管理。
 *
 * @param options - props / emit
 * @returns 列表管理句柄
 */
export function useFileList(options: UseFileListOptions): UseFileListReturn {
  const { emit, props } = options;

  /* ---------------------------------------------------------- */
  /* 内部状态                                                    */
  /* ---------------------------------------------------------- */

  /** 内部维护的文件列表 */
  const internalFileList = ref<UploadFileItem[]>([]);

  /** 受控模式：使用外部 fileList */
  const isControlled = computed(() => props.fileList !== undefined && props.fileList !== null);

  /** 当前展示的文件列表 */
  const currentFileList = computed(() =>
    isControlled.value ? (props.fileList ?? []) : internalFileList.value,
  );

  /* ---------------------------------------------------------- */
  /* 列表同步                                                    */
  /* ---------------------------------------------------------- */

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

  /**
   * 清空文件列表（受控模式走 update:fileList，非受控模式重置内部列表）。
   */
  function clearFiles(): void {
    updateFileList([]);
  }

  /* ---------------------------------------------------------- */
  /* 文件项状态判断工具                                            */
  /* ---------------------------------------------------------- */

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

  return {
    clearFiles,
    currentFileList,
    getFileList: () => currentFileList.value,
    isControlled,
    isFileError,
    isFileReady,
    isFileSuccess,
    isFileUploading,
    patchFileItem,
    updateFileList,
  };
}
