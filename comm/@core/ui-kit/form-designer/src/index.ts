/**
 * @ydsz-core/form-designer 包出口。
 *
 * <p>可视化表单设计器——三栏拖拽式搭建：组件面板/画布/属性面板。
 * 包含能力：
 * <ul>
 *   <li>{@link YdFormDesigner} — 完整设计器 UI</li>
 *   <li>{@link useDesignerState} — 状态管理（添加/删除/排序/撤销/重做）</li>
 *   <li>{@link ALL_PALETTE_COMPONENTS} — 组件面板数据</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\form-designer\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ===== 组件 =====
export {
  YdDesignerCanvas,
  YdDesignerPalette,
  YdDesignerPropertyPanel,
  YdDesignerToolbar,
  YdFormDesigner,
} from './components';

export type { YdFormDesignerProps } from './components';

// ===== 组合式 API =====
export { useDesignerState } from './composables';

// ===== 类型 =====
export type {
  CanvasItem,
  CanvasValidationRule,
  DesignerComponentMeta,
  DesignerGlobalConfig,
  DesignerSchema,
} from './types';

export {
  DEFAULT_DESIGNER_CONFIG,
  DEFAULT_DESIGNER_SCHEMA,
} from './types';

// ===== 组件面板 =====
export {
  ALL_PALETTE_COMPONENTS,
  BASIC_COMPONENTS,
  ADVANCED_COMPONENTS,
  LAYOUT_COMPONENTS,
  COMPONENT_GROUPS,
} from './palette';
