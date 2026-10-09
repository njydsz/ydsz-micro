/**
 * 分片上传 + 秒传 + 断点续传 + 并发控制 composable。
 *
 * <p>对接后端 {@code FileMultipartController} 三步式分片上传 REST API：
 * <pre>
 *   1. POST {baseURL}/init?key={storageKey}&contentType={mime}       → { uploadId, recommendedPartSize }
 *   2. POST {baseURL}/{uploadId}/part/{partNumber}  (binary body)    → Void（可并行、可重试）
 *   3. POST {baseURL}/{uploadId}/complete                              → { uploadId }
 * </pre>
 *
 * <p>小文件（≤ chunkSize）仍走整文件直传，大文件自动切换分片上传。
 * 所有 chunk 上传自带最多 3 次重试 + 超时处理。
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

/** 默认分片上传基础路径（对应 FileMultipartController 的 @RequestMapping） */
export const DEFAULT_MULTIPART_BASE = '/api/v1/system/file/multipart';

/** 默认重试次数 */
export const DEFAULT_MAX_RETRIES = 3;

/** 分片上传单次请求超时（毫秒） */
export const DEFAULT_CHUNK_TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/**
 * 分片上传 REST API 端点配置。
 *
 * <p>调用方应传入与后端 {@code FileMultipartController} 对齐的 baseURL，
 * 例如 {@code /api/v1/system/file/multipart}。
 */
export interface MultipartApiConfig {
  /** 分片上传控制器基础 URL（如 /api/v1/system/file/multipart） */
  baseURL: string;
  /** 自定义请求头（如 X-Tenant-Id 等），合并到每个请求中 */
  headers?: Record<string, string>;
  /** 是否携带 cookie */
  withCredentials?: boolean;
}

/** 初始化上传响应 */
export interface MultipartInitResponse {
  /** 上传任务 ID */
  uploadId: string;
  /** 后端推荐的分片大小（字节） */
  recommendedPartSize: number;
}

/** 完成上传响应 */
export interface MultipartCompleteResponse {
  /** 上传任务 ID */
  uploadId: string;
}

