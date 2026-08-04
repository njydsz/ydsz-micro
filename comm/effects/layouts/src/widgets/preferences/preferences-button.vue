<!--
 * preferences-button 布局组件
 *
 * @path comm\effects\layouts\src\widgets\preferences\preferences-button.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { Settings } from '@remi/icons';

import { REMIIconButton } from '@remi-core/shadcn-ui';

import Preferences from './preferences.vue';

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}
</script>
<template>
  <Preferences @clear-preferences-and-logout="clearPreferencesAndLogout">
    <REMIIconButton>
      <Settings class="text-foreground size-4" />
    </REMIIconButton>
  </Preferences>
</template>
