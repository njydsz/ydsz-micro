/**
 * 用户中心 API 索引 API 模块（前端）
 * <p>统一导出 YDSZ-userinfo 服务的全部前端 API 模块。
 * <p>供业务代码统一 import { ... } from '#/api' 使用。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './core';
export { requestClient, baseRequestClient } from './request';
export * from './adminSession';
export * from './auth';
export * from './authEventSse';
export * from './authPolicy';
export * from './captcha';
export * from './cas';
export * from './company';
export * from './department';
export * from './deviceSession';
export * from './internalApi';
export * from './language';
export * from './ldapSync';
export * from './menu';
export * from './oAuth2';
export * from './oAuth2Application';
export * from './oidc';
export * from './post';
export * from './role';
export * from './saml';
export * from './samlIdpConfig';
export * from './scim';
export * from './securityAlert';
export * from './securityDashboard';
export * from './selfService';
export * from './socialAccount';
export * from './socialClientConfig';
export * from './ssoMetrics';
export * from './tokenExchange';
export * from './userAccount';
export * from './userProfile';
export * from './userinfoSearch';
export * from './webAuthn';
export * from './models';
