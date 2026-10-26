/**
 * 消息中心子应用 Vite 构建配置。
 *
 * @remarks
 * 开发服务器固定端口 5604，/api 请求代理至本地 9000 端口。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineConfig, withVendorExternals } from '@ydsz/vite-config';

/**
 * 消息中心子应用 / Vite 构建配置（默认导出）。
 *
 * <p>基于 @ydsz/vite-config 共享配置扩展；开发端口 5604，/api 代理至本地 9000。
 *
 * @default —— Vite defineConfig 产物
 */
export default defineConfig(async () => {
  return {
    application: {},
    vite: withVendorExternals({
      base: '/',
      plugins: [
      ],
      server: {
        port: 5604,
        cors: true,
        host: '0.0.0.0',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        proxy: {
          // /api 必须原样转发：剥掉 /api 由网关 StripPrefix=1 负责，代理再剥一次会全量 404
          '/api': {
            changeOrigin: true,
            target: 'http://localhost:9000',
            ws: true,
          },
        },
      },
    }),
  };
});
