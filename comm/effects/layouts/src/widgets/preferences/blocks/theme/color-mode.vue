<!--
 * color-mode 布局组件
 *
 * @path comm\effects\layouts\src\widgets\preferences\blocks\theme\color-mode.vue
 * @author remi-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { $t } from '@remi/locales';

import SwitchItem from '../switch-item.vue';

defineOptions({
  name: 'PreferenceColorMode',
});

const appColorWeakMode = defineModel<boolean>('appColorWeakMode', {
  default: false,
});

const appColorGrayMode = defineModel<boolean>('appColorGrayMode', {
  default: false,
});
</script>

<template>
  <SwitchItem v-model="appColorWeakMode">
    {{ $t('preferences.theme.weakMode') }}
  </SwitchItem>
  <SwitchItem v-model="appColorGrayMode">
    {{ $t('preferences.theme.grayMode') }}
  </SwitchItem>
</template>
