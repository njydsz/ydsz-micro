import type { Plugin } from 'vite';

import { defineConfig } from '@ydsz/vite-config';

export default defineConfig(async () => {
  const trace: Plugin = {
    name: 'trace-jiti',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source.includes('jiti') ||
        importer?.includes('jiti') ||
        source.includes('vite-config') ||
        source.includes('nitropack') ||
        source.includes('c12')
      ) {
        console.log('[TRACE-IMPORT]', JSON.stringify(source), 'FROM', importer);
      }
      return null;
    },
  };
  return {
    application: {},
    vite: {
      plugins: [trace],
    },
  };
});
