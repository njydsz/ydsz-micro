/**
 * 系统管理子应用 Vite 构建配置。
 *
 * @remarks
 * 开发服务器固定端口 5602，/api 请求代理至本地 9000 端口。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineConfig } from '@ydsz/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      base: '/',
      plugins: [
      ],
      server: {
        port: 5602,
        cors: true,
        host: '0.0.0.0',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:9000',
            ws: true,
          },
        },
      },
    },
  };
});
