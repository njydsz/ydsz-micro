/**
 * YDSZ Design Token Schema —— 类型定义层。
 *
 * 本文件只承载枚举 / 接口，不含任何注册表数据；供 base / semantic / component
 * 三层 token 定义与桶文件复用，避免循环依赖。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\theme\theme-schema-types.ts
 * @author ydsz-team
 * @since 5.6.0
 */

/**
 * 主题类别枚举——防止把形状 token 写进颜色字段。
 */
export const TokenCategory = {
  ANIMATION: 'animation',
  COLOR: 'color',
  SHADOW: 'shadow',
  SIZE: 'size',
  TYPOGRAPHY: 'typography',
} as const;

/** 主题类别 */
export type TokenCategoryType = (typeof TokenCategory)[keyof typeof TokenCategory];

/** Token 分层 */
export const TokenLayer = {
  /** 设计侧原始色阶 */
  BASE: 'base',
  /** 语义化命名，含暗色值 */
  SEMANTIC: 'semantic',
  /** 组件级 token，可独立覆写 */
  COMPONENT: 'component',
} as const;

/** Token 分层类型 */
export type TokenLayerType = (typeof TokenLayer)[keyof typeof TokenLayer];

/**
 * 单个 token 的元数据描述。
 */
export interface TokenDefinition {
  /** CSS 变量名（不含 -- 前缀） */
  readonly cssVar: string;
  /** 所属类别 */
  readonly category: TokenCategoryType;
  /** 分层：base | semantic | component */
  readonly layer: TokenLayerType;
  /** 人类可读描述 */
  readonly description: string;
  /** 默认值（light 主题） */
  readonly defaultValue: string;
  /** 暗夜模式下的值（可选；不定义则 fallback 到 defaultValue） */
  readonly darkValue?: string;
  /** 引用的 base 层 token 名（component 层可选声明） */
  readonly ref?: string;
  /** 示例用途（用于文档生成） */
  readonly example?: string;
}
