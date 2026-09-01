/**
 * @YDSZ-core/preferences 包的 unbuild 构建配置：单入口打包偏好中心。
 *
 * @path comm\@core\preferences\build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

/**
 * 偏好中心的构建配置：以 rollup 单入口打包。
 *
 * 产物形态：`dist/index.mjs` + `.cjs` + `.d.ts`。注意本包保留了 `src` 参与发布
 * （`files` 含 `src`），且 `package.json#exports` 的 `default` 条件仍指向源码 ——
 * 也就是说 dist 产物当前并未真正对外生效，构建配置更多是保持与其它包一致的占位。
 * 调整 exports 前，dist 只被当作构建链路健康度的验证。
 *
 * externals 处理：`@YDSZ-core/shared`（本地持久化与广播通道）与 `@YDSZ-core/typings`
 * 由 unbuild 自动外部化。偏好中心持有全局单例状态，被内联会产生多份偏好实例，
 * 表现为「改了设置但只有部分组件刷新」。
 *
 * @returns unbuild 构建配置
 * @since 1.0.0
 */
export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
