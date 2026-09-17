<script lang="ts" setup">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  class?: any;
  disabled?: boolean;
  /** 触发字符（默认 @） */
  prefix?: string | string[];
  /** 搜索回调 */
  search?: (term: string) => void;
  /** 选项列表 */
  options: Array<{ label: string; value: string }>;
  /** 选中值 */
  modelValue?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  modelValue: '',
  options: () => [],
  placeholder: '输入 @ 触发提及',
  prefix: '@',
  search: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [val: string];
  select: [option: { label: string; value: string }];
}>();

const inputRef = ref<HTMLTextAreaElement>();
const dropdownVisible = ref(false);
const searchTerm = ref('');
const caretOffset = ref(0);

const prefixes = computed(() =>
  Array.isArray(props.prefix) ? props.prefix : [props.prefix],
);

const filteredOptions = computed(() => {
  if (!searchTerm.value) return props.options.slice(0, 8);
  return props.options
    .filter(
      (o) =>
        o.label.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        o.value.toLowerCase().includes(searchTerm.value.toLowerCase()),
    )
    .slice(0, 8);
});

function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);

  const pos = target.selectionStart ?? 0;
  const textBefore = target.value.slice(0, pos);

  // 检测前缀触发
  for (const p of prefixes.value) {
    const idx = textBefore.lastIndexOf(p);
    if (idx !== -1 && idx === textBefore.length - p.length) {
      dropdownVisible.value = true;
      searchTerm.value = '';
      caretOffset.value = pos;
      props.search?.('');
      return;
    }
    if (idx !== -1 && idx === textBefore.length - p.length - searchTerm.value.length - 1) {
      // 正在搜索中
      const term = textBefore.slice(idx + p.length);
      if (!term.includes(' ')) {
        dropdownVisible.value = true;
        searchTerm.value = term;
        props.search?.(term);
        return;
      }
    }
  }

  dropdownVisible.value = false;
  searchTerm.value = '';
}

function selectOption(option: { label: string; value: string }): void {
  if (!inputRef.value) return;
  const text = props.modelValue ?? '';
  const pos = inputRef.value.selectionStart ?? text.length;

  for (const p of prefixes.value) {
    const idx = text.slice(0, pos).lastIndexOf(p);
    if (idx !== -1) {
      const before = text.slice(0, idx);
      const after = text.slice(pos);
      const insert = `${p}${option.label} `;
      const newValue = before + insert + after;
      emit('update:modelValue', newValue);
      dropdownVisible.value = false;
      emit('select', option);
      // 移动光标
      requestAnimationFrame(() => {
        inputRef.value?.focus();
        inputRef.value?.setSelectionRange(before.length + insert.length, before.length + insert.length);
      });
      return;
    }
  }
}
</script>

<template>
  <div :class="cn('relative inline-block w-full', props.class)">
    <textarea
      ref="inputRef"
      :value="props.modelValue"
      :aria-label="'提及输入框'"
      :class="cn(
        'flex min-h-[60px] w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      )"
      :disabled="props.disabled"
      :placeholder="props.placeholder"
      @input="handleInput"
      @keydown.escape="dropdownVisible = false"
    ></textarea>

    <!-- 下拉候选 -->
    <div
      v-if="dropdownVisible && filteredOptions.length > 0"
      class="bg-background absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border shadow-xl"
      role="listbox"
      aria-label="提及候选"
    >
      <button
        v-for="opt in filteredOptions"
        :key="opt.value"
        :aria-selected="false"
        :class="cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted')"
        role="option"
        type="button"
        @click="selectOption(opt)"
      >
        <span class="font-medium">{{ opt.label }}</span>
        <span class="text-muted-foreground text-xs">{{ opt.value }}</span>
      </button>
      <div v-if="filteredOptions.length === 0" class="text-muted-foreground px-3 py-2 text-center text-sm">无匹配结果</div>
    </div>
  </div>
</template>
