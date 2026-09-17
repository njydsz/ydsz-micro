<!--
 * Typography 排版：标题 / 段落 / 文本等基础文字样式。
 *
 * 语义化组件：避免随意使用 <h1>-<h6> + <p> + <span>，
 * 统一通过此包的组件编排，保证全文档字号/字重/颜色一致。
 *
 * YdTitle / YdParagraph / YdText 原子组件之间通过 provide 继承
 * context（如 ellipsis / type），避免逐层透传。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\typography\YdTypography.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
provide('YdTypographyContext', {});
</script>

<template>
  <div class="prose prose-sm max-w-none dark:prose-invert">
    <slot></slot>
  </div>
</template>
