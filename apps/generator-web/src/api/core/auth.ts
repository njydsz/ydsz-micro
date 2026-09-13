/**
 * 代码生成器子应用 / 鉴权 API 模块。
 *
 * <p>从基座 @ydsz/shared-auth/auth-api 透传登录 / 登出 / 刷新令牌 / 访问码接口；
 * <p>业务侧通过 '#/api/core/auth' 引用，不再依赖具名导入。
 *
 * @path apps/generator-web/src/api/core/auth.ts
 */
export {
  loginApi,
  logoutApi,
  refreshTokenApi,
  getAccessCodesApi,
} from '@ydsz/shared-auth/auth-api';
