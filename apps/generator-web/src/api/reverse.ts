/**
 * ReverseController API 封装。
 *
 * <p>对应后端 {@code ReverseController}，路径前缀 /api/generator/reverse。
 * <p>提供实体类反向生成功能。
 *
 * @author ydsz-team
 * @path apps/generator-web/src/api/reverse.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';

/**
 * 反向分析单个 Java 源文件。
 *
 * @param params 包含 sourceFilePath + templateGroupId + outputDir
 * @returns 分析报告
 */
export function analyzeReverse(params: {
  sourceFilePath: string;
  templateGroupId: number;
  outputDir: string;
}): Promise<string> {
  return requestClient.post<string>(`/api/generator/reverse/analyze`, { params });
}

/**
 * 批量反向分析目录。
 *
 * @param params 包含 sourceDirPath + templateGroupId + outputDir
 * @returns 分析报告列表
 */
export function analyzeBatchReverse(params: {
  sourceDirPath: string;
  templateGroupId: number;
  outputDir: string;
}): Promise<string[]> {
  return requestClient.post<string[]>(`/api/generator/reverse/analyze-batch`, { params });
}
