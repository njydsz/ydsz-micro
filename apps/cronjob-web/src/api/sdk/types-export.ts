/**
 * cronjob 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type AlertRulePostDTO = components['schemas']['AlertRulePostDTO'];
export type AlertRulePutDTO = components['schemas']['AlertRulePutDTO'];
export type ConnectorConfigPostDTO = components['schemas']['ConnectorConfigPostDTO'];
export type JobBatchDTO = components['schemas']['JobBatchDTO'];
export type JobBatchUpdateDTO = components['schemas']['JobBatchUpdateDTO'];
export type JobClusterMigrationDTO = components['schemas']['JobClusterMigrationDTO'];
export type JobDagPostDTO = components['schemas']['JobDagPostDTO'];
export type JobDagPutDTO = components['schemas']['JobDagPutDTO'];
export type JobDagTriggerDTO = components['schemas']['JobDagTriggerDTO'];
export type JobPostDTO = components['schemas']['JobPostDTO'];
export type JobPutDTO = components['schemas']['JobPutDTO'];
export type JobVO = components['schemas']['JobVO'];
export type JobWebhookPostDTO = components['schemas']['JobWebhookPostDTO'];
export type JobWebhookPutDTO = components['schemas']['JobWebhookPutDTO'];
export type RemoteSubTaskRequest = components['schemas']['RemoteSubTaskRequest'];
export type RemoteTaskRequest = components['schemas']['RemoteTaskRequest'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
