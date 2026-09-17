<!--
 * preferences-button 布局组件
 *
 * @path comm\effects\layouts\src\widgets\preferences\preferences-button.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { Settings } from '@ydsz/icons';

import { YdIconButton } from '@ydsz-core/ydsz-ui';

import Preferences from './preferences.vue';

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}
</script>
<template>
  <Preferences @clear-preferences-and-logout="clearPreferencesAndLogout">
    <YdIconButton>
      <Settings class="text-foreground size-4" />
    </YdIconButton>
  </Preferences>
</template>
