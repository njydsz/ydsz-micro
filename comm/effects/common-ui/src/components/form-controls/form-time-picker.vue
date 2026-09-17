<!--
 * 表单时间选择（过渡件）：EP TimePicker 语义暂由 YdDatePicker datetime 承载。
 *
 * kit 的 YdDatePicker 仅覆盖 date/datetime，尚无独立的时分秒 TimePicker；
 * 本组件将 type 固定为 datetime 以承接存量 schema 的 TimePicker 声明，
 * 待 P1-1 专用 TimePicker 落地后整体替换（ep-exit-refactor-plan v3 §P1-1）。
 *
 * @path comm\effects\common-ui\src\components\form-controls\form-time-picker.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { YdDatePicker } from '@ydsz-core/shadcn-ui';

const model = defineModel<string>();
</script>

<template>
  <YdDatePicker v-model="model" type="datetime" />
</template>
