<!--
 * 表单开关：radix checked 约定 → form-ui modelValue 约定的值桥。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-switch.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { YdSwitch } from '@ydsz-core/ydsz-ui';

const model = defineModel<boolean>();
</script>

<template>
  <YdSwitch v-model:checked="model" />
</template>
