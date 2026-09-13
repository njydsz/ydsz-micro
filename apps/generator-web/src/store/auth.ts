/**
 * 代码生成器子应用 / 鉴权状态 Store。
 *
 * <p>复用基座共享鉴权 store（createSharedAuthStore），按业务子应用命名空间隔离。
 *
 * @path apps/generator-web/src/store/auth.ts
 */
export { createSharedAuthStore } from '@ydsz/shared-auth';

export const useAuthStore = createSharedAuthStore();
