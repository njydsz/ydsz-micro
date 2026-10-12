/**
 * YdFileUpload 业务复合文件上传组件。
 *
 * <p>对标 PrimeVue FileUpload 增强版：拖拽上传、多文件列表、上传进度、
 * 文件类型/大小限制、手动上传队列、图片预览、上传失败重试。
 *
 * @module components/file-upload
 * @author ydsz-team
 * @since 26.10.12
 */

export { default as YdFileUpload } from './YdFileUpload.vue';
export type {
  FileUploadListType,
  UploadFileItem,
  UploadFileStatus,
  YdFileUploadEmits,
  YdFileUploadExpose,
  YdFileUploadProps,
} from './types';
