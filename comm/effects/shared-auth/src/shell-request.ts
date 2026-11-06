/**
 * 子应用 HTTP 请求客户端 re-export 入口。
 *
 * @remarks
 * 9 个子应用的 `src/api/request.ts` 内容完全等价（仅头注释不同），统一由
 * `@ydsz/shared-auth` 直接导出 RequestClient 三件套。子应用只需：
 *
 * ```ts
 * export { baseRequestClient, initSharedRequest, requestClient } from '@ydsz/shared-auth';
 * ```
 *
 * <p>该 re-export 保留了子应用侧 `@ydsz/request` 的导入路径（`#/api/request`），
 * 使既有业务代码无需改动。
 *
 * @path comm\effects\shared-auth\src\shell-request.ts
 * @author ydsz-team
 * @since 4.1.0
 */

export { baseRequestClient, initSharedRequest, requestClient } from './request-setup';
