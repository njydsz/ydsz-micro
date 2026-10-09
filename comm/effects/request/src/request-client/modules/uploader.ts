/**
 * 文件上传能力：把普通对象参数组装成 multipart 表单并发送。
 *
 * 单独封装的原因有三个，都是手写时容易遗漏的点：
 * - 禁止手动设置 `Content-Type`，浏览器会自动生成带 boundary 的值；
 * - 数组字段要按 `key[0]`、`key[1]` 展开，直接 append 数组会被转成逗号字符串；
 * - `undefined` 值必须跳过，否则会以字符串 `"undefined"` 传给后端。
 *
 * v5.5.10 新增：大文件（>1MB）上传前先算 SHA-256 并向后端查询是否已有该文件，
 * 命中则直接返回已有存储信息，跳过实际传输（秒传优化）。
 *
 * @path comm\effects\request\src\request-client\modules\uploader.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RequestClient } from '../request-client';
import type { RequestClientConfig } from '../types';

import { isUndefined } from '@ydsz/utils';

/** 启用秒传检查的文件大小阈值：1MB */
const FAST_UPLOAD_SIZE_THRESHOLD = 1024 * 1024;
/** 哈希计算超时上限（毫秒）：超时则放弃秒传，降级为普通上传 */
const FAST_UPLOAD_HASH_TIMEOUT = 5_000;
/** 秒传检查端点路径（拼接在 axios baseURL 之后） */
const FAST_UPLOAD_CHECK_PATH = '/api/storage/check';

class FileUploader {
  private client: RequestClient;

  constructor(client: RequestClient) {
    this.client = client;
  }

  /**
   * 尝试秒传：计算文件 SHA-256 并向后端查询是否已存在相同文件。
   *
   * 仅对大于 {@link FAST_UPLOAD_SIZE_THRESHOLD} 的文件生效。
   * 任何步骤失败（哈希不支持、超时、网络异常、后端未命中）都返回 null，
   * 由调用方降级为普通上传，对现有调用方完全透明。
   *
   * @param file 待上传的文件
   * @returns 已存在文件的存储信息；未命中或异常时返回 null
   */
  private async tryFastUpload<T>(file: Blob): Promise<T | null> {
    let hash: string;
    try {
      hash = await this.computeFileHash(file);
    } catch {
      // crypto.subtle 不可用、计算超时或失败 — 降级
      return null;
    }

    const baseURL = this.client.instance.defaults.baseURL ?? '';
    const checkUrl = `${baseURL}${FAST_UPLOAD_CHECK_PATH}`;

    try {
      const response = await this.client.instance.head<unknown>(checkUrl, {
        params: { hash },
        timeout: FAST_UPLOAD_HASH_TIMEOUT,
      });
      // 200 表示后端已有该文件，直接返回存储信息
      if (response.status === 200) {
        return response.data as T;
      }
    } catch {
      // 404（不存在）或其他网络错误 — 降级为普通上传
    }

    return null;
  }

  /**
   * 计算文件的 SHA-256 哈希值（浏览器原生 crypto.subtle）。
   *
   * 使用 {@link FAST_UPLOAD_HASH_TIMEOUT} 超时熔断：大文件在慢速设备上
   * arrayBuffer() + digest() 可能阻塞主线程，超时应放弃秒传以避免
   * 用户感知延迟。
   *
   * @param file 目标文件
   * @returns 十六进制格式的 SHA-256 哈希字符串
   * @throws 超时或 crypto.subtle 不可用时抛出错误
   */
  private async computeFileHash(file: Blob): Promise<string> {
    const buffer = await file.arrayBuffer();

    const hashBuffer = await Promise.race([
      crypto.subtle.digest('SHA-256', buffer),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('HASH_TIMEOUT')), FAST_UPLOAD_HASH_TIMEOUT),
      ),
    ]);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  public async upload<T = unknown>(
    url: string,
    data: Record<string, unknown> & { file: Blob | File },
    config?: RequestClientConfig,
  ): Promise<T> {
    const { file } = data;

    // 大文件尝试秒传：计算哈希 → HEAD 检查 → 命中则直接返回
    if (file.size > FAST_UPLOAD_SIZE_THRESHOLD) {
      const fastResult = await this.tryFastUpload<T>(file).catch(() => null);
      if (fastResult !== null) {
        return fastResult;
      }
    }

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (!isUndefined(item)) formData.append(`${key}[${index}]`, item);
        });
      } else {
        if (!isUndefined(value)) formData.append(key, value);
      }
    });

    // 注意：不要手动设置 Content-Type。浏览器遇到 FormData 会自动生成
    // 带 boundary 的 multipart/form-data 头，手动设置会覆盖它导致后端无法解析。
    const finalConfig: RequestClientConfig = {
      ...config,
      headers: config?.headers,
    };

    return this.client.post(url, formData, finalConfig);
  }
}

export { FileUploader };
