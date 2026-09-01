<!--
 * 确认对话框的遮罩层：铺满视口并按 z-popup 层级盖住页面内容，点击即触发 close。
 *
 * 挂载期间通过 useScrollLock 锁定 body 滚动 ——
 * 若不锁定，滚轮会穿透到背景页面，关闭对话框后用户会发现视图已经滚到别处。
 * 半透明底色与模糊强度由父级 AlertDialogContent 以内联 style 传入，便于多层叠加时逐层加深。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\alert-dialog\AlertDialogOverlay.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { useScrollLock } from '@YDSZ-core/composables';

useScrollLock();
</script>
<template>
  <div class="bg-overlay z-popup inset-0"></div>
</template>
