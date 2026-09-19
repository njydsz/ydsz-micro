/**
 * @ydsz-core/design-tokens 包出口。
 *
 * <p>YDSZ Design Token 体系——颜色/动效/阴影/间距/排版/密度的全量声明。
 *
 * @path comm\@core\ui-kit\design-tokens\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

export {
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
  DURATION_TOKENS,
  EASING_TOKENS,
  TRANSITION_PRESETS,
  durationVar,
  easingVar,
  RADIUS_TOKENS,
  SHADOW_LEVELS,
  SHADOW_PRESETS,
  SPACING_TOKENS,
  radiusVar,
  shadowVar,
  spacingVar,
  FONT_SIZE_TOKENS,
  FONT_WEIGHT_TOKENS,
  LINE_HEIGHT_TOKENS,
  fontSizeVar,
  fontWeightVar,
  lineHeightVar,
} from './tokens';

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

// ===== Density =====
export {
  COMPACT_TOKENS,
  STANDARD_TOKENS,
  LOOSE_TOKENS,
  DENSITY_MODES,
  DENSITY_TOKEN_MAP,
  densityCSSVars,
  generateDensityCSS,
} from './tokens/density';
export type { DensityMode } from './tokens/density';

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
