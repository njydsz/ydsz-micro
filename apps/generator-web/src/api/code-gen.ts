/**
 * CodeGenController API 封装。
 *
 * <p>对应后端 {@code CodeGenController}，路径前缀 /api/generator/code。
 * <p>提供代码预览、单表生成、全量生成三个端点。
 *
 * @author ydsz-team
 * @path apps/generator-web/src/api/code-gen.ts
 * @since 1.0.0
 */
import { requestClient } from '#/api/request';
import type { CodePreviewVO, GenCodeGenerateQuery, GenResultVO } from './models';

/**
 * 预览生成结果。
 *
 * @param datasourceId 数据源 ID
 * @param templateGroupId 模板分组 ID
 * @param tableName 表名
 * @returns 预览列表
 */
export function preview(params: {
  datasourceId: number;
  templateGroupId: number;
  tableName: string;
}): Promise<CodePreviewVO[]> {
  return requestClient.get<CodePreviewVO[]>(`/api/generator/code/preview`, { params });
}

/**
 * 正式生成代码到指定目录（单表）。
 *
 * @param data 生成参数
 * @returns 生成结果
 */
export function generate(data: GenCodeGenerateQuery): Promise<GenResultVO> {
  return requestClient.post<GenResultVO>(`/api/generator/code/generate`, data);
}

/**
 * 批量生成（全库）。
 *
 * @param params 全量生成参数
 * @returns 生成结果汇总
 */
export function generateAll(params: {
  datasourceId: number;
  templateGroupId: number;
  outputDir: string;
  conflictStrategy?: string;
  triggeredBy?: string;
}): Promise<GenResultVO> {
  return requestClient.post<GenResultVO>(`/api/generator/code/generate/all`, { params });
}
