<!--
 * 表单文件上传：v-model 约定桥（ElUpload 等价物的注册表形态）。
 *
 * kit YdUpload 使用 v-model:file-list（ElUpload 同款约定），而注册表统一
 * modelValue；本组件仅桥接该一个 prop，action/accept/limit/on-success
 * 等上传属性经 attrs 自动透传（inheritAttrs 默认行为，单一根组件）。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-upload.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { UploadUserFile } from '@ydsz-core/shadcn-ui';

import { YdUpload } from '@ydsz-core/shadcn-ui';

const model = defineModel<UploadUserFile[]>();
</script>

<template>
  <YdUpload v-model:file-list="model" />
</template>
