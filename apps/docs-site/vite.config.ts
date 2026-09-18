import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['vue', '@antv/g6', 'mermaid'],
  },
  ssr: {
    noExternal: ['vitepress'],
  },
});
