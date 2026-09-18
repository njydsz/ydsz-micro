/**
 * Design Token 统一出口。
 *
 * @path comm\@core\ui-kit\design-tokens\src\tokens\index.ts
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
} from './colors';

export type {
  ColorShade,
  RawColorComponents,
  SemanticRole,
} from './colors';

export {
  DURATION_TOKENS,
  EASING_TOKENS,
  TRANSITION_PRESETS,
  durationVar,
  easingVar,
} from './motion';

export type {
  DurationToken,
  EasingToken,
  TransitionPreset,
  TransitionPresetName,
} from './motion';

export {
  RADIUS_TOKENS,
  SHADOW_LEVELS,
  SHADOW_PRESETS,
  SPACING_TOKENS,
  radiusVar,
  shadowVar,
  spacingVar,
} from './spacing';

export type {
  RadiusToken,
  ShadowLevel,
  SpacingToken,
} from './spacing';

export {
  FONT_SIZE_TOKENS,
  FONT_WEIGHT_TOKENS,
  LINE_HEIGHT_TOKENS,
  fontSizeVar,
  fontWeightVar,
  lineHeightVar,
} from './typography';

export type {
  FontSizeToken,
  FontWeightToken,
  LineHeightToken,
} from './typography';
