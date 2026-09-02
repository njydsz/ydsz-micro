/**
 * message 命名类型别名导出
 *
 * <p>由 unified-contract.mjs 自动生成，请勿手动修改。
 * <p>提供 components.schemas 中定义的命名类型别名，消除 models.ts 手动类型定义。
 *
 * @auto-generated
 * @since 4.0.0
 */

import type { components } from './schema';

// 导出命名类型别名，便于业务代码直接使用
export type BatchSendRequestDTO = components['schemas']['BatchSendRequestDTO'];
export type BroadcastRequestDTO = components['schemas']['BroadcastRequestDTO'];
export type MessageFeedbackDTO = components['schemas']['MessageFeedbackDTO'];
export type MessageLogQueryDTO = components['schemas']['MessageLogQueryDTO'];
export type MessageRequest = components['schemas']['MessageRequest'];
export type MessageSendDTO = components['schemas']['MessageSendDTO'];
export type NotificationQueryDTO = components['schemas']['NotificationQueryDTO'];
export type NotificationSendDTO = components['schemas']['NotificationSendDTO'];
export type PageQuery = components['schemas']['PageQuery'];
export type PreferenceUpsertDTO = components['schemas']['PreferenceUpsertDTO'];
export type PushRealtimeRequestDTO = components['schemas']['PushRealtimeRequestDTO'];
export type RecallRequestDTO = components['schemas']['RecallRequestDTO'];
export type ReceiptCallbackDTO = components['schemas']['ReceiptCallbackDTO'];
export type RouteRuleUpsertDTO = components['schemas']['RouteRuleUpsertDTO'];
export type SubscriptionUpsertDTO = components['schemas']['SubscriptionUpsertDTO'];
export type TemplateAuditDTO = components['schemas']['TemplateAuditDTO'];
export type TemplateCreateDTO = components['schemas']['TemplateCreateDTO'];
export type TemplatePreviewDTO = components['schemas']['TemplatePreviewDTO'];
export type TemplateQueryDTO = components['schemas']['TemplateQueryDTO'];
export type TemplateTestSendDTO = components['schemas']['TemplateTestSendDTO'];
export type UnsubscribeQueryDTO = components['schemas']['UnsubscribeQueryDTO'];
export type UserChannelBindingDTO = components['schemas']['UserChannelBindingDTO'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
