<!--
 * 表单复选框：radix checked 约定 → form-ui modelValue 约定的值桥。
 *
 * YdCheckbox 沿用 radix CheckboxRoot 的 v-model:checked，而注册表统一
 * 以 modelValue 绑定，本组件只做这一层双向转换，其余 attrs 透传。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-checkbox.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { YdCheckbox } from '@ydsz-core/ydsz-ui';

const model = defineModel<boolean>();
</script>

<template>
  <YdCheckbox v-model:checked="model" />
</template>
