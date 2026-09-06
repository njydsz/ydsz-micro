/**
 * 代码生成器 HTTP 请求客户端 API 模块（前端）。
 *
 * <p>封装 ydsz-generator 服务的 HTTP 请求客户端，基于 @ydsz/shared-auth 统一注入 Token / TraceId / 错误处理。
 *
 * @path apps/generator-web/src/api/request.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export {
  baseRequestClient,
  initSharedRequest,
  requestClient,
} from '@ydsz/shared-auth';
