<!--
 * 抽屉的遮罩层：铺满视口盖住底层内容，并锁住页面滚动。
 *
 * 从 DISMISSABLE_DRAWER_ID 注入出 id 并写到 data-dismissable-drawer 上，
 * 供外部的「点击外部关闭」逻辑识别当前抽屉 —— 多层抽屉叠加时，
 * 只有带 id 的那一层才会响应关闭，避免一次点击关掉所有层。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\sheet\SheetOverlay.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { inject } from 'vue';

import { useScrollLock } from '@YDSZ-core/composables';

useScrollLock();
const id = inject('DISMISSABLE_DRAWER_ID');
</script>
<template>
  <div :data-dismissable-drawer="id" class="bg-overlay z-popup inset-0"></div>
</template>
