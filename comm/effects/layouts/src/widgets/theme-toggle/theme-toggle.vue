<!--
 * theme-toggle 布局组件
 *
 * @path comm\effects\layouts\src\widgets\theme-toggle\theme-toggle.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { ThemeModeType } from '@ydsz/types';

import { MoonStar, Sun, SunMoon } from '@ydsz/icons';
import { $t } from '@ydsz/locales';
import {
  preferences,
  updatePreferences,
  usePreferences,
} from '@ydsz/preferences';

import {
  YdTooltip,
  YdToggleGroup,
  YdToggleGroupItem,
} from '@ydsz-core/shadcn-ui';

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
    <YdTooltip :disabled="!shouldOnHover" side="bottom">
      <template #trigger>
        <ThemeButton
          :model-value="isDark"
          type="icon"
          @update:model-value="handleChange"
        />
      </template>
      <YdToggleGroup
        :model-value="preferences.theme.mode"
        class="gap-2"
        type="single"
        variant="outline"
        @update:model-value="
          (val) => updatePreferences({ theme: { mode: val as ThemeModeType } })
        "
      >
        <YdToggleGroupItem
          v-for="item in PRESETS"
          :key="item.name"
          :value="item.name"
        >
          <component :is="item.icon" class="size-5" />
        </YdToggleGroupItem>
      </YdToggleGroup>
    </YdTooltip>
  </div>
</template>
