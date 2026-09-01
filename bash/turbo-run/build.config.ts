/**
 * turbo-run 构建配置 —— unbuild 打包入口
 *
 * 定义 turbo-run 子包（@ydsz/turbo-run）的打包行为：
 *   - clean: 构建前清理 dist 目录
 *   - declaration: 生成 .d.ts 类型声明
 *   - entries: 以 src/index 为入口，产出可执行脚本
 *
 * 产物：dist/index.mjs（bin 入口），可被 pnpm 的 bin 字段引用。
 *
 * @path bash/turbo-run/build.config.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index'],
});
