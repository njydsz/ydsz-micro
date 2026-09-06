/**
 * 二次身份验证 Composable —— 向后兼容 re-export。
 *
 * @path apps\system-web\src\composables\useSecondaryAuth.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 核心实现已迁移至 @ydsz/shared-business。本文件仅做 re-export，
 * 保证现有调用方零改动。新代码请直接从 @ydsz/shared-business 导入。
 */

export { useSecondaryAuth, openSecondaryAuthModal } from '@ydsz/shared-business';
