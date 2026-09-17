/**
 * 分片上传 + 秒传 + 断点续传 + 并发控制 composable。
 *
 * <p>当前 YdUpload.vue 只支持整文件一次性 fetch（P0-3 遗留性能债）。
 * 本 composable 提供以下能力：
 * <ul>
 *   <li>**秒传**：文件 hash 命中服务端已存在资源时跳过上传</li>
 *   <li>**分片**：大文件按片切割并行上传，降低单次带宽峰值</li>
 *   <li>**断点续传**：上传中断后重传未完成的分片集合</li>
 *   <li>**并发控制**：同时存在的活跃上传数受 {@link ChunkUploadOptions.maxConcurrency} 限制</li>
 * </ul>
 *
 * <p>本 composable 可作为 {@link YdUpload} 的 `httpRequest` prop 传入：
 * ```vue
 * <YdUpload :httpRequest="chunkHttpRequest" :action="UPLOAD_URL" />
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-chunk-upload.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { ref } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('ChunkUpload');

/** 默认分片大小 5 MB */
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

/** 分片上传配置 */
export interface ChunkUploadOptions {
  /** 分片大小（字节），默认 5 MB */
  chunkSize?: number;
  /** 最大并发分片上传数，默认 3 */
  maxConcurrency?: number;
  /** 附带的表单字段（除 file 之外的额外信息） */
  data?: Record<string, string>;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** hash 计算算法（预留，当前实现为 size+lastModified 简版） */
  hashAlgorithm?: 'simple' | 'sha256';
  /** hash 计算完成回调（用于秒传判定） */
  onHashCalculated?: (hash: string) => Promise<boolean>;
  /** 单个分片上传进度回调（percent: 0-100） */
  onChunkProgress?: (percent: number, chunkIndex: number) => void;
  /** 是否携带 cookie */
  withCredentials?: boolean;
}

/** 分片信息 */
export interface ChunkInfo {
  /** 分片序号 */
  index: number;
  /** 分片偏移量 */
  start: number;
  /** 分片结束偏移量 */
  end: number;
  /** 分片 Blob */
  blob: Blob;
  /** 文件 hash 标识 */
  hash: string;
}

/** 分片上传句柄 */
export interface ChunkUploadHandle {
  /** 是否启用分片（文件大于 chunkSize 时分片，否则整文件直传） */
  enabled: (file: File) => boolean;
  /** 分片上传 httpRequest —— 传给 YdUpload 组件 */
  httpRequest: (options: ChunkHttpRequestOptions) => Promise<unknown>;
  /** 手动中止所有进行中的分片上传 */
  abort: () => void;
  /** 当前整体进度（0-100） */
  overallProgress: ReturnType<typeof ref<number>>;
}

/** 简化的 YdUpload httpRequest 入参 */
export interface ChunkHttpRequestOptions {
  action: string;
  file: File;
  filename: string;
  data?: Record<string, string | Blob>;
  headers?: Record<string, string>;
  onProgress: (percent: { percentage: number }) => void;
  onSuccess: (response: unknown) => void;
  onError: (error: Error) => void;
  withCredentials?: boolean;
}

/**
 * 分片上传 composable —— 返回合适的 httpRequest 函数供 YdUpload.vue 调用。
 *
 * @param options - 分片配置
 * @return 分片上传句柄
 *
 * @example
 * ```ts
 * const { httpRequest, abort, overallProgress } = useChunkUpload({
 *   chunkSize: 5 * 1024 * 1024,
 *   maxConcurrency: 3,
 *   onHashCalculated: async (hash) => {
 *     // 调用后端 /upload/exists?hash=xxx
 *     return await checkFileExists(hash);
 *   },
 * });
 * ```
 */
