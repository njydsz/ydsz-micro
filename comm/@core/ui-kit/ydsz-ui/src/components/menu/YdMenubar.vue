<script setup lang="ts">
/**
 * YdMenubar —— 顶部水平菜单栏（Menubar）。
 *
 * 对齐 Ant Design Menu mode="horizontal" / PrimeVue Menubar / Naive Menu mode="horizontal"。
 * 特性：
 *  - 顶部一级菜单点击展开下拉面板；
 *  - 支持多级子菜单（Sub）；
 *  - 键盘导航（方向键 + Enter + Esc）；
 *  - ARIA menubar 语义（role="menubar" / menuitem / 方向键）；
 *  - 配置式 items（与 YdMenu 同构）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\menu\YdMenubar.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { MenuItemOption } from './YdMenu.vue';

import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@ydsz-core/ydsz-vue';
import { YdDropdownMenu as DropdownMenu, YdDropdownMenuTrigger } from '../dropdown-menu';

interface Props {
  /** 菜单项列表 */
  items: MenuItemOption[];
  /** 当前选中项 */
  modelValue?: string;
  /** 自定义类名 */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [key: string];
}>();

/** 当前展开的菜单 key */
const openKey = ref<string | null>(null);

/** 当前选中项 */
const activeKey = computed(() => props.modelValue);

/** 切换菜单展开态 */
function toggle(key: string): void {
  openKey.value = openKey.value === key ? null : key;
}

/** 关闭所有菜单 */
function closeAll(): void {
  openKey.value = null;
}

/** 处理下拉菜单展开态变化 */
function handleOpenChange(key: string, open: boolean): void {
  if (open) {
    openKey.value = key;
  } else {
    closeAll();
  }
}

/** 选中菜单项 */
function handleSelect(item: MenuItemOption): void {
  if (item.disabled || item.type === 'divider' || item.type === 'group') return;
  emit('update:modelValue', item.key);
  emit('select', item.key);
  item.onClick?.();
  closeAll();
}

/** 键盘导航 */
function handleKeydown(event: KeyboardEvent): void {
  if (!openKey.value) return;
  const current = props.items.find((item) => item.key === openKey.value);
  if (!current) return;

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      closeAll();
      break;
    case 'ArrowRight':
    case 'ArrowDown': {
      event.preventDefault();
      const idx = props.items.findIndex((item) => item.key === openKey.value);
      const next = props.items[(idx + 1) % props.items.length];
      if (next) openKey.value = next.key;
      break;
    }
    case 'ArrowLeft':
    case 'ArrowUp': {
      event.preventDefault();
      const idx = props.items.findIndex((item) => item.key === openKey.value);
      const prev = props.items[(idx - 1 + props.items.length) % props.items.length];
      if (prev) openKey.value = prev.key;
      break;
    }
  }
}
</script>

<template>
  <div role="menubar" :class="cn('flex items-center gap-1', props.class)" @keydown="handleKeydown">
    <template v-for="item in items" :key="item.key">
      <!-- 分组标题 -->
      <div
        v-if="item.type === 'group'"
        class="text-muted-foreground px-2 py-1.5 text-xs font-semibold"
      >
        {{ item.label }}
      </div>

      <!-- 子菜单（有 children） -->
      <DropdownMenu
        v-else-if="item.children?.length"
        :open="openKey === item.key"
        @update:open="handleOpenChange(item.key, $event)"
      >
        <YdDropdownMenuTrigger
          :class="
            cn(
              'inline-flex cursor-pointer items-center rounded-md px-3 py-2 text-sm outline-none transition-colors',
              'hover:bg-accent',
              openKey === item.key && 'bg-accent',
              activeKey === item.key && 'text-primary font-medium',
            )
          "
          @click="toggle(item.key)"
        >
          {{ item.label }}
        </YdDropdownMenuTrigger>
        <DropdownMenuContent align="start" class="min-w-[180px]">
          <template v-for="sub in item.children ?? []" :key="sub.key">
            <DropdownMenuSeparator v-if="sub.type === 'divider'" />
            <div
              v-else-if="sub.type === 'group'"
              class="text-muted-foreground px-2 py-1.5 text-xs font-semibold"
            >
              {{ sub.label }}
            </div>
            <DropdownMenuSub v-else-if="sub.type === 'sub' && sub.children?.length">
              <DropdownMenuSubTrigger :disabled="sub.disabled">
                {{ sub.label }}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  v-for="nested in sub.children"
                  :key="nested.key"
                  :disabled="nested.disabled"
                  @click="handleSelect(nested)"
                >
                  {{ nested.label }}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              v-else
              :disabled="sub.disabled"
              :class="activeKey === sub.key ? 'bg-accent' : ''"
              @click="handleSelect(sub)"
            >
              {{ sub.label }}
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- 普通菜单项（无子菜单） -->
      <button
        v-else-if="item.type !== 'divider'"
        type="button"
        :class="
          cn(
            'inline-flex cursor-pointer items-center rounded-md px-3 py-2 text-sm outline-none transition-colors',
            'hover:bg-accent',
            activeKey === item.key && 'text-primary font-medium',
            item.disabled && 'cursor-not-allowed opacity-50',
          )
        "
        :disabled="item.disabled"
        @click="handleSelect(item)"
      >
        {{ item.label }}
      </button>

      <!-- 分隔线 -->
      <div v-else class="bg-border mx-1 h-5 w-px" aria-hidden="true" />
    </template>
  </div>
</template>
