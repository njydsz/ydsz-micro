/**
 * Upload 模块出口。
 *
 * <p>提供与 ElUpload 对齐的命令式文件上传 API 与 <code>Upload</code> 组件。
 * 全部基于 shadcn-ui 输入/按钮/进度条等原子组件组装。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\upload\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Upload } from './Upload.vue';
export { UploadStatus } from './types';
export type {
  UploadFile,
  UploadRequestOptions,
  UploadUserFile,
} from './types';
