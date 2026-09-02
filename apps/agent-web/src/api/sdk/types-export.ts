/**
 * agent 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type AgentDefinitionDTO = components['schemas']['AgentDefinitionDTO'];
export type AgentExecutionRequestDTO = components['schemas']['AgentExecutionRequestDTO'];
export type BatchChatRequestDTO = components['schemas']['BatchChatRequestDTO'];
export type ChatRequestDTO = components['schemas']['ChatRequestDTO'];
export type DagExecutionDTO = components['schemas']['DagExecutionDTO'];
export type DocumentIngestDTO = components['schemas']['DocumentIngestDTO'];
export type RagQueryDTO = components['schemas']['RagQueryDTO'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
