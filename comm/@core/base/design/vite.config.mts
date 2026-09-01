/**
 * design 包 Vite 构建配置：将 scss-bem 源码目录作为静态资源目录。
 *
 * @remarks
 * 供 @core 设计系统按 scss-bem 命名方案产出样式时使用，其余构建行为由共享 vite-config 提供。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineConfig } from '@ydsz/vite-config';

/**
 * design 包的 Vite 构建配置：把 scss-bem 源码目录整目录复制到产物根目录。
 *
 * 本包是纯样式包、不产出 JS 入口，`package.json#exports` 的 `./bem` 直接指向
 * `./dist/bem.scss`。样式因此不能走任何会改写文件名或重新组织目录的转译链路，
 * 只能借 `publicDir` 的「原样拷贝」语义落地到 `dist/`，否则 exports 声明的路径会失配。
 *
 * 其余构建行为（压缩、别名、插件链）统一由共享的 `@ydsz/vite-config` 提供，
 * 这里只覆盖差异项，避免每个包各维护一份 Vite 配置而逐渐漂移。
 *
 * @returns Vite 用户配置；`vite.publicDir` 指向 `src/scss-bem`
 * @since 1.0.0
 */
export default defineConfig(async () => {
  return {
    vite: {
      publicDir: 'src/scss-bem',
    },
  };
});
