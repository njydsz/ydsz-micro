/**
 * 知识库 API 索引 API 模块（前端）
 * <p>统一导出 YDSZ-nextwiki 服务的全部前端 API 模块。
 * <p>供业务代码统一 import { ... } from '#/api' 使用。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './core';
export { requestClient, baseRequestClient } from './request';
export * from './ai';
export * from './analysis';
export * from './batchImport';
export * from './download';
export * from './file';
export * from './fileBatch';
export * from './fileChunk';
export * from './fileComment';
export * from './fileLock';
export * from './presignedUrl';
export * from './preview';
export * from './quota';
export * from './search';
export * from './share';
export * from './space';
export * from './spaceTemplate';
export * from './tag';
export * from './trash';
export * from './userFavorite';
export * from './userRecent';
export * from './wopi';
export * from './models';
