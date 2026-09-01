/**
 * 通用组合式函数（hooks）的统一导出入口。
 *
 * 汇集应用配置、最大化切换、主题设计令牌、鼠标悬停、前端分页、标签栏、
 * 水印等复用逻辑，供业务侧按需从 @ydsz/hooks 导入使用。
 *
 * @path comm\effects\hooks\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './use-app-config';
export * from './use-content-maximize';
export * from './use-design-tokens';
export * from './use-hover-toggle';
export * from './use-pagination';
export * from './use-refresh';
export * from './use-tabs';
export * from './use-watermark';
export * from '@YDSZ-core/composables';
