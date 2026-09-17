/**
 * design 包的样式总入口：按层叠顺序聚合设计令牌与四组全局样式。
 *
 * 引入顺序即 CSS 层叠顺序，不可随意调换：先令牌（定义变量）后全局样式（消费变量），
 * 顺序颠倒会让消费方读到未定义的变量而回退到无效值。
 * 与 design-tokens/index.ts 一样只产生样式副作用、不导出 JS。
 *
 * @path comm\@core\base\design\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import './design-tokens';

import './css/global.css';
import './css/transition.css';
import './css/nprogress.css';
import './css/ui.css';

export {};

