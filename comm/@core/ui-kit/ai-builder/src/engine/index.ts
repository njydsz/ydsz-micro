/**
 * AI 生成器引擎模块统一出口。
 *
 * <p>聚合意图解析、关键词匹配、页面骨架生成三大能力，
 * 为组合式 API 和服务层提供无 UI 依赖的纯逻辑入口。
 *
 * @path comm\@core\ui-kit\ai-builder\src\engine\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export { generatePage } from './page-generator';
export { parseIntent } from './intent-parser';
export {
  getValidationHint,
  inferFieldLabel,
  inferFieldType,
  inferIsRequired,
} from './keyword-matcher';
