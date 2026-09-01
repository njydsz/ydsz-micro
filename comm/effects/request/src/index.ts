/**
 * 请求层的统一出口：请求客户端、缓存适配器、错误码，以及透出的 axios。
 *
 * 业务代码统一从本包导入，好处有二：一是应用侧不直接依赖 axios，
 * 将来替换底层实现时改动面可控；二是 `error-codes` 与 `cache-adapter`
 * 随包一起提供，避免各应用各自维护一份错误码映射。
 *
 * 这里刻意 re-export axios 本身，供确需原始能力（如 `axios.isAxiosError`、
 * `CancelToken`）的场景使用，但常规请求应走 RequestClient。
 *
 * @path comm\effects\request\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './request-client';
export * from './cache-adapter';
export * from './error-codes';
export * from 'axios';
