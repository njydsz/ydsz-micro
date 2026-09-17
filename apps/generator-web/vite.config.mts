/**
 * 代码生成器子应用 / Vite 构建配置（默认导出）。
 * <p>开发服务器固定端口 5609，api 请求代理到本地 9000。
 *
 * @default —— Vite defineConfig 产物
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
        port: 5609,
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
