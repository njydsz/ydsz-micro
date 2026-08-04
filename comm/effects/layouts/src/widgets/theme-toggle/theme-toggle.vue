<!--
 * theme-toggle 布局组件
 *
 * @path comm\effects\layouts\src\widgets\theme-toggle\theme-toggle.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { ThemeModeType } from '@remi/types';

import { MoonStar, Sun, SunMoon } from '@remi/icons';
import { $t } from '@remi/locales';
import {
  preferences,
  updatePreferences,
  usePreferences,
} from '@remi/preferences';

import {
  REMITooltip,
  ToggleGroup,
  ToggleGroupItem,
} from '@remi-core/shadcn-ui';

import ThemeButton from './theme-button.vue';

defineOptions({
  name: 'ThemeToggle',
});

withDefaults(defineProps<{ shouldOnHover?: boolean }>(), {
  shouldOnHover: false,
});

function handleChange(isDark: boolean | undefined) {
  updatePreferences({
    theme: { mode: isDark ? 'dark' : 'light' },
  });
}

const { isDark } = usePreferences();

const PRESETS = [
  {
    icon: Sun,
    name: 'light',
    title: $t('preferences.theme.light'),
  },
  {
    icon: MoonStar,
    name: 'dark',
    title: $t('preferences.theme.dark'),
  },
  {
    icon: SunMoon,
    name: 'auto',
    title: $t('preferences.followSystem'),
  },
];
</script>
<template>
  <div>
    <REMITooltip :disabled="!shouldOnHover" side="bottom">
      <template #trigger>
        <ThemeButton
          :model-value="isDark"
          type="icon"
          @update:model-value="handleChange"
        />
      </template>
      <ToggleGroup
        :model-value="preferences.theme.mode"
        class="gap-2"
        type="single"
        variant="outline"
        @update:model-value="
          (val) => updatePreferences({ theme: { mode: val as ThemeModeType } })
        "
      >
        <ToggleGroupItem
          v-for="item in PRESETS"
          :key="item.name"
          :value="item.name"
        >
          <component :is="item.icon" class="size-5" />
        </ToggleGroupItem>
      </ToggleGroup>
    </REMITooltip>
  </div>
</template>
