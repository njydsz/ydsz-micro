/**
 * YdFileUpload 业务复合文件上传组件的类型定义。
 *
 * <p>对标 PrimeVue FileUpload 增强版：支持拖拽上传、多文件列表、上传进度、
 * 文件类型/大小限制、手动上传队列、图片预览、上传失败重试。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\types.ts
 * @author ydsz-team
 * @since 26.10.12
 */

/* ============================================================ */
/* 文件条目                                                        */
/* ============================================================ */

/** 文件上传状态 */
export type UploadFileStatus = 'ready' | 'uploading' | 'success' | 'error';

/** 上传文件条目 */
export interface UploadFileItem {
  /** 唯一标识 */
  uid: string;
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** MIME 类型 */
  type: string;
  /** 上传状态 */
  status: UploadFileStatus;
  /** 上传进度（0-100） */
  percent?: number;
  /** 文件访问 URL（上传成功后由后端返回） */
  url?: string;
  /** 错误信息（status=error 时） */
  error?: string;
  /** 原始 File 对象 */
  raw?: File;
}

/* ============================================================ */
/* Props                                                           */
/* ============================================================ */

/** 呈现模式 */
export type FileUploadListType = 'text' | 'picture-card';

/** YdFileUpload 组件 Props */
export interface YdFileUploadProps {
  /** 上传地址 */
  action?: string;
  /** 是否多选 */
  multiple?: boolean;
  /** 接受的文件类型（MIME 或扩展名，如 'image/*' 或 '.png,.jpg'） */
  accept?: string;
  /** 最大文件大小（字节） */
  maxSize?: number;
  /** 最大文件数量 */
  maxCount?: number;
  /** 是否拖拽上传 */
  draggable?: boolean;
  /** 是否自动上传 */
  autoUpload?: boolean;
  /** 已上传文件列表（受控） */
  fileList?: UploadFileItem[];
  /** 是否显示文件列表 */
  showFileList?: boolean;
  /** 是否支持图片预览 */
  preview?: boolean;
  /** 是否分片上传 */
  chunked?: boolean;
  /** 分片大小（MB） */
  chunkSize?: number;
  /** HTTP 方法 */
  method?: string;
  /** 请求 headers */
  headers?: Record<string, string>;
  /** 附加表单数据 */
  data?: Record<string, string>;
  /** 上传按钮文本 */
  uploadText?: string;
  /** 拖拽区域提示文本 */
  dragText?: string;
  /** 禁用状态 */
  disabled?: boolean;
  /** 呈现模式 */
  listType?: FileUploadListType;
  /** 当前语言，默认 'zh' */
  locale?: string;
  /** 表单字段名，默认 'file' */
  name?: string;
  /** 是否携带 cookie */
  withCredentials?: boolean;
  /** 分片上传 REST API 基础路径 */
  multipartApiBase?: string;
}

/* ============================================================ */
/* Emits                                                           */
/* ============================================================ */

/** YdFileUpload 组件 Emits */
export interface YdFileUploadEmits {
  /** 文件状态变化 */
  (e: 'change', file: UploadFileItem, fileList: UploadFileItem[]): void;
  /** 上传成功 */
  (e: 'success', response: unknown, file: UploadFileItem): void;
  /** 上传失败 */
  (e: 'error', error: Error, file: UploadFileItem): void;
  /** 上传进度变化 */
  (e: 'progress', percent: number, file: UploadFileItem): void;
  /** 超出数量或大小限制 */
  (e: 'exceed', files: File[], fileList: UploadFileItem[]): void;
  /** 预览图片 */
  (e: 'preview', file: UploadFileItem): void;
  /** 移除文件 */
  (e: 'remove', file: UploadFileItem, fileList: UploadFileItem[]): void;
  /** fileList 受控更新 */
  (e: 'update:fileList', fileList: UploadFileItem[]): void;
}

/* ============================================================ */
/* 命令式 API                                                       */
/* ============================================================ */

/** 组件暴露的命令式方法 */
export interface YdFileUploadExpose {
  /** 手动上传所有 ready 文件 */
  submit: () => void;
  /** 中止上传 */
  abort: (uid?: string) => void;
  /** 清空文件列表 */
  clear: () => void;
  /** 获取内部文件列表（非受控模式下直接访问） */
  getFileList: () => UploadFileItem[];
}
