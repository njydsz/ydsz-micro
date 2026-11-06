/**
 * generator 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type CodePreviewVO = components['schemas']['CodePreviewVO'];
export type DiffLineVO = components['schemas']['DiffLineVO'];
export type GenCodeGenerateQuery = components['schemas']['GenCodeGenerateQuery'];
export type GenColumnMeta = components['schemas']['GenColumnMeta'];
export type GenDatasource = components['schemas']['GenDatasource'];
export type GenDatasourceRespVO = components['schemas']['GenDatasourceRespVO'];
export type GenHistory = components['schemas']['GenHistory'];
export type GenHistoryFile = components['schemas']['GenHistoryFile'];
export type GenResultVO = components['schemas']['GenResultVO'];
export type GenTableMeta = components['schemas']['GenTableMeta'];
export type GenTemplate = components['schemas']['GenTemplate'];
export type GenTemplateGroup = components['schemas']['GenTemplateGroup'];
export type TemplateValidateVO = components['schemas']['TemplateValidateVO'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
