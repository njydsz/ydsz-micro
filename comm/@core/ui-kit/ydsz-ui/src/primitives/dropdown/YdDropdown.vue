<script lang="ts" setup">
import { cn } from '@ydsz-core/shared/utils';

export type DropdownMenuKey = string | number;

export interface DropdownMenuItem {
  /** 是否危险操作 */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 唯一 key */
  key: DropdownMenuKey;
  /** 显示标签 */
  label: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 分割线 */
  divider?: boolean;
  /** 前置图标 */
  icon?: any;
}

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 菜单项列表 */
  items?: DropdownMenuItem[];
  /** 对齐位置 */
  placement?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
  /** 是否显示 */
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  open: undefined,
  placement: 'bottom-start',
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  select: [key: DropdownMenuKey];
}>();

function handleItemClick(item: DropdownMenuItem): void {
  if (item.disabled) return;
  item.onClick?.();
  emit('select', item.key);
  emit('update:open', false);
}
</script>

<template>
  <div :class="cn('relative inline-block', props.class)">
    <!-- 触发器 -->
    <slot name="trigger">
      <button
        type="button"
        class="hover:bg-muted rounded px-3 py-1.5 text-sm transition-colors"
        @click="emit('update:open', !props.open)"
      >
        操作 ▾
      </button>
    </slot>

    <!-- 菜单面板 -->
    <div
      v-if="props.open"
      :class="
        cn(
          'bg-background absolute z-50 mt-1 min-w-[180px] rounded-lg border py-1 shadow-xl',
          props.placement.includes('end') ? 'right-0' : 'left-0',
          props.placement.includes('top') ? 'bottom-full mb-1' : '',
        )
      "
      role="menu"
      @click.stop
    >
      <template v-for="(item, i) in props.items" :key="item.key">
        <div v-if="item.divider" class="my-1 h-px bg-border" :key="`div-${i}`"></div>
        <button
          v-else
          :aria-disabled="item.disabled"
          :class="
            cn(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
              item.disabled && 'cursor-not-allowed text-muted-foreground opacity-40',
              item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30' : 'hover:bg-muted',
            )
          "
          role="menuitem"
          type="button"
          @click="handleItemClick(item)"
        >
          <component :is="item.icon" v-if="item.icon" class="size-4" />
          {{ item.label }}
        </button>
      </template>
    </div>
  </div>
</template>
