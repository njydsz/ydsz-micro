<!--
 * not-found 页面组件
 *
 * @path apps\\literule-web\\src\\views\\fallback\\not-found.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 404 兜底页
 *
 * @remarks
 * 实现收敛到 `@ydsz/shared-auth` 的 `ShellNotFound`，此处仅做 re-export，
 * 保留子应用侧 `#/views/fallback/not-found` 的导入路径。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { ShellNotFound } from '@ydsz/shared-auth';

defineOptions({ name: 'FallbackNotFound' });
</script>

<template>
  <ShellNotFound />
</template>
