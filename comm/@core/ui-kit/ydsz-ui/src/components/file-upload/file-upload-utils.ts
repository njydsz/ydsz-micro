/**
 * file-upload 纯函数工具集。
 *
 * <p>从 {@link use-file-upload-core.ts} 提取的无状态工具函数：
 * <ul>
 *   <li>文件大小格式化（formatFileSize）</li>
 *   <li>MIME 类型判定（getFileIconType / isImage）</li>
 *   <li>唯一标识生成（generateUid）</li>
 *   <li>缩略图 URL 生成（getThumbnailUrl）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\file-upload-utils.ts
 * @author ydsz-team
 * @since 26.10.12
 */

import type { UploadFileItem } from './types';

/* ============================================================ */
/* 常量                                                          */
/* ============================================================ */

/** 默认分片大小 5 MB（字节） */
export const DEFAULT_CHUNK_BYTES = 5 * 1024 * 1024;

/* ============================================================ */
/* 纯函数                                                        */
/* ============================================================ */

/**
 * 生成唯一 uid。
 */
export function generateUid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 格式化文件大小。
 *
 * @param bytes - 字节数
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0 || Number.isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * 根据 MIME 返回文件类型图标名。
 *
 * @param type - MIME 类型
 */
export function getFileIconType(type: string): 'image' | 'pdf' | 'text' | 'file' {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('text/')) return 'text';
  return 'file';
}

/**
 * 判断为图片文件。
 *
 * @param type - MIME 类型
 */
export function isImage(type: string): boolean {
  return type.startsWith('image/');
}

/**
 * 生成缩略图 URL。
 *
 * <p>优先返回已上传的 url，其次对本地图片 File 生成 ObjectURL。
 *
 * @param file - UploadFileItem
 */
export function getThumbnailUrl(file: UploadFileItem): string | undefined {
  if (file.url) return file.url;
  if (file.raw && isImage(file.type)) {
    return URL.createObjectURL(file.raw);
  }
  return undefined;
}
