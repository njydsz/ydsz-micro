/**
 * @ydsz/common-ui 公共 UI 模块统一入口
 *
 * 聚合 components 与 ui 两个子模块，对外提供单一 import 入口，
 * 子应用按需引用即可获得全套共享 UI 组件与业务页面。
 *
 * @path comm\effects\common-ui\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @deprecated
 * `@ydsz/common-ui` 正逐步淘汰，请按以下方式迁移：
 *
 * | 类别 | 推荐导入源 |
 * |------|-----------|
 * | YdEmptyState / YdErrorState | `@ydsz/shared-business` |
 * | form-ui 系列（useYdForm / z / YdFormSchema 等） | `@ydsz-core/form-ui` |
 * | popup-ui 系列 | `@ydsz-core/popup-ui` |
 * | ydsz-ui 基础组件（YdButton / YdAvatar 等） | `@ydsz-core/ydsz-ui` |
 * | form-controls 适配层（FormCheckbox / FormUpload 等） | 暂保留在 common-ui，长期迁移至 `@ydsz-core/form-ui` |
 * | 验证码 / 水印 / 骨架屏等独立组件 | 视情况内联到子应用或迁移至 `@ydsz-core/*` |
 * | ui/ 下的认证、Dashboard、fallback 页面 | 迁移到对应的页面模块 |
 *
 * 继续通过 `@ydsz/common-ui` 导入不会立即报错，但 IDE 会显示弃用警告。
 */
export * from './components';
export * from './ui';
