<!--
 * language-picker — 增强语言选择器（81 语种，搜索 + 大洲分组 + 选中高亮）
 *
 * <p>面向 81 个语种的规模做了优化：顶部搜索框实时过滤、按大洲分组展示、
 * 当前语言高亮 + 勾选标记。列表区域限制最大高度，超出时内部滚动。
 *
 * @path comm\effects\layouts\src\widgets\language-picker.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup name="LanguagePicker">
import type { SupportedLanguagesType } from '@ydsz/locales';

import { computed, ref } from 'vue';

import { SUPPORT_LANGUAGES } from '@ydsz/constants';
import { loadLocaleMessages } from '@ydsz/locales';
import { preferences, updatePreferences } from '@ydsz/preferences';

import {
  YdDropdownMenuContent,
  YdDropdownMenuGroup,
  YdDropdownMenuItem,
  YdDropdownMenuSmart,
  YdDropdownMenuTrigger,
  YdIconButton,
} from '@ydsz-core/ydsz-ui';

import { Check, Languages, Search } from '@ydsz/icons';

/** 大洲分组配置 — SUPPORT_LANGUAGES 顺序与此一致 */
const GROUPS: ReadonlyArray<{ label: string; codes: readonly SupportedLanguagesType[] }> = [
  {
    label: '东亚 / 东南亚',
    codes: [
      'zh-CN',
      'zh-TW',
      'zh-HK',
      'ja-JP',
      'ko-KR',
      'vi-VN',
      'th-TH',
      'id-ID',
      'ms-MY',
      'fil-PH',
      'km-KH',
      'lo-LA',
      'my-MM',
      'mn-MN',
    ],
  },
  {
    label: '南亚',
    codes: [
      'hi-IN',
      'bn-BD',
      'ur-PK',
      'mr-IN',
      'ta-IN',
      'te-IN',
      'kn-IN',
      'ml-IN',
      'gu-IN',
      'si-LK',
      'ne-NP',
    ],
  },
  {
    label: '欧洲（西 / 北）',
    codes: [
      'en-US',
      'en-GB',
      'fr-FR',
      'fr-CA',
      'de-DE',
      'de-AT',
      'de-CH',
      'nl-NL',
      'nl-BE',
      'sv-SE',
      'nb-NO',
      'da-DK',
      'fi-FI',
      'is-IS',
      'cy-GB',
      'gl-ES',
      'ca-ES',
      'eu-ES',
    ],
  },
  {
    label: '欧洲（南 / 东）',
    codes: [
      'es-ES',
      'es-MX',
      'es-AR',
      'pt-PT',
      'pt-BR',
      'it-IT',
      'el-GR',
      'ru-RU',
      'uk-UA',
      'pl-PL',
      'cs-CZ',
      'sk-SK',
      'sl-SI',
      'hr-HR',
      'sr-RS',
      'bs-BA',
      'sq-AL',
      'ro-RO',
      'hu-HU',
      'bg-BG',
      'lt-LT',
      'lv-LV',
      'et-EE',
      'mk-MK',
    ],
  },
  {
    label: '中东 / 中亚 / 高加索',
    codes: [
      'ar-SA',
      'ar-EG',
      'he-IL',
      'fa-IR',
      'tr-TR',
      'az-AZ',
      'kk-KZ',
      'uz-UZ',
      'ka-GE',
      'hy-AM',
    ],
  },
  {
    label: '非洲',
    codes: ['sw-KE', 'am-ET', 'af-ZA', 'zu-ZA'],
  },
];

/** 搜索关键词 */
const searchKeyword = ref('');

/** code → label 映射（一次性构建，避免重复计算） */
const labelMap = computed(() => {
  const map = new Map<SupportedLanguagesType, string>();
  for (const item of SUPPORT_LANGUAGES) {
    map.set(item.value, item.label);
  }
  return map;
});

/**
 * 按分组过滤语种列表。
 *
 * <p>搜索框有内容时跨分组全局搜索；否则按原分组显示全部。
 */
const filteredGroups = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return GROUPS.map((group) => ({
      items: group.codes.map((code) => ({
        code,
        label: labelMap.value.get(code) ?? code,
      })),
      label: group.label,
    }));
  }

  return [
    {
      items: SUPPORT_LANGUAGES.filter(
        (item) =>
          item.label.toLowerCase().includes(keyword) ||
          item.value.toLowerCase().includes(keyword),
      ).map((item) => ({ code: item.value, label: item.label })),
      label: '搜索结果',
    },
  ];
});

/**
 * 检查是否为当前选中语种。
 */
function isSelected(code: SupportedLanguagesType): boolean {
  return preferences.app.locale === code;
}

/**
 * 切换语种。
 */
async function handleSelect(code: SupportedLanguagesType): Promise<void> {
  updatePreferences({ app: { locale: code } });
  await loadLocaleMessages(code);
  searchKeyword.value = '';
}
</script>

<template>
  <YdDropdownMenuSmart>
    <YdDropdownMenuTrigger as-child class="flex items-center gap-1">
      <YdIconButton>
        <Languages class="size-4 text-foreground" />
      </YdIconButton>
    </YdDropdownMenuTrigger>
    <YdDropdownMenuContent align="start" class="w-72">
      <!-- 搜索框 -->
      <div class="flex items-center gap-1.5 px-2 pb-1 pt-1.5">
        <Search class="size-4 text-muted-foreground" />
        <input
          v-model="searchKeyword"
          class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="搜索语言..."
          type="text"
        />
      </div>
      <div class="bg-border mx-2 h-px"></div>
      <!-- 可滚动列表 -->
      <div class="max-h-96 overflow-y-auto p-1">
        <template v-for="group in filteredGroups" :key="group.label">
          <YdDropdownMenuGroup>
            <div class="text-muted-foreground px-2 pb-1 pt-2 text-xs font-medium">
              {{ group.label }}
            </div>
            <template v-for="item in group.items" :key="item.code">
              <YdDropdownMenuItem
                :class="isSelected(item.code) ? 'bg-accent text-accent-foreground' : ''"
                class="text-foreground/80 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground mb-0.5 flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent/50"
                @click="handleSelect(item.code)"
              >
                <span>{{ item.label }}</span>
                <Check v-if="isSelected(item.code)" class="ml-2 size-4" />
              </YdDropdownMenuItem>
            </template>
          </YdDropdownMenuGroup>
        </template>
      </div>
    </YdDropdownMenuContent>
  </YdDropdownMenuSmart>
</template>
