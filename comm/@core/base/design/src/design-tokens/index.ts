/**
 * 设计令牌（Design Token）的样式入口：挂载 default 与 dark 两套 CSS 变量声明。
 *
 * 本文件不导出任何 JS，存在的意义是让打包器把令牌样式纳入依赖图并产出 design.css。
 * 令牌以 CSS 变量形式落盘而非编译进组件样式，主题切换只需替换变量作用域
 * （如在根节点加/去 dark 类），组件样式无需重算，运行时不产生额外 JS 开销。
 *
 * `@ydsz-core/design-tokens` 的两个 CSS 必须由本文件挂载，不能指望各应用自行 import：
 * 该包的 `variables.css` 承载 116 个 `--ydsz-*` token（kit 组件与业务样式共 112 个名字
 * 在消费），此前**从未进入任何构建产物**——`dist/design.css` 里 `--ydsz-` 只出现 1 次，
 * 即所有 token 都靠调用点的 `var(--x, 兜底值)` 兜着，主题切换对其完全无效。
 * 接线由 `pnpm check:tokens` 校验（它断言"文件存在且被入口 import"，而非仅"文件存在"）。
 *
 * @path comm\@core\base\design\src\design-tokens\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import './components.css';
import './default.css';
import './dark.css';

// --ydsz-* 命名空间（Figma 同步管线的落盘目标 + 历史命名兼容层）
import '@ydsz-core/design-tokens/styles/variables.css';
import '@ydsz-core/design-tokens/styles/compat-aliases.css';

export {};

