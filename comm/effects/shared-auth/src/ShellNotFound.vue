<!--
 * 子应用 404 兜底页（统一实现）。
 *
 * <p>9 个子应用的 `views/fallback/not-found.vue` 长期各存一份拷贝（内容等价，
 * 仅 `@path` 注释与个别 class 不同）。本组件收敛为单一事实源，
 * 文案走 `fallback.*` i18n 词条（由 @ydsz/locales 全局注入 `$t`）。
 *
 * @path comm\effects\shared-auth\src\ShellNotFound.vue
 * @author ydsz-team
 * @since 4.1.0
-->
<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { YdButton } from '@ydsz-core/ydsz-ui';

defineOptions({ name: 'ShellNotFound' });

const router = useRouter();
</script>

<template>
  <div class="flex h-full min-h-[400px] items-center justify-center">
    <div class="text-center">
      <div class="mb-4 text-6xl font-bold text-gray-300">404</div>
      <div class="mb-6 text-gray-500">{{ $t('fallback.notFound') }}</div>
      <YdButton @click="router.back()">{{ $t('fallback.back') }}</YdButton>
    </div>
  </div>
</template>
