<!--
 * language-toggle 布局组件
 *
 * @path comm\effects\layouts\src\widgets\language-toggle.vue
 * @author remi-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { SupportedLanguagesType } from '@remi/locales';

import { SUPPORT_LANGUAGES } from '@remi/constants';
import { Languages } from '@remi/icons';
import { loadLocaleMessages } from '@remi/locales';
import { preferences, updatePreferences } from '@remi/preferences';

import { REMIDropdownRadioMenu, REMIIconButton } from '@remi-core/shadcn-ui';

defineOptions({
  name: 'LanguageToggle',
});

async function handleUpdate(value: string | undefined) {
  if (!value) return;
  const locale = value as SupportedLanguagesType;
  updatePreferences({
    app: {
      locale,
    },
  });
  await loadLocaleMessages(locale);
}
</script>

<template>
  <div>
    <REMIDropdownRadioMenu
      :menus="SUPPORT_LANGUAGES"
      :model-value="preferences.app.locale"
      @update:model-value="handleUpdate"
    >
      <REMIIconButton>
        <Languages class="text-foreground size-4" />
      </REMIIconButton>
    </REMIDropdownRadioMenu>
  </div>
</template>
