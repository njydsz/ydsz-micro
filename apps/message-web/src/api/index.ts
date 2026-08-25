/**
 * 消息服务 API 索引 API 模块（前端）
 * <p>统一导出 YDSZ-message 服务的全部前端 API 模块。
 * <p>供业务代码统一 import { ... } from '#/api' 使用。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './core';
export { requestClient, baseRequestClient } from './request';
export * from './aggregate';
export * from './batch';
export * from './canary';
export * from './deadLetter';
export * from './message';
export * from './messageArchive';
export * from './messageFeedback';
export * from './messageStats';
export * from './messageTrace';
export * from './notification';
export * from './ops';
export * from './preference';
export * from './readReceipt';
export * from './readStatus';
export * from './recall';
export * from './receipt';
export * from './retryPreview';
export * from './routeRule';
export * from './subscription';
export * from './systemHealth';
export * from './template';
export * from './templatePreview';
export * from './templateVersion';
export * from './unsubscribe';
export * from './userChannelBinding';
export * from './models';
