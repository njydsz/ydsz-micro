/**
 * YdUpload 类型契约。
 *
 * <p>与 ElUpload 的 UploadFile / UploadRequestOptions / UploadUserFile 类型对齐。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\upload\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 上传状态枚举 */
export enum UploadStatus {
  /** 就绪 */
  READY = 'ready',
  /** 上传中 */
  UPLOADING = 'uploading',
  /** 成功 */
  SUCCESS = 'success',
  /** 失败 */
  FAIL = 'fail',
}

/** 文件对象 */
export interface UploadFile {
  /** 唯一标识 */
  id?: string;
  /** 文件名 */
  name: string;
  /** 百分比进度 */
  percentage?: number;
  /** 原始 File */
  raw?: File;
  /** 响应数据 */
  response?: any;
  /** 文件大小 */
  size?: number;
  /** 状态 */
  status?: UploadStatus | string;
  /** 上传 URL */
  url?: string;
}

/** ElUpload 的 user file 列表元素 */
export interface UploadUserFile {
  /** 文件名 */
  name: string;
  /** 访问 URL */
  url?: string;
}

/** before-upload 等钩子传入的 options 类型 */
export interface UploadRequestOptions {
  /** 请求的 action URL */
  action: string;
  /** 额外的请求数据 */
  data?: Record<string, string | Blob>;
  /** 上传的 File 对象 */
  file: File;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 失败回调 */
  onError: (error: Error) => void;
  /** 上传进度回调 */
  onProgress: (event: { percent: number }) => void;
  /** 成功回调 */
  onSuccess: (response: any) => void;
  /** 表单字段名 */
  name?: string;
}
