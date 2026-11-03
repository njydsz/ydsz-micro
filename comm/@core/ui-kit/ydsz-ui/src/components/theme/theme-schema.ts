/**
 * YDSZ Design Token Schema —— 三层架构的 CSS 变量注册表。
 *
 * Token 分层：
 *  - base 层：设计侧维护的原始色阶（primary / neutral 50~950），无 darkValue；
 *  - semantic 层：语义化命名（--primary / --background / --foreground 等），
 *    引用 base 层色阶，含 darkValue 用于暗色切换；
 *  - component 层：组件命名空间（--yd-table-header-bg / --yd-select-item-hover 等），
 *    引用 semantic 层 token，可按组件粒度覆写。
 *
 * 注入顺序：base → semantic → component。
 *
 * 实现拆分：
 *  - theme-schema-types.ts —— 枚举 / 接口定义；
 *  - theme-schema-semantic.ts —— semantic 层注册表；
 *  - theme-schema-component.ts —— component 层注册表；
 *  - theme-schema.ts —— 桶文件，聚合三层并 re-export 全部公开 API。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\theme\theme-schema.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { baseTokens } from './tokens-base';
import { componentTokens } from './theme-schema-component';
import { semanticTokens } from './theme-schema-semantic';
import { TokenCategory, TokenLayer } from './theme-schema-types';
import type { TokenDefinition } from './theme-schema-types';

export { TokenCategory, TokenLayer } from './theme-schema-types';
export type {
  TokenDefinition,
  TokenCategoryType,
  TokenLayerType,
} from './theme-schema-types';

/**
 * 完整语义层（base + semantic + component）的统一注册表。
 *
 * 业务方可通过 ConfigProvider.themeOverrides 覆写任意 component 层 token；
 * semantic 层通常由预设切换；base 层仅在换品牌色时修改。
 */
export const themeTokens: Record<string, TokenDefinition> = {
  ...baseTokens,
  ...semanticTokens,
  ...componentTokens,
} as unknown as Record<string, TokenDefinition>;

/** Token 名称类型（所有注册过的 token cssVar 的并集） */
export type TokenName = keyof typeof themeTokens;

/**
 * 按类别分组后的 token 映射。
 */
export const tokensByCategory = {
  animation: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.ANIMATION,
    ),
  ) as Record<string, TokenDefinition>,
  color: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.COLOR,
    ),
  ) as Record<string, TokenDefinition>,
  shadow: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.SHADOW,
    ),
  ) as Record<string, TokenDefinition>,
  size: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.SIZE,
    ),
  ) as Record<string, TokenDefinition>,
  typography: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.category === TokenCategory.TYPOGRAPHY,
    ),
  ) as Record<string, TokenDefinition>,
};

/**
 * 按层级分组后的 token 映射。
 */
export const tokensByLayer = {
  base: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.layer === TokenLayer.BASE,
    ),
  ) as Record<string, TokenDefinition>,
  semantic: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.layer === TokenLayer.SEMANTIC,
    ),
  ) as Record<string, TokenDefinition>,
  component: Object.fromEntries(
    Object.entries(themeTokens).filter(
      ([, def]) => def.layer === TokenLayer.COMPONENT,
    ),
  ) as Record<string, TokenDefinition>,
};
