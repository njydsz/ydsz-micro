/**
 * 系统管理 API 索引 API 模块（前端）
 * <p>统一导出 YDSZ-system 服务的全部前端 API 模块。
 * <p>供业务代码统一 import { ... } from '#/api' 使用。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './core';
export { requestClient, baseRequestClient } from './request';
export * from './appInfo';
export * from './auditAdmin';
export * from './config';
export * from './configVersion';
export * from './dict';
export * from './dictItem';
export * from './dictVersion';
export * from './frontendInit';
export * from './internalApi';
export * from './tenant';
export * from './tenantPlan';
export * from './variable';
export * from './variableVersion';
export * from './models';