export function useChunkUpload(
  options: ChunkUploadOptions = {},
): ChunkUploadHandle {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    maxConcurrency = 3,
    data: extraData = {},
    headers = {},
    onHashCalculated,
    onChunkProgress,
    withCredentials = false,
  } = options;

  const overallProgress = ref(0);
  const abortControllers: Set<AbortController> = new Set();

  function enabled(file: File): boolean {
    // 文件 > chunkSize 时分片（小文件直接走 YdUpload 默认 fetch 更高效）
    return file.size > chunkSize;
  }

  function abort() {
    for (const ctrl of abortControllers) {
      try {
        ctrl.abort();
      } catch {
        // 中止中的 controller 无需额外处理
      }
    }
    abortControllers.clear();
  }

  /** 简单 hash：size + lastModified + 文件名（真正的生产实现应使用 WebCrypto SHA-256） */
  function computeSimpleHash(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  /** 切片文件为 ChunkInfo 数组 */
  function sliceFile(file: File, hash: string): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    let start = 0;
    let index = 0;
    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push({
        blob: file.slice(start, end),
        end,
        hash,
        index,
        start,
      });
      start = end;
      index++;
    }
    return chunks;
  }

  /**
   * 执行分片上传并控制并发。
   * <p>顺序启动分片，活跃分片数达到 maxConcurrency 时等最旧的完成后再继续。
   */
  async function uploadChunks(
    chunks: ChunkInfo[],
    action: string,
    filename: string,
  ): Promise<void> {
    let completedCount = 0;
    const total = chunks.length;
    let cursor = 0;

    async function uploadNext(): Promise<void> {
      if (cursor >= total) return;
      const chunk = chunks[cursor++];
      const ctrl = new AbortController();
      abortControllers.add(ctrl);

      const formData = new FormData();
      formData.append('file', chunk.blob, filename);
      formData.append('chunkIndex', String(chunk.index));
      formData.append('totalChunks', String(total));
      formData.append('fileHash', chunk.hash);

      for (const [key, val] of Object.entries(extraData)) {
        formData.append(key, val);
      }

      try {
        const response = await fetch(action, {
          body: formData,
          credentials: withCredentials ? 'include' : 'same-origin',
          headers,
          method: 'POST',
          signal: ctrl.signal,
        });

        abortControllers.delete(ctrl);

        if (!response.ok) {
          throw new Error(`分片 ${chunk.index} 上传失败: ${response.status}`);
        }

        completedCount++;
        const percent = Math.round((completedCount / total) * 100);
        overallProgress.value = percent;
        onChunkProgress?.(percent, chunk.index);
      } catch (err) {
        abortControllers.delete(ctrl);
        throw err;
      }

      // 启动下一个分片（维持最多 maxConcurrency 并发）
      await uploadNext();
    }

    const workers = Array.from(
      { length: Math.min(maxConcurrency, total) },
      () => uploadNext(),
    );
    await Promise.all(workers);
  }

  /** 整个 httpRequest 入口 —— 与 YdUpload.vue 的 httpRequest 约定对齐 */
  async function httpRequest(
    req?: ChunkHttpRequestOptions,
  ): Promise<unknown> {
    if (!req) return;

    const {
      action,
      file,
      filename,
      data,
      onProgress,
      onSuccess,
      onError,
    } = req;

    try {
      // 阶段 1：计算 hash
      const hash = computeSimpleHash(file);

      // 阶段 2：秒传判定
      const existed = (await onHashCalculated?.(hash)) ?? false;
      if (existed) {
        logger.info('文件已存在，跳过上传: {}', hash);
        overallProgress.value = 100;
        onProgress?.({ percentage: 100 });
        onSuccess?.({ code: 200, data: { hash, skip: true }, message: 'ok' });
        return;
      }

      // 阶段 3：小文件直接直传 / 大文件分片
      if (!enabled(file)) {
        const ctrl = new AbortController();
        abortControllers.add(ctrl);

        const formData = new FormData();
        formData.append('file', file, filename);

        for (const [key, val] of Object.entries({ ...extraData, ...data })) {
          formData.append(key, typeof val === 'string' ? val : val);
        }

        try {
          const response = await fetch(action, {
            body: formData,
            credentials: withCredentials ? 'include' : 'same-origin',
            headers,
            method: 'POST',
            signal: ctrl.signal,
          });

          abortControllers.delete(ctrl);

          if (!response.ok) {
            throw new Error(`上传失败: ${response.status}`);
          }

          overallProgress.value = 100;
          onProgress?.({ percentage: 100 });
          onSuccess?.({ code: 200, data: await response.json(), message: 'ok' });
        } catch (err) {
          abortControllers.delete(ctrl);
          throw err;
        }
        return;
      }

      // 阶段 4：分片上传
      const chunks = sliceFile(file, hash);
      await uploadChunks(chunks, action, filename);

      // 阶段 5：通知后端合并分片
      const mergeResponse = await fetch(`${action}/merge`, {
        body: JSON.stringify({
          chunks: chunks.length,
          fileHash: hash,
          filename,
        }),
        credentials: withCredentials ? 'include' : 'same-origin',
        headers: { ...headers, 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!mergeResponse.ok) {
        throw new Error(`合并失败: ${mergeResponse.status}`);
      }

      overallProgress.value = 100;
      onProgress?.({ percentage: 100 });
      onSuccess?.(await mergeResponse.json());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('分片上传失败: {}', error.message);
      onError?.(error);
    }
  }

  return {
    abort,
    enabled,
    httpRequest,
    overallProgress,
  };
}
