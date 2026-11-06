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
export type AgentDefinitionVO = components['schemas']['AgentDefinitionVO'];
export type AgentExecutionRequestDTO = components['schemas']['AgentExecutionRequestDTO'];
export type AgentTraceDetailDTO = components['schemas']['AgentTraceDetailDTO'];
export type AgentTraceListDTO = components['schemas']['AgentTraceListDTO'];
export type AgentTrigger = components['schemas']['AgentTrigger'];
export type AsyncTaskSubmitDTO = components['schemas']['AsyncTaskSubmitDTO'];
export type AsyncTaskVO = components['schemas']['AsyncTaskVO'];
export type BatchChatItem = components['schemas']['BatchChatItem'];
export type BatchChatRequestDTO = components['schemas']['BatchChatRequestDTO'];
export type BatchChatResponseDTO = components['schemas']['BatchChatResponseDTO'];
export type BatchResultItem = components['schemas']['BatchResultItem'];
export type ChatRequestDTO = components['schemas']['ChatRequestDTO'];
export type ChatResponseDTO = components['schemas']['ChatResponseDTO'];
export type ConsolidateMemoryRequest = components['schemas']['ConsolidateMemoryRequest'];
export type ContentPartDTO = components['schemas']['ContentPartDTO'];
export type DagCheckpoint = components['schemas']['DagCheckpoint'];
export type DagExecutionDTO = components['schemas']['DagExecutionDTO'];
export type DagWorkflowDTO = components['schemas']['DagWorkflowDTO'];
export type DagWorkflowVO = components['schemas']['DagWorkflowVO'];
export type DocumentIngestDTO = components['schemas']['DocumentIngestDTO'];
export type HybridSearchDTO = components['schemas']['HybridSearchDTO'];
export type ImageIngestDTO = components['schemas']['ImageIngestDTO'];
export type InsightReportRequest = components['schemas']['InsightReportRequest'];
export type InsightReportResult = components['schemas']['InsightReportResult'];
export type InsightSection = components['schemas']['InsightSection'];
export type MemoryVO = components['schemas']['MemoryVO'];
export type PageQuery = components['schemas']['PageQuery'];
export type RagQueryDTO = components['schemas']['RagQueryDTO'];
export type RuntimeSession = components['schemas']['RuntimeSession'];
export type SaveMemoryRequest = components['schemas']['SaveMemoryRequest'];
export type ScannedPdfIngestDTO = components['schemas']['ScannedPdfIngestDTO'];
export type SkillExecutionRequestDTO = components['schemas']['SkillExecutionRequestDTO'];
export type SkillExecutionResponseVO = components['schemas']['SkillExecutionResponseVO'];
export type TeamRun = components['schemas']['TeamRun'];
export type TeamRunMember = components['schemas']['TeamRunMember'];
export type TokenUsageDTO = components['schemas']['TokenUsageDTO'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
