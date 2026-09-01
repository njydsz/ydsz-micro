/**
 * 文件上传能力：把普通对象参数组装成 multipart 表单并发送。
 *
 * 单独封装的原因有三个，都是手写时容易遗漏的点：
 * - 必须构造 `FormData` 并显式声明 `Content-Type: multipart/form-data`；
 * - 数组字段要按 `key[0]`、`key[1]` 展开，直接 append 数组会被转成逗号字符串；
 * - `undefined` 值必须跳过，否则会以字符串 `"undefined"` 传给后端。
 *
 * 注意请求头合并顺序：`config.headers` 在内置 `Content-Type` **之后**展开，
 * 因此调用方可以覆盖它（例如改用自定义的边界类型）。
 *
 * @path comm\effects\request\src\request-client\modules\uploader.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RequestClient } from '../request-client';
import type { RequestClientConfig } from '../types';

import { isUndefined } from '@ydsz/utils';

class FileUploader {
  private client: RequestClient;

  constructor(client: RequestClient) {
    this.client = client;
  }

  public async upload<T = unknown>(
    url: string,
    data: Record<string, unknown> & { file: Blob | File },
    config?: RequestClientConfig,
  ): Promise<T> {
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

    const finalConfig: RequestClientConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    };

    return this.client.post(url, formData, finalConfig);
  }
}

export { FileUploader };
