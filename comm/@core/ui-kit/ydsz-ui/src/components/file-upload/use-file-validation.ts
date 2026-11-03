/**
 * useFileValidation —— 文件校验。
 *
 * <p>从 {@link use-file-upload-core.ts} 提取的校验职责：
 * <ul>
 *   <li>文件大小校验（maxSize）</li>
 *   <li>文件数量校验（maxCount）</li>
 *   <li>校验结果类型（FileValidationResult）</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\file-upload\use-file-validation.ts
 * @author ydsz-team
 * @since 26.10.12
 */

/** 文件校验结果 */
export interface FileValidationResult {
  /** 是否通过 */
  valid: boolean;
  /** 未通过的文件 */
  invalidFiles: File[];
  /** 失败原因 */
  reason?: 'size' | 'count';
}

/**
 * 验证文件是否超出限制。
 *
 * @param files          - 待验证的文件
 * @param existingCount  - 现有文件数量
 * @param maxSize        - 最大文件大小（字节），0 / undefined 表示不限制
 * @param maxCount       - 最大文件数量，0 / undefined 表示不限制
 */
export function validateFiles(
  files: File[],
  existingCount: number,
  maxSize?: number,
  maxCount?: number,
): FileValidationResult {
  const invalidFiles: File[] = [];

  // 大小校验
  if (maxSize) {
    for (const file of files) {
      if (file.size > maxSize) {
        invalidFiles.push(file);
      }
    }
  }

  if (invalidFiles.length > 0) {
    return { reason: 'size', valid: false, invalidFiles };
  }

  // 数量校验
  if (maxCount) {
    const totalAfterAdd = existingCount + files.length;
    if (totalAfterAdd > maxCount) {
      // 超出部分标记为无效
      const available = Math.max(0, maxCount - existingCount);
      return {
        invalidFiles: files.slice(available),
        reason: 'count',
        valid: false,
      };
    }
  }

  return { invalidFiles: [], valid: true };
}
