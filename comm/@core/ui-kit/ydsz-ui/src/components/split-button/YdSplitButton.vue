<script setup lang="ts">
/**
* SplitButton（分裂按钮）：主按钮 + 下拉箭头并排组合。
 *
 * 左侧主区域触发列表第一个 action；右侧小箭头展开 dropdown menu 供选择其他 action。
 * 点击任一 action 后自动收起 dropdown。disabled 状态下整体不可交互。
 *
 * WAI-ARIA：role="group" + aria-label；下拉区 aria-haspopup="menu"。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/components/split-button/YdSplitButton.vue
 * @author ydsz-team
 * @since 26.10.12
 */
import { computed, ref } from 'vue';

import { useLocale } from '../../locale/useLocale';

import type { SplitButtonEmits, SplitButtonAction, YdSplitButtonProps } from './types';

defineOptions({ name: 'YdSplitButton' });

const props = withDefaults(defineProps<YdSplitButtonProps>(), {
  label: '',
  icon: undefined,
  disabled: false,
  size: 'md',
  variant: 'primary',
  dropdownIcon: 'mdi:chevron-down',
});

const emit = defineEmits<SplitButtonEmits>();

const { t } = useLocale();

/** dropdown 是否打开 */
const isDropdownOpen = ref(false);

/** 默认动作（列表第一个非 disabled 项） */
const defaultAction = computed<SplitButtonAction | undefined>(() => {
  return props.actions.find((a) => !a.disabled) ?? props.actions[0];
});

/** 尺寸 → class 映射 */
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'lg':
      return 'h-10 px-4 text-base';
    case 'sm':
      return 'h-7 px-2 text-xs';
    default:
      return 'h-8 px-3 text-sm';
  }
});

/** 变体 → class 映射 */
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-400';
    case 'ghost':
      return 'bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800';
    case 'secondary':
      return 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800 focus-visible:ring-neutral-400 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600';
    default:
      return 'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-400';
  }
});

/** 选中任一 action 时触发 */
function handleActionClick(action: SplitButtonAction): void {
  if (action.disabled || props.disabled) return;
  isDropdownOpen.value = false;
  action.command?.();
  emit('action', action);
}

/** 主按钮点击：触发默认 action */
function handleMainClick(): void {
  if (props.disabled || !defaultAction.value) return;
  const action = defaultAction.value;
  if (action.disabled) return;
  action.command?.();
  emit('action', action);
}
</script>

<template>
  <div
    class="yd-split-button inline-flex"
    role="group"
    :aria-label="t('splitButton.toggleDropdown')"
  >
    <!-- 主按钮区域 -->
    <button
      type="button"
      :disabled="disabled"
      :class="[
        'yd-split-button__main flex items-center gap-1.5 font-medium transition-colors',
        'rounded-l-md border border-r-0',
        sizeClasses,
        variantClasses,
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ]"
      @click="handleMainClick"
    >
      <span
        v-if="icon"
        :class="['yd-split-button__main-icon inline-flex size-4 shrink-0', icon]"
        aria-hidden="true"
      />
      <span class="yd-split-button__main-label whitespace-nowrap">
        {{ label || (defaultAction?.label ?? '') }}
      </span>
    </button>

    <!-- 下拉触发器 -->
    <button
      type="button"
      :disabled="disabled"
      :aria-haspopup="'menu'"
      :aria-expanded="isDropdownOpen"
      :aria-label="t('splitButton.toggleDropdown')"
      :class="[
        'yd-split-button__dropdown-trigger flex items-center border',
        'rounded-r-md transition-colors',
        sizeClasses,
        variantClasses,
        disabled ? 'cursor-not-allowed opacity-50' : '',
      ]"
      @click="isDropdownOpen = !isDropdownOpen"
    >
      <span
        :class="['yd-split-button__dropdown-icon inline-flex size-4 shrink-0', dropdownIcon]"
        aria-hidden="true"
      />
    </button>

    <!-- 下拉菜单 -->
    <div
      v-if="isDropdownOpen && !disabled"
      class="yd-split-button__menu absolute z-20 mt-10 min-w-[140px] rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      role="menu"
      @keydown.escape="isDropdownOpen = false"
    >
      <button
        v-for="action in actions"
        :key="action.key ?? action.label"
        type="button"
        :disabled="action.disabled"
        role="menuitem"
        :aria-disabled="action.disabled"
        :class="[
          'yd-split-button__menu-item flex w-full items-center gap-2 px-3 py-1.5 text-sm',
          action.disabled
            ? 'cursor-not-allowed text-neutral-400'
            : 'cursor-pointer text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800',
        ]"
        @click="handleActionClick(action)"
      >
        <span
          v-if="action.icon"
          :class="['yd-split-button__menu-item-icon inline-flex size-4 shrink-0', action.icon]"
          aria-hidden="true"
        />
        <span class="yd-split-button__menu-item-label flex-1 text-left">
          {{ action.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.yd-split-button {
  position: relative;
  isolation: isolate;
}
</style>
