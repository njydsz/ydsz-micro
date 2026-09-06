/**
 * 代码生成器 API 索引模块（前端）。
 *
 * <p>统一导出 ydsz-generator 服务的全部前端 API 模块。
 * <p>供业务代码统一 import { ... } from '#/api' 使用。
 *
 * @path apps/generator-web/src/api/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** Core API — auth / user / menu */
export {
  loginApi,
  logoutApi,
  refreshTokenApi,
  getAccessCodesApi,
} from './core/auth';

export {
  getUserInfoApi,
} from './core/user';

export {
  getAllMenusApi,
  getMenuTreeApi,
} from './core/menu';

/** HTTP 请求客户端 */
export {
  requestClient,
  baseRequestClient,
  initSharedRequest,
} from './request';

/** Generator 业务 API */
export * from './code-gen';
export * from './datasource';
export * from './table-meta';
export * from './template';
export * from './history';
export * from './import-export';
export * from './reverse';

/** 后端契约模型 */
export type * from './models';
