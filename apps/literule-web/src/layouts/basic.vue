<!--
 * 规则引擎基础布局入口
 *
 * @path apps\literule-web\src\layouts\basic.vue
 * @author ydzs-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { YdSubAppLayout } from '@ydsz/shared-business';
import { YdBreadcrumb } from '@ydsz/layouts';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

/** 当前路由是否声明隐藏面包屑（路由 meta.hideBreadcrumb） */
const hideBreadcrumb = computed(() => Boolean(route.meta?.hideBreadcrumb));
</script>

<template>
  <!-- 统一面包屑：条目由 YdBreadcrumb 从路由 matched 链解析 -->
  <YdBreadcrumb v-if="!hideBreadcrumb" class="px-4 py-3" />

  <YdSubAppLayout />
</template>
