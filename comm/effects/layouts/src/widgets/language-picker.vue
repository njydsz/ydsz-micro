<!--
 * language-picker — 中英双语切换器
 *
 * @path comm\effects\layouts\src\widgets\language-picker.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup name="LanguagePicker">
import { SUPPORT_LANGUAGES } from '@ydsz/constants';
import { loadLocaleMessages } from '@ydsz/locales';
import { preferences, updatePreferences } from '@ydsz/preferences';

import {
  YdDropdownMenuContent,
  YdDropdownMenuItem,
  YdDropdownMenuSmart,
  YdDropdownMenuTrigger,
  YdIconButton,
} from '@ydsz-core/ydsz-ui';

import { Languages } from '@ydsz/icons';

function isSelected(code: string): boolean {
  return preferences.app.locale === code;
}

async function handleSelect(code: string): Promise<void> {
  updatePreferences({ app: { locale: code } });
  await loadLocaleMessages(code as any);
}
</script>

<template>
  <YdDropdownMenuSmart>
    <YdDropdownMenuTrigger as-child class="flex items-center gap-1">
      <YdIconButton>
        <Languages class="size-4 text-foreground" />
      </YdIconButton>
    </YdDropdownMenuTrigger>
    <YdDropdownMenuContent align="start" class="w-40">
      <YdDropdownMenuItem
        v-for="item in SUPPORT_LANGUAGES"
        :key="item.value"
        :class="isSelected(item.value) ? 'bg-accent text-accent-foreground' : ''"
        class="text-foreground/80 cursor-pointer items-center justify-between px-2 py-1.5 text-sm hover:bg-accent/50"
        @click="handleSelect(item.value)"
      >
        {{ item.label }}
      </YdDropdownMenuItem>
    </YdDropdownMenuContent>
  </YdDropdownMenuSmart>
</template>
