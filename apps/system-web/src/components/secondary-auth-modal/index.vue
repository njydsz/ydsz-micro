<!--
 * 二次身份验证弹窗组件 —— 向后兼容 re-export。
 *
 * @path apps\system-web\src\components\secondary-auth-modal\index.vue
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 核心实现已迁移至 @ydsz/shared-business。本文件仅做 re-export，
 * 保证现有调用方零改动。新代码请直接从 @ydsz/shared-business 导入。
-->
<script lang="ts" setup>
export { default } from '@ydsz/shared-business/components/secondary-auth-modal/index.vue';
</script>
