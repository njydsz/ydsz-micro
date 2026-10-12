/**
 * YdUpload 模块出口。
 *
 * <p>提供与 ElUpload 对齐的命令式文件上传 API 与 <code>YdUpload</code> 组件。
 * 全部基于 ydsz-ui 输入/按钮/进度条等原子组件组装。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\upload\index.ts
 * @author ydsz-team
 * @since 26.09.24
 */
export { default as YdUpload } from './YdUpload.vue';
export { UploadStatus } from './types';
export {
  createChunkHttpRequest,
} from '../../composables/use-chunk-upload';
export type {
  ChunkHttpOptions,
  ChunkUploadHandle,
  ChunkUploadOptions,
  MultipartApiConfig,
} from '../../composables/use-chunk-upload';
export type {
  UploadFile,
  UploadRequestOptions,
  UploadUserFile,
} from './types';
