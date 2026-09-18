/**
 * @ydsz-core/ai-builder 包出口。
 *
 * <p>从自然语言描述自动生成页面骨架，支持增量编辑后输出 YdFormSchema。
 * 包含能力：
 * <ul>
 *   <li>{@link YdAiBuilder} — 完整的生成/编辑 UI 组件</li>
 *   <li>{@link useAiBuilder} — 组合式 API（状态机）</li>
 *   <li>{@link generatePage / parseIntent} — 纯函数式生成引擎</li>
 *   <li>{@link generateFormSchema} — 字段列表 → YdFormSchema 适配</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ai-builder\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ===== 组件 =====
export {
  YdAiBuilder,
  YdAiBuilderToolbar,
  YdAiFieldList,
} from './components';

export type {
  YdAiBuilderProps,
  YdAiGeneratedEvent,
  YdAiSubmitEvent,
} from './components';

// ===== 组合式 API =====
export {
  useAiBuilder,
  type UseAiBuilderOptions,
} from './composables';

// ===== 引擎 =====
export {
  generatePage,
  parseIntent,
  inferFieldType,
  inferFieldLabel,
  inferIsRequired,
  getValidationHint,
} from './engine';

// ===== 类型 =====
export type {
  AiGenerationOptions,
  FieldSuggestion,
  FieldType,
  GeneratedPage,
  PageIntent,
} from './types';

export { DEFAULT_AI_GENERATION_OPTIONS } from './types';

// ===== 适配器 =====
export {
  generateFormSchema,
  validateFieldsForSchema,
  type SimplifiedFormField,
} from './form-schema-adapter';
