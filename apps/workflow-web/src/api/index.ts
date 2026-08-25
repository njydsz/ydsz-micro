/**
 * 工作流 API 索引 API 模块（前端）
 * <p>统一导出 YDSZ-workflow 服务的全部前端 API 模块。
 * <p>供业务代码统一 import { ... } from '#/api' 使用。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './core';
export { requestClient, baseRequestClient } from './request';
export * from './flowAdvanced';
export * from './flowAnalytics';
export * from './flowCategory';
export * from './flowComment';
export * from './flowDefinition';
export * from './flowDesigner';
export * from './flowEmbeddedApproval';
export * from './flowInstance';
export * from './flowMonitorDashboard';
export * from './flowTask';
export * from './flowTemplate';
export * from './models';