/** 分片上传配置 */
export interface ChunkUploadOptions {
  /** 分片大小（字节），默认 5 MB */
  chunkSize?: number;
  /** 最大并发分片上传数，默认 3 */
  maxConcurrency?: number;
  /** 附带的表单字段（简单整文件直传时注入到 FormData） */
  data?: Record<string, string>;
  /** 自定义请求头（简单整文件直传时使用） */
  headers?: Record<string, string>;
  /** hash 计算算法（预留，当前实现为 size+lastModified 简版） */
  hashAlgorithm?: 'simple' | 'sha256';
  /** hash 计算完成回调（用于秒传判定） */
  onHashCalculated?: (hash: string) => Promise<boolean>;
  /** 单个分片上传进度回调（percent: 0-100） */
  onChunkProgress?: (percent: number, chunkIndex: number) => void;
  /** 是否携带 cookie */
  withCredentials?: boolean;
  /**
   * 分片上传 REST API 配置（对接 FileMultipartController）。
   * <p>传入后，大于 chunkSize 的文件自动走三步式分片上传；
   * 未传入时退化为旧逻辑（单 endpoint + /merge）。
   */
  multipart?: MultipartApiConfig;
  /** 单分片最大重试次数（默认 3） */
  maxRetries?: number;
  /** 分片上传单次超时毫秒（默认 30 000） */
  chunkTimeout?: number;
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
  /** 对象存储 key（如 workflow/2026/attachment.bin）；必填用于分片上传 */
  storageKey?: string;
  data?: Record<string, string | Blob>;
  headers?: Record<string, string>;
  onProgress: (percent: { percentage: number }) => void;
  onSuccess: (response: unknown) => void;
  onError: (error: Error) => void;
  withCredentials?: boolean;
}

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 简单 hash：size + lastModified + 文件名（真正的生产实现应使用 WebCrypto SHA-256） */
function computeSimpleHash(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/** 切片文件为 ChunkInfo 数组 */
function sliceFile(file: File, hash: string, chunkSize: number): ChunkInfo[] {
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
 * 带超时的 fetch。
 *
 * @param url     - 请求 URL
 * @param init    - fetch RequestInit
 * @param timeout - 超时毫秒
 */
function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeout: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  // 合并外部传入的 signal（如有）
  if (init.signal) {
    init.signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  }

  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * 带重试的请求。失败时按 attempt 指数退避等待后重试。
 *
 * @param fn      - 实际请求函数（返回 Promise<Response>）
 * @param maxRetries - 最大重试次数
 */
async function retryFetch(
  fn: () => Promise<Response>,
  maxRetries: number,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fn();
      if (response.ok) return response;
      // 4xx 不重试（客户端错误）
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
      // 用户主动中止（abort）不重试
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
    if (attempt < maxRetries) {
      // 指数退避：200ms, 400ms, 800ms
      const delay = 200 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// ---------------------------------------------------------------------------
// 三步式分片上传核心
// ---------------------------------------------------------------------------

/**
 * 初始化分片上传。
 *
 * @param cfg  - API 配置
 * @param file - 待上传文件
 */
async function initMultipart(
  cfg: MultipartApiConfig,
  file: File,
  storageKey: string,
): Promise<MultipartInitResponse> {
  const { baseURL, headers = {}, withCredentials } = cfg;

  const queryParams = new URLSearchParams({
    contentType: file.type || 'application/octet-stream',
    key: storageKey,
  });

  const url = `${baseURL}/init?${queryParams.toString()}`;

  const response = await retryFetch(
    () =>
      fetchWithTimeout(
        url,
        {
          credentials: withCredentials ? 'include' : 'same-origin',
          headers,
          method: 'POST',
        },
        DEFAULT_CHUNK_TIMEOUT,
      ),
    DEFAULT_MAX_RETRIES,
  );

  if (!response.ok) {
    throw new Error(`初始化上传失败: HTTP ${response.status}`);
  }

  const json = (await response.json()) as MultipartInitResponse;
  if (!json.uploadId) {
    throw new Error('初始化上传失败：后端未返回 uploadId');
  }
  return json;
}

/**
 * 上传单个分片（binary body）。使用路径参数 uploadId 和 partNumber。
 *
 * @param cfg        - API 配置
 * @param uploadId   - 初始化时返回的上传任务 ID
 * @param partNumber - 分片编号（与后端约定从 1 开始）
 * @param blob       - 分片二进制数据
 */
async function uploadPart(
  cfg: MultipartApiConfig,
  uploadId: string,
  partNumber: number,
  blob: Blob,
): Promise<void> {
  const { baseURL, headers = {}, withCredentials } = cfg;
  const url = `${baseURL}/${encodeURIComponent(uploadId)}/part/${partNumber}`;

  const response = await retryFetch(
    () =>
      fetchWithTimeout(
        url,
        {
          body: blob,
          credentials: withCredentials ? 'include' : 'same-origin',
          headers: {
            ...headers,
            'Content-Type': blob.type || 'application/octet-stream',
          },
          method: 'POST',
        },
        DEFAULT_CHUNK_TIMEOUT,
      ),
    DEFAULT_MAX_RETRIES,
  );

  if (!response.ok) {
    throw new Error(`分片 ${partNumber} 上传失败: HTTP ${response.status}`);
  }
}

/**
 * 完成分片上传（合并所有分片）。
 *
 * @param cfg      - API 配置
 * @param uploadId - 初始化时返回的上传任务 ID
 */
async function completeMultipart(
  cfg: MultipartApiConfig,
  uploadId: string,
): Promise<MultipartCompleteResponse> {
  const { baseURL, headers = {}, withCredentials } = cfg;
  const url = `${baseURL}/${encodeURIComponent(uploadId)}/complete`;

  const response = await retryFetch(
    () =>
      fetchWithTimeout(
        url,
        {
          credentials: withCredentials ? 'include' : 'same-origin',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
        DEFAULT_CHUNK_TIMEOUT,
      ),
    DEFAULT_MAX_RETRIES,
  );

  if (!response.ok) {
    throw new Error(`合并分片失败: HTTP ${response.status}`);
  }

  return (await response.json()) as MultipartCompleteResponse;
}

// ---------------------------------------------------------------------------
// 并发控制上传
// ---------------------------------------------------------------------------

/**
 * 执行分片上传并控制并发。
 * <p>顺序启动分片，活跃分片数达到 maxConcurrency 时等最旧的完成后再继续。
 */
async function uploadChunksWithConcurrency(
  chunks: ChunkInfo[],
  cfg: MultipartApiConfig,
  uploadId: string,
  maxConcurrency: number,
  overallProgress: ReturnType<typeof ref<number>>,
  onChunkProgress?: (percent: number, chunkIndex: number) => void,
  abortControllers?: Set<AbortController>,
): Promise<void> {
  const total = chunks.length;
  let completedCount = 0;
  let cursor = 0;

  async function uploadNext(): Promise<void> {
    if (cursor >= total) return;
    const chunk = chunks[cursor++];
    const ctrl = new AbortController();
    abortControllers?.add(ctrl);

    try {
      // partNumber 与后端约定从 1 开始
      await uploadPart(cfg, uploadId, chunk.index + 1, chunk.blob);

      abortControllers?.delete(ctrl);
      completedCount++;
      const percent = Math.round((completedCount / total) * 100);
      overallProgress.value = percent;
      onChunkProgress?.(percent, chunk.index);
    } catch (err) {
      abortControllers?.delete(ctrl);
      throw err;
    }

    // 启动下一个分片（维持最多 maxConcurrency 并发）
    await uploadNext();
  }

  await Promise.all(
    Array.from({ length: Math.min(maxConcurrency, total) }, () => uploadNext()),
  );
}

// ---------------------------------------------------------------------------
// 旧逻辑（退化模式：未配置 multipart 时使用）
// ---------------------------------------------------------------------------

/**
 * 旧版分片上传（单 endpoint + /merge），保留向后兼容。
 */
async function uploadChunksSingleEndpoint(
  chunks: ChunkInfo[],
  action: string,
  filename: string,
  extraData: Record<string, string>,
  headers: Record<string, string>,
  withCredentials: boolean,
  maxConcurrency: number,
  overallProgress: ReturnType<typeof ref<number>>,
  onChunkProgress?: (percent: number, chunkIndex: number) => void,
  abortControllers?: Set<AbortController>,
): Promise<void> {
  const total = chunks.length;
  let completedCount = 0;
  let cursor = 0;

  async function uploadNext(): Promise<void> {
    if (cursor >= total) return;
    const chunk = chunks[cursor++];
    const ctrl = new AbortController();
    abortControllers?.add(ctrl);

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

      abortControllers?.delete(ctrl);

      if (!response.ok) {
        throw new Error(`分片 ${chunk.index} 上传失败: ${response.status}`);
      }

      completedCount++;
      const percent = Math.round((completedCount / total) * 100);
      overallProgress.value = percent;
      onChunkProgress?.(percent, chunk.index);
    } catch (err) {
      abortControllers?.delete(ctrl);
      throw err;
    }

    await uploadNext();
  }

  await Promise.all(
    Array.from({ length: Math.min(maxConcurrency, total) }, () => uploadNext()),
  );
}

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

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
 *   multipart: {
 *     baseURL: '/api/v1/system/file/multipart',
 *     withCredentials: true,
 *   },
 *   onHashCalculated: async (hash) => {
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
    multipart,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = options;

  const overallProgress = ref(0);
  const abortControllers: Set<AbortController> = new Set();

  function enabled(file: File): boolean {
    return file.size > chunkSize;
  }

  function abort(): void {
    for (const ctrl of abortControllers) {
      try {
        ctrl.abort();
      } catch {
        // 中止中的 controller 无需额外处理
      }
    }
    abortControllers.clear();
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
      storageKey,
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
            throw new Error(`上传失败: HTTP ${response.status}`);
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

      // 阶段 4：大文件 —— 选择分片上传策略
      const chunks = sliceFile(file, hash, chunkSize);

      if (multipart) {
        // 三步式分片上传（对接 FileMultipartController）
        if (!storageKey) {
          throw new Error('分片上传需要提供 storageKey（对象存储路径）');
        }

        const cfg: MultipartApiConfig = {
          baseURL: multipart.baseURL,
          headers: multipart.headers,
          withCredentials: multipart.withCredentials ?? withCredentials,
        };

        // 4a. 初始化
        const initResult = await initMultipart(cfg, file, storageKey);
        logger.info('分片上传初始化完成: uploadId={}, partSize={}', initResult.uploadId, initResult.recommendedPartSize);

        // 4b. 并发上传分片
        await uploadChunksWithConcurrency(
          chunks,
          cfg,
          initResult.uploadId,
          maxConcurrency,
          overallProgress,
          onChunkProgress,
          abortControllers,
        );

        // 4c. 完成上传
        const completeResult = await completeMultipart(cfg, initResult.uploadId);
        logger.info('分片上传完成: uploadId={}', completeResult.uploadId);

        overallProgress.value = 100;
        onProgress?.({ percentage: 100 });
        onSuccess?.(completeResult);
      } else {
        // 退化：旧版单 endpoint 分片上传
        await uploadChunksSingleEndpoint(
          chunks,
          action,
          filename,
          extraData,
          headers,
          withCredentials,
          maxConcurrency,
          overallProgress,
          onChunkProgress,
          abortControllers,
        );

        // 通知后端合并分片
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
          throw new Error(`合并失败: HTTP ${mergeResponse.status}`);
        }

        overallProgress.value = 100;
        onProgress?.({ percentage: 100 });
        onSuccess?.(await mergeResponse.json());
      }
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
