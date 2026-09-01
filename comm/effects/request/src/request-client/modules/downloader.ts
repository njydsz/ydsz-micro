/**
 * 文件下载能力：在请求客户端之上固定二进制下载所需的响应配置。
 *
 * 单独封装的原因：下载必须把 `responseType` 设为 `blob`，否则 axios 会
 * 按文本解析响应体，得到的内容无法构造文件。这类配置容易漏写，
 * 且漏写后不报错、只产出损坏的文件，排查成本高，因此固化为专用方法。
 *
 * 默认 `responseReturn: 'body'` 直出 Blob；需要读取 Content-Disposition
 * 等响应头时可显式传 `'raw'`。
 *
 * @path comm\effects\request\src\request-client\modules\downloader.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RequestClient } from '../request-client';
import type { RequestClientConfig } from '../types';

type DownloadRequestConfig = {
  /**
   * 定义期望获得的数据类型。
   * raw: 原始的AxiosResponse，包括headers、status等。
   * body: 只返回响应数据的BODY部分(Blob)
   */
  responseReturn?: 'body' | 'raw';
} & Omit<RequestClientConfig, 'responseReturn'>;

class FileDownloader {
  private client: RequestClient;

  constructor(client: RequestClient) {
    this.client = client;
  }
  /**
   * 下载文件
   * @param url 文件的完整链接
   * @param config 配置信息，可选。
   * @returns 如果config.responseReturn为'body'，则返回Blob(默认)，否则返回RequestResponse<Blob>
   */
  public async download<T = Blob>(
    url: string,
    config?: DownloadRequestConfig,
  ): Promise<T> {
    const finalConfig: DownloadRequestConfig = {
      responseReturn: 'body',
      ...config,
      responseType: 'blob',
    };

    const response = await this.client.get<T>(url, finalConfig);

    return response;
  }
}

export { FileDownloader };
