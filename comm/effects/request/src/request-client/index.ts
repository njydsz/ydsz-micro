/**
 * 请求客户端子模块的聚合出口。
 *
 * 把实现分散在 `request-client` / `preset-interceptors` / `create-request-client`
 * 等多个文件的产物收敛为一个导入路径，使外部只依赖目录而非具体文件；
 * 内部文件可自由拆分重组而不影响使用方。
 *
 * 其中 `preset-interceptors` 承载与后端契约耦合的逻辑，
 * `request-client` 只提供传输能力，二者以拦截器形式组合。
 *
 * @path comm\effects\request\src\request-client\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './business-error';
export * from './create-request-client';
export { clearDedupCache, getDedupCacheSize } from './request-dedup';
export * from './preset-interceptors';
export * from './request-client';
export type * from './types';
