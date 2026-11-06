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
export type BatchProgressDTO = components['schemas']['BatchProgressDTO'];
export type BatchSendRequestDTO = components['schemas']['BatchSendRequestDTO'];
export type BloomFilterStatsVO = components['schemas']['BloomFilterStatsVO'];
export type BroadcastRequestDTO = components['schemas']['BroadcastRequestDTO'];
export type CacheStatsVO = components['schemas']['CacheStatsVO'];
export type ChannelCost = components['schemas']['ChannelCost'];
export type ChannelHealthVO = components['schemas']['ChannelHealthVO'];
export type ChannelStatsDTO = components['schemas']['ChannelStatsDTO'];
export type CostStatsDTO = components['schemas']['CostStatsDTO'];
export type FunnelStatsDTO = components['schemas']['FunnelStatsDTO'];
export type HandlerNode = components['schemas']['HandlerNode'];
export type MessageFeedbackDTO = components['schemas']['MessageFeedbackDTO'];
export type MessageItemRequestDTO = components['schemas']['MessageItemRequestDTO'];
export type MessageLogQueryDTO = components['schemas']['MessageLogQueryDTO'];
export type MessageSendDTO = components['schemas']['MessageSendDTO'];
export type MessageSendResultVO = components['schemas']['MessageSendResultVO'];
export type MessageStatsDTO = components['schemas']['MessageStatsDTO'];
export type MsgAggregateVO = components['schemas']['MsgAggregateVO'];
export type MsgBatchVO = components['schemas']['MsgBatchVO'];
export type MsgFeedbackVO = components['schemas']['MsgFeedbackVO'];
export type MsgLogVO = components['schemas']['MsgLogVO'];
export type MsgNotificationVO = components['schemas']['MsgNotificationVO'];
export type MsgPreferenceVO = components['schemas']['MsgPreferenceVO'];
export type MsgReceiptVO = components['schemas']['MsgReceiptVO'];
export type MsgRouteRuleVO = components['schemas']['MsgRouteRuleVO'];
export type MsgSubscriptionVO = components['schemas']['MsgSubscriptionVO'];
export type MsgTemplateVO = components['schemas']['MsgTemplateVO'];
export type MsgTemplateVersionVO = components['schemas']['MsgTemplateVersionVO'];
export type MsgTraceVO = components['schemas']['MsgTraceVO'];
export type MsgUserChannelVO = components['schemas']['MsgUserChannelVO'];
export type NotificationQueryDTO = components['schemas']['NotificationQueryDTO'];
export type NotificationSendDTO = components['schemas']['NotificationSendDTO'];
export type PageQuery = components['schemas']['PageQuery'];
export type PipelineTopologyVO = components['schemas']['PipelineTopologyVO'];
export type PreferenceUpsertDTO = components['schemas']['PreferenceUpsertDTO'];
export type PushRealtimeRequestDTO = components['schemas']['PushRealtimeRequestDTO'];
export type ReactiveEvent = components['schemas']['ReactiveEvent'];
export type RecallRequestDTO = components['schemas']['RecallRequestDTO'];
export type ReceiptCallbackDTO = components['schemas']['ReceiptCallbackDTO'];
export type ReceiptStatsDTO = components['schemas']['ReceiptStatsDTO'];
export type RouteRuleUpsertDTO = components['schemas']['RouteRuleUpsertDTO'];
export type SubscriptionUpsertDTO = components['schemas']['SubscriptionUpsertDTO'];
export type SystemHealthVO = components['schemas']['SystemHealthVO'];
export type TemplateAuditDTO = components['schemas']['TemplateAuditDTO'];
export type TemplateCreateDTO = components['schemas']['TemplateCreateDTO'];
export type TemplatePreviewDTO = components['schemas']['TemplatePreviewDTO'];
export type TemplateQueryDTO = components['schemas']['TemplateQueryDTO'];
export type TemplateTestSendDTO = components['schemas']['TemplateTestSendDTO'];
export type UnsubscribeQueryDTO = components['schemas']['UnsubscribeQueryDTO'];
export type UnsubscribeTokenPayload = components['schemas']['UnsubscribeTokenPayload'];
export type UserChannelBindingDTO = components['schemas']['UserChannelBindingDTO'];

// 常用响应类型别名
export type { PageResponse, YdszResponse } from '../models';
