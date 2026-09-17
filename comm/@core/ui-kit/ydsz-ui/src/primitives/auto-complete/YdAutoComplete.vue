<!--
 * AutoComplete 自动完成：输入框 + 联想下拉。
 *
 * 与 YdSelect 不同，AutoComplete 允许用户输入任意值（不限于 options）。
 * 搜索可由外部 @search 事件处理（远程模式），也可由内置的防抖 + loading 态半自治处理。
 *
 * P0-5 增强：
 *  - `async` prop 启用「远程异步搜索 + 防抖 + loading 态」；
 *  - `debounceMs` 配置防抖延迟；
 *  - `searchFn` 异步搜索回调；
 *  - 内置清空按钮。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\auto-complete\YdAutoComplete.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { Loader2, X } from 'lucide-vue-next';

import { useComponentI18n } from '../../composables/use-component-i18n';

import { YdInput } from '../input';
import { YdPopover, YdPopoverContent, YdPopoverTrigger } from '../popover';

/** AutoComplete 组件 i18n 消息定义 */
const autoCompleteMessages = {
  zh: {
    autoComplete: {
      clearAriaLabel: '清空',
      emptyText: '暂无匹配项',
      loadingText: '搜索中...',
      placeholder: '请输入',
    },
  },
  en: {
    autoComplete: {
      clearAriaLabel: 'Clear',
      emptyText: 'No matching items',
      loadingText: 'Searching...',
      placeholder: 'Please input',
    },
  },
};

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
  isDisabled?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 选项列表 */
  options?: T[];
  /** 当前输入值（受控） */
  value?: string;
  /** 开启远程异步搜索模式 */
  isAsync?: boolean;
  /** 异步搜索回调（返回 Promise<选项[]>） */
  searchFn?: (query: string) => Promise<T[]>;
  /** 防抖延迟（ms），默认 300 */
  debounceMs?: number;
  /** 是否显示清空按钮 */
  clearable?: boolean;
  /** 空数据文本 */
  emptyText?: string;
  /** 当前语言，默认 'zh' */
  locale?: string;
}

const props = withDefaults(defineProps<Props>(), {
  clearable: true,
  debounceMs: 300,
  isAsync: false,
  isDisabled: false,
  locale: 'zh',
  options: () => [],
  value: '',
});

const { t } = useComponentI18n({
  defaultLocale: props.locale,
  messages: autoCompleteMessages,
});

const resolvedEmptyText = props.emptyText ?? t('autoComplete.emptyText');
const resolvedPlaceholder = props.placeholder ?? t('autoComplete.placeholder');

const emit = defineEmits<{
  'update:value': [value: string];
  search: [query: string];
  select: [option: AutoCompleteOption];
}>();

/** 是否展示下拉 */
const open = ref(false);

/** 异步搜索进行中 */
const isLoading = ref(false);

/** 内部 options（异步模式下由 searchFn 填充） */
const resolvedOptions = ref<AutoCompleteOption[]>([]);

/** 防抖计时器 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 清理防抖计时器。
 */
function clearDebounce(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

/**
 * 执行异步搜索（带防抖）。
 */
function handleAsyncSearch(query: string): void {
  if (!props.searchFn) {
    emit('search', query);
    return;
  }

  clearDebounce();
  debounceTimer = setTimeout(async () => {
    if (!query.trim()) {
      resolvedOptions.value = [];
      isLoading.value = false;
      return;
    }
    isLoading.value = true;
    try {
      const results = await props.searchFn!(query);
      resolvedOptions.value = results;
    } catch {
      resolvedOptions.value = [];
    } finally {
      isLoading.value = false;
    }
  }, props.debounceMs);
}

/**
 * 处理输入。
 */
function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  const query = target.value;
  emit('update:value', query);
  open.value = true;

  if (props.isAsync && props.searchFn) {
    handleAsyncSearch(query);
  } else {
    emit('search', query);
  }
}

/**
 * 处理选中选项。
 */
function handleSelect(option: AutoCompleteOption): void {
  emit('update:value', option.value);
  emit('select', option);
  open.value = false;
}

/**
 * 失去焦点——延迟关闭。
 */
function handleBlur(): void {
  setTimeout(() => {
    open.value = false;
  }, 150);
}

/**
 * 清空输入。
 */
function handleClear(): void {
  emit('update:value', '');
  resolvedOptions.value = [];
}

/** 同步模式下直接使用 props.options */
watch(
  () => props.options,
  (val) => {
    if (!props.isAsync) {
      resolvedOptions.value = val ?? [];
    }
  },
  { immediate: true },
);
</script>

<template>
  <YdPopover v-model:open="open">
    <YdPopoverTrigger as-child>
      <div class="relative">
        <YdInput
          :is-disabled="isDisabled"
          :placeholder="resolvedPlaceholder"
          :value="value"
          autocomplete="off"
          class="w-full"
          @blur="handleBlur"
          @focus="open = true"
          @input="handleInput"
        />
        <!-- loading spinner 或 清空按钮 -->
        <div class="absolute inset-y-0 right-2 flex items-center">
          <Loader2
            v-if="isLoading"
            class="size-4 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <button
            v-else-if="clearable && value"
            class="text-muted-foreground hover:text-foreground"
            type="button"
            :aria-label="t('autoComplete.clearAriaLabel')"
            @mousedown.prevent="handleClear"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>
    </YdPopoverTrigger>
    <YdPopoverContent
      :class="cn('max-h-60 w-[var(--radix-popover-trigger-width)] overflow-y-auto p-1', props.class)"
      align="start"
      side="bottom"
      @open-auto-focus="(e: Event) => e.preventDefault()"
    >
      <div
        v-if="isLoading"
        class="flex items-center justify-center gap-2 px-2 py-3 text-sm text-muted-foreground"
      >
        <Loader2 class="size-3 animate-spin" aria-hidden="true" />
        <span>搜索中...</span>
      </div>
      <template v-else>
        <button
          v-for="option in resolvedOptions"
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
          v-if="resolvedOptions.length === 0"
          class="text-muted-foreground px-2 py-3 text-center text-sm"
        >
          {{ emptyText }}
        </p>
      </template>
    </YdPopoverContent>
  </YdPopover>
</template>
