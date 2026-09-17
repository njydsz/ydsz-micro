/**
 * YDSZ Vue UI — @ydsz-core/ui
 * ============================================
 * 云顶智臻自研 Vue 组件库统一入口。
 *
 * 所有组件统一使用 Yd 前缀命名，避免与 Element Plus / Ant Design / Naive UI
 * 等第三方库冲突；同时保留子路径导入以便按需引入、tree-shaking 友好。
 *
 * ## 使用方式
 *
 * ```ts
 * // 方式一：全量引入（适合中小项目）
 * import { YdButtonSmart, YdForm, YdModal, YdMenu } from '@ydsz-core/ui';
 *
 * // 方式二：子路径按需引入（推荐，tree-shaking 友好）
 * import { YdButtonSmart } from '@ydsz-core/ui/shadcn-ui';
 * import { YdForm } from '@ydsz-core/ui/form';
 * import { YdModal } from '@ydsz-core/ui/popup';
 * ```
 *
 * 子路径一览：
 *  - `@ydsz-core/ui/shadcn-ui` — 业务组件 + primitives (YdButtonSmart/YdButtonSmart/YdDialog/...)
 *  - `@ydsz-core/ui/form`     — 表单引擎 (YdForm, setupYdForm, ...)
 *  - `@ydsz-core/ui/popup`    — 弹窗 + 抽屉 (YdModal, YdDrawer, YdAlert)
 *  - `@ydsz-core/ui/menu`     — 菜单系统 (YdMenu, YdMenuBadge, ...)
 *  - `@ydsz-core/ui/tabs`     — 标签页 (YdTabsView)
 *  - `@ydsz-core/ui/layout`   — 布局框架 (YdAdminLayout)
 *  - `@ydsz-core/ui/editor`   — 富文本编辑器 (YdTipTapEditor)
 *
 * @module @ydsz-core/ui
 * @author ydsz-team
 * @since 26.09.17
 */

// ===== 基础 + 业务组件（shadcn-ui 风格）=====
export * from '@ydsz-core/shadcn-ui';

// ===== 表单引擎 =====
export { setupYdForm } from '@ydsz-core/form-ui';
export type { YdFormProps, YdFormSchema } from '@ydsz-core/form-ui';
export { useYdForm } from '@ydsz-core/form-ui';
export * as z from '@ydsz-core/form-ui';
export { openApiSchemaToComponentType, openApiSchemaToFormFields } from '@ydsz-core/form-ui';
export type { ComponentFieldConfig, ComponentMappingOptions } from '@ydsz-core/form-ui';

// ===== 弹窗 / 抽屉 =====
export { YdModal, YdDrawer, YdAlert } from '@ydsz-core/popup-ui';
export { useYdModal, useYdDrawer } from '@ydsz-core/popup-ui';
export type { YdPopupApi, YdPopupApiCallbacks, YdPopupApiOptions } from '@ydsz-core/popup-ui';

// ===== 菜单 =====
export { YdMenu, YdMenuBadge, YdNormalMenu } from '@ydsz-core/menu-ui';

// ===== 标签页 =====
export { YdTabsView } from '@ydsz-core/tabs-ui';

// ===== 布局 =====
export { YdAdminLayout } from '@ydsz-core/layout-ui';
export type { YdLayoutProps } from '@ydsz-core/layout-ui';

// ===== 富文本编辑器 =====
export { YdTipTapEditor, YdTipTapToolbar, getYdDefaultExtensions } from '@ydsz-core/editor-ui';

// ===== 全局 CSS 令牌（可选引入）=====
import '@ydsz-core/shadcn-ui/src/assets/index.css';
