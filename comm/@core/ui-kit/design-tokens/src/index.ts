/**
 * @ydsz-core/design-tokens 包出口。
 *
 * <p>YDSZ Design Token 体系——颜色/动效/阴影/间距/排版的全量声明。
 * 包含能力：
 * <ul>
 *   <li>完整的 Type-safe Token 常量（colors / motion / shadow / spacing / typography）</li>
 *   <li>CSS 变量引用辅助函数（colorTokenVar / spacingVar / ...）</li>
 *   <li>CSS 变量总表（styles/variables.css）直接注入 :root</li>
 * </ul>
 *
 * <p>使用方式：
 * <pre>{@code
 * import '@ydsz-core/design-tokens/src/styles/variables.css';
 * import { colorTokenVar, durationVar } from '@ydsz-core/design-tokens';
 * }</pre>
 *
 * @path comm\@core\ui-kit\design-tokens\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ===== Token 常量 =====
export {
  /* colors */
  BRAND_RAW,
  COLOR_SHADES,
  DESTRUCTIVE_RAW,
  NEUTRAL_RAW,
  SEMANTIC_RAW_MAP,
  SUCCESS_RAW,
  WARNING_RAW,
  borderTokenVar,
  colorTokenVar,
  surfaceTokenVar,
  textTokenVar,
  /* motion */
  DURATION_TOKENS,
  EASING_TOKENS,
  TRANSITION_PRESETS,
  durationVar,
  easingVar,
  /* spacing & shadow */
  RADIUS_TOKENS,
  SHADOW_LEVELS,
  SHADOW_PRESETS,
  SPACING_TOKENS,
  radiusVar,
  shadowVar,
  spacingVar,
  /* typography */
  FONT_SIZE_TOKENS,
  FONT_WEIGHT_TOKENS,
  LINE_HEIGHT_TOKENS,
  fontSizeVar,
  fontWeightVar,
  lineHeightVar,
} from './tokens';

// ===== 类型 =====
export type {
  ColorShade,
  DurationToken,
  EasingToken,
  FontSizeToken,
  FontWeightToken,
  LineHeightToken,
  RadiusToken,
  RawColorComponents,
  SemanticRole,
  ShadowLevel,
  SpacingToken,
  TransitionPreset,
  TransitionPresetName,
} from './tokens';

// ===== Figma Sync =====
export {
  exportToFigma,
  importFromFigma,
  generateFigmaPluginConfig,
} from './figma-sync';
export type {
  TokenDiff,
  FigmaTokenFile,
  FigmaTokenGroup,
  FigmaTokenValue,
} from './figma-sync';
