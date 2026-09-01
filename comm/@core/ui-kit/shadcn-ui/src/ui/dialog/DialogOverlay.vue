<!--
 * 对话框遮罩：铺满视口的半透明遮罩层。
 *
 * 带 data-dismissable-modal 标记（值为菜单 id），供外部的点击关闭逻辑识别
 * 「点的是遮罩而非内容」，避免点内容区也触发关闭。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dialog\DialogOverlay.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { inject } from 'vue';

import { useScrollLock } from '@YDSZ-core/composables';

useScrollLock();
const id = inject('DISMISSABLE_MODAL_ID');
</script>
<template>
  <div :data-dismissable-modal="id" class="bg-overlay z-popup inset-0"></div>
</template>
