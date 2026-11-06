/**
 * useUploadExecutor —— 上传执行（XHR / 分片 / 中止控制）。
 *
 * <p>从 {@link use-file-upload-core.ts} 提取的上传执行职责：
 * <ul>
 *   <li>标准 XHR 上传（handleXhrUpload）</li>
 *   <li>分片上传协调（handleChunkUpload）</li>
 *   <li>上传中止控制（abortFileUpload / AbortController Map）</li>
 *   <li>上传调度入口（uploadFile）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\use-upload-executor.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import type { UploadFileItem, YdFileUploadEmits, YdFileUploadProps } from './types';
import type { ChunkUploadHandle } from '../../composables/use-chunk-upload';
import type { UnwrapRef } from 'vue';

import { ref } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';

import { DEFAULT_CHUNK_BYTES } from './file-upload-utils';

/** 模块级日志器 */
const logger = createLogger('YdFileUpload');

/** useUploadExecutor 依赖的列表操作接口（由 useFileList 提供） */
export interface UploadExecutorListOps {
  /** 更新单个文件项 */
  patchFileItem: (uid: string, patch: Partial<UploadFileItem>) => void;
  /** 当前展示的文件列表 */
  currentFileList: { value: UploadFileItem[] };
}

/** useUploadExecutor 配置 */
export interface UseUploadExecutorOptions {
  /** 组件 props（响应式） */
  props: UnwrapRef<YdFileUploadProps>;
  /** 组件 emits 触发器 */
  emit: YdFileUploadEmits;
  /** 分片上传句柄（props.chunked 为 true 时由外部创建传入） */
  chunkUploader: ChunkUploadHandle | null;
  /** 列表操作接口（由 useFileList 提供） */
  listOps: UploadExecutorListOps;
}

/** useUploadExecutor 返回句柄 */
export interface UseUploadExecutorReturn {
  /** 上传单个文件 */
  uploadFile: (item: UploadFileItem) => Promise<void>;
  /** 中止上传（不传 uid 则中止全部） */
  abortFileUpload: (uid?: string) => void;
}

/**
 * 装配上传执行逻辑。
 *
 * @param options - props / emit / chunkUploader / listOps
 * @returns 上传执行句柄
 */
export function useUploadExecutor(options: UseUploadExecutorOptions): UseUploadExecutorReturn {
  const { emit, props, chunkUploader, listOps } = options;
  const { patchFileItem } = listOps;

  /** 每个文件对应的 AbortController（用于中止上传） */
  const abortControllers = ref<Map<string, AbortController>>(new Map());

  /* ---------------------------------------------------------- */
  /* 上传执行                                                    */
  /* ---------------------------------------------------------- */

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
      handleChunkUpload(item, raw);
      return;
    }

    // 标准 XHR 上传
    handleXhrUpload(item, raw);
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
          patchFileItem(item.uid, {
            status: 'success',
            percent: 100,
            url: response?.data ?? response?.url,
          });
          const updated = listOps.currentFileList.value.find((f) => f.uid === item.uid)!;
          emit('success', response, updated);
          emit('change', updated, listOps.currentFileList.value);
        } catch {
          patchFileItem(item.uid, { status: 'success', percent: 100 });
          const updated = listOps.currentFileList.value.find((f) => f.uid === item.uid)!;
          emit('success', xhr.responseText, updated);
          emit('change', updated, listOps.currentFileList.value);
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
        const updated = listOps.currentFileList.value.find((f) => f.uid === item.uid)!;
        emit('success', response, updated);
        emit('change', updated, listOps.currentFileList.value);
      },
      withCredentials: props.withCredentials,
    });
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

  return {
    abortFileUpload,
    uploadFile,
  };
}

/** 默认分片大小常量 re-export（保持对外 API 不变） */
export { DEFAULT_CHUNK_BYTES };
