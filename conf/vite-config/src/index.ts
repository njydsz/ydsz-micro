/**
 * index 配置模块
 *
 * v4.4.1 A3: 微应用注册表（MICRO_APPS）已迁至 comm/constants（运行时单源），
 * 构建配置包不再导出注册表，消除运行时反向依赖构建配置的分层倒置。
 *
 * @path conf\vite-config\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './config';
export * from './options';
export * from './plugins';
export { loadAndConvertEnv } from './utils/env';
