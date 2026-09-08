/**
 * ImportExportController API 封装。
 *
 * <p>对应后端 {@code ImportExportController}，路径前缀 /api/generator/import-export。
 * <p>提供模板分组导入导出功能。
 *
 * @author ydsz-team
 * @path apps/generator-web/src/api/import-export.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/**
 * 导出模板分组为 zip 文件。
 *
 * @param params 包含 groupId
 * @returns zip 二进制 Blob
 */
export function exportTemplates(params: { groupId: number }): Promise<Blob> {
  return requestClient.get<Blob>(`/api/generator/import-export/export`, {
    params,
    responseType: 'blob',
  });
}

/**
 * 导入模板 zip 到指定分组。
 *
 * @param formData 包含 groupId、file、overwrite 的 FormData
 * @returns 导入数量
 */
export function importTemplates(formData: FormData): Promise<number> {
  return requestClient.post<number>(`/api/generator/import-export/import`, formData);
}
