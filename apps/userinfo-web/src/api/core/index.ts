/**
 * Core API 索引
 * <p>统一 re-export 当前子应用 core 模块的 auth / user / menu API。
 * <p>供业务代码统一 {@code import { loginApi } from '#/api/core'} 引用。
 *
 * @path apps\userinfo-web\src\api\core\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './auth';
export * from './user';
export * from './menu';
