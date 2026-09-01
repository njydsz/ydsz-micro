/**
 * 设计令牌（Design Token）的样式入口：挂载 default 与 dark 两套 CSS 变量声明。
 *
 * 本文件不导出任何 JS，存在的意义是让打包器把令牌样式纳入依赖图并产出 design.css。
 * 令牌以 CSS 变量形式落盘而非编译进组件样式，主题切换只需替换变量作用域
 * （如在根节点加/去 dark 类），组件样式无需重算，运行时不产生额外 JS 开销。
 *
 * @path comm\@core\base\design\src\design-tokens\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import './default.css';
import './dark.css';

export {};

