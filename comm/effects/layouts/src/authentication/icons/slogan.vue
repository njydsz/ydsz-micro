<!--
 * slogan 布局组件
 *
 * 说明：SVG 矢量数据已抽离为独立静态资源 slogan.svg（云顶编码规范 §15.1
 * 「SVG 超过 2000 行必须抽离为 .svg 静态资源，禁止继续内联」），
 * 本组件仅保留 img 引用壳，行数由 4575 行降至个位数。
 *
 * @path comm\effects\layouts\src\authentication\icons\slogan.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
/** 静态 SVG 资源地址（new URL + import.meta.url 由 Vite 构建期解析，无需类型声明） */
const sloganUrl = new URL("./slogan.svg", import.meta.url).href;

/** 无障碍替代文本（由父组件注入，如应用名） */
defineProps<{ alt?: string }>();
</script>

<template>
  <img :src="sloganUrl" :alt="alt ?? 'slogan'" />
</template>
