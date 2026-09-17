<!--
 * AutoComplete 自动完成：输入框 + 联想下拉。
 *
 * 与 YdSelect 不同，AutoComplete 允许用户输入任意值（不限于 options）。
 * 搜索由外部 handleSearch 控制（可能为远程请求）；
 * options 回写由父组件管理；选中后 inputValue 更新为对应 label。
 *
 * 组件不持有内部搜索逻辑 —— 所有计算在父侧，保持轻量。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\auto-complete\YdAutoComplete.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdInput } from '../input';
import { YdPopover, YdPopoverContent, YdPopoverTrigger } from '../popover';

/** 选项条目 */
export interface AutoCompleteOption {
  /** 选项值 */
  value: string;
  /** 显示标签 */
  label: string;
}

interface Props<T extends AutoCompleteOption = AutoCompleteOption> {
  /** 自定义类名 */
  class?: any;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 选项列表 */
  options?: T[];
  /** 当前输入值（受控） */
  value?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  options: () => [],
  placeholder: '请输入',
  value: '',
});

const emit = defineEmits<{
  'update:value': [value: string];
  search: [query: string];
  select: [option: AutoCompleteOption];
}>();

/** 是否展示下拉 */
const open = ref(false);

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('update:value', target.value);
  emit('search', target.value);
  open.value = true;
}

function handleSelect(option: AutoCompleteOption): void {
  emit('update:value', option.value);
  emit('select', option);
  open.value = false;
}

function handleBlur(): void {
  // 延迟关闭，避免点击选项前下拉已关闭
  setTimeout(() => {
    open.value = false;
  }, 150);
}
</script>

<template>
  <YdPopover v-model:open="open">
    <YdPopoverTrigger as-child>
      <YdInput
        :disabled="props.disabled"
        :placeholder="props.placeholder"
        :value="props.value"
        autocomplete="off"
        class="w-full"
        @blur="handleBlur"
        @focus="open = true"
        @input="handleInput"
      />
    </YdPopoverTrigger>
    <YdPopoverContent
      :class="cn('max-h-60 w-[var(--radix-popover-trigger-width)] overflow-y-auto p-1', props.class)"
      align="start"
      side="bottom"
      @open-auto-focus="(e: Event) => e.preventDefault()"
    >
      <button
        v-for="option in options"
        :key="option.value"
        :class="
          cn(
            'hover:bg-muted flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm',
          )
        "
        type="button"
        @mousedown.prevent="handleSelect(option)"
      >
        {{ option.label }}
      </button>
      <p
        v-if="options.length === 0"
        class="text-muted-foreground px-2 py-3 text-center text-sm"
      >
        暂无匹配项
      </p>
    </YdPopoverContent>
  </YdPopover>
</template>
