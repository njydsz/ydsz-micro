<!--
 * ClientOnly —— 仅客户端渲染的包装器。
 * 用于包裹 Teleport 等 SSR 不兼容的内容，
 * 避免 hydration mismatch。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/ssr/ClientOnly.vue
 * @author ydsz-team
 * @since 26.10.10
-->
<script setup lang="ts">
import { onMounted, ref } from 'vue'

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

defineExpose({ isClient: mounted })
</script>

<template>
  <slot v-if="mounted />
</template>
