<!--
 * language-picker — 增强语言选择器（支持搜索 + 分组 + 选中高亮）
 *
 * <p>替代 language-toggle 的旧下拉菜单，面向 22 个语种的规模做了优化：
 * 顶部搜索框实时过滤、按语种分组展示、当前语言高亮 + 勾选标记。
 *
 * @path comm\effects\layouts\src\widgets\language-picker.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup name="LanguagePicker">
import type { SupportedLanguagesType } from '@ydsz/locales';

import { computed, ref } from 'vue';

import { SUPPORT_LANGUAGES } from '@ydsz/constants';
import { Check, Languages, Search } from '@ydsz/icons';
import { loadLocaleMessages } from '@ydsz/locales';
import { preferences, updatePreferences } from '@ydsz/preferences';

import { YdDropdownMenuSmart, YdDropdownMenuContent, YdDropdownMenuGroup, YdDropdownMenuItem, YdDropdownMenuTrigger, YdIconButton } from '@ydsz-core/ydsz-ui';

/**
 * 语种分组配置 — 将 22 个语种按区域分组，便于用户快速定位。
 */
const LOCALE_GROUPS = [
  {
    label: '常用',
    codes: ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'],
  },
  {
    label: '欧洲',
    codes: ['de-DE', 'fr-FR', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT', 'pt-BR', 'ru-RU', 'sv-SE', 'tr-TR', 'uk-UA', 'cs-CZ'],
  },
  {
    label: '亚太 & 其他',
    codes: ['ar-SA', 'hi-IN', 'id-ID', 'th-TH', 'vi-VN'],
  },
];

/** 搜索关键词（双向绑定） */
const searchKeyword = ref('');

/** 构建 code → label 映射表 */
const labelMap = computed(() => {
  const map = new Map<SupportedLanguagesType, string>();
  for (const item of SUPPORT_LANGUAGES) {
    map.set(item.value as SupportedLanguagesType, item.label);
  }
  return map;
});

/**
 * 按分组过滤语种列表。
 *
 * <p>当搜索框有内容时，跨分组全局过滤；否则按原分组展示全部。
 */
const filteredGroups = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return LOCALE_GROUPS.map((group) => ({
      ...group,
      items: group.codes
        .map((code) => ({
          value: code as SupportedLanguagesType,
          label: labelMap.value.get(code as SupportedLanguagesType) ?? code,
        }))
        .filter(Boolean),
    }));
  }

  // 过滤模式：全局搜索
  return [
    {
      label: '搜索结果',
      items: SUPPORT_LANGUAGES.filter(
        (item) =>
          item.label.toLowerCase().includes(keyword) || item.value.toLowerCase().includes(keyword),
      ).map((item) => ({
        value: item.value as SupportedLanguagesType,
        label: item.label,
      })),
    },
  ];
});

/**
 * 检查是否为当前选中语种。
 *
 * @param code - 语种标识
 */
function isSelected(code: SupportedLanguagesType): boolean {
  return preferences.app.locale === code;
}

/**
 * 切换语种。
 *
 * @param value - 目标语种标识
 */
async function handleSelect(value: string) {
  if (!value) return;
  const locale = value as SupportedLanguagesType;
  updatePreferences({
    app: {
      locale,
    },
  });
  await loadLocaleMessages(locale);
  searchKeyword.value = '';
}
</script>

<template>
  <div>
    <YdDropdownMenuSmart>
      <YdDropdownMenuTrigger as-child class="flex items-center gap-1">
        <YdIconButton>
          <Languages class="text-foreground size-4" />
        </YdIconButton>
      </YdDropdownMenuTrigger>
      <YdDropdownMenuContent align="start" class="w-64">
        <!-- 搜索框 -->
        <div class="flex items-center gap-1 px-2 pb-1 pt-1.5">
          <Search class="text-muted-foreground size-4" />
          <input
            v-model="searchKeyword"
            class="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
            placeholder="搜索语言..."
            type="text"
          />
        </div>
        <div class="bg-border mx-2 h-px"></div>
        <!-- 可滚动列表 -->
        <div class="max-h-80 overflow-y-auto">
          <template v-for="group in filteredGroups" :key="group.label">
            <YdDropdownMenuGroup>
              <!-- 分组标题 -->
              <div class="text-muted-foreground px-2 pb-1 pt-2 text-xs font-medium">
                {{ group.label }}
              </div>
              <!-- 语种条目 -->
              <template v-for="item in group.items" :key="item.value">
                <YdDropdownMenuItem
                  :class="isSelected(item.value) ? 'bg-accent text-accent-foreground' : ''"
                  class="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground text-foreground/80 mb-0.5 flex cursor-pointer items-center justify-between"
                  @click="handleSelect(item.value)"
                >
                  <span>{{ item.label }}</span>
                  <Check v-if="isSelected(item.value)" class="ml-2 size-4" />
                </YdDropdownMenuItem>
              </template>
            </YdDropdownMenuGroup>
          </template>
        </div>
      </YdDropdownMenuContent>
    </YdDropdownMenuSmart>
  </div>
</template>
