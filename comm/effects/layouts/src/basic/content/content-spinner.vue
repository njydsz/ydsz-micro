<!--
 * content-spinner 布局组件
 *
 * @path comm\effects\layouts\src\basic\content\content-spinner.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { REMISpinner } from '@YDSZ-core/shadcn-ui';

import { useContentSpinner } from './use-content-spinner';

defineOptions({ name: 'LayoutContentSpinner' });

const { spinning } = useContentSpinner();
</script>
<template>
  <REMISpinner :spinning="spinning" />
</template>
