/**
 * library 配置模块
 *
 * @path conf\vite-config\src\config\library.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { ConfigEnv, UserConfig } from 'vite';

import type { DefineLibraryOptions } from '../typing';

import { readPackageJSON } from '@ydsz/node-utils';

import { defineConfig, mergeConfig } from 'vite';

import { loadLibraryPlugins } from '../plugins';
import { getCommonConfig } from './common';

/**
 * 构造库（npm 包）类型的 Vite 配置。
 *
 * 以 src/index.ts 为入口产出 ESM 包，并将 package.json 的依赖与
 * peerDependencies 全部标记为 external，避免把第三方依赖打进产物；
 * 依次叠加共用配置与用户自定义 vite 配置。
 *
 * @param userConfigPromise - 用户自定义库配置函数
 * @returns 库类型的 Vite 配置
 */
function defineLibraryConfig(userConfigPromise?: DefineLibraryOptions) {
  return defineConfig(async (config: ConfigEnv) => {
    const options = await userConfigPromise?.(config);
    const { command, mode } = config;
    const { library = {}, vite = {} } = options || {};
    const root = process.cwd();
    const isBuild = command === 'build';

    const plugins = await loadLibraryPlugins({
      dts: false,
      injectMetadata: true,
      isBuild,
      mode,
      ...library,
    });

    const { dependencies = {}, peerDependencies = {} } =
      await readPackageJSON(root);

    const externalPackages = [
      ...Object.keys(dependencies),
      ...Object.keys(peerDependencies),
    ];

    const packageConfig: UserConfig = {
      build: {
        lib: {
          entry: 'src/index.ts',
          fileName: () => 'index.mjs',
          formats: ['es'],
        },
        rollupOptions: {
          external: (id) => {
            // CSS 一律打进产物样式：workspace 依赖的样式子路径若被标记为 external，
            // 只会在原包 index.mjs 里留下一条 `import "@scope/pkg/x.css"`，
            // 而消费方按 exports 取的是构建好的 dist/*.css——
            // 结果是"样式文件存在、import 语句也在，但产物里就是没有"。
            // base/design 的 @ydsz-* 令牌正是这样丢掉的（dist/design.css 里 0 个令牌）。
            if (id.endsWith('.css')) return false;
            return externalPackages.some(
              (pkg) => id === pkg || id.startsWith(`${pkg}/`),
            );
          },
        },
      },
      plugins,
    };
    const commonConfig = await getCommonConfig();
    const mergedConmonConfig = mergeConfig(commonConfig, packageConfig);
    return mergeConfig(mergedConmonConfig, vite);
  });
}

export { defineLibraryConfig };
