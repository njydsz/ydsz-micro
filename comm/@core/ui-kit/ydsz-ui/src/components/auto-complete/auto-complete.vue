<script setup lang="ts" generic="T">
/**
* YdAutoComplete —— 自动补全输入框。
* 
 * <p>对标 Element Plus Autocomplete：
 * <ul>
 *   <li>输入触发远端搜索（带防抖、缓存）</li>
 *   <li>下拉候选列表支持键盘导航</li>
 *   <li>支持自定义渲染、清空、loading 状态</li>
 *   <li>大数据量下启用虚拟滚动</li>
 * </ul>
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\auto-complete\auto-complete.vue
 * @author ydsz-team
 * @since 26.10.11
 */
import { computed, ref, toRef, watch } from 'vue';

import { useVirtualForList } from '../../composables/use-virtual-for-list';
import { useLocale } from '../../locale/useLocale';

import type { AutoCompleteEmits, AutoCompleteFetchMethod, AutoCompleteOption, AutoCompleteProps } from './auto-complete-types';
import { useAutoComplete } from './use-auto-complete';

defineOptions({ name: 'YdAutoComplete' });

const props = withDefaults(defineProps<AutoCompleteProps<T>>(), {
  alignPanelWidth: true,
  autofocus: false,
  cache: true,
  caseSensitive: false,
  clearable: true,
  debounce: 300,
  disabled: false,
  loading: false,
  maxSuggestions: 500,
  minLength: 1,
  virtualScroll: true,
  cacheTTL: 5 * 60 * 1000,
});

const emit = defineEmits<AutoCompleteEmits<T>>();

const { t } = useLocale();

const queryInner = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);

// 远端 fetch 方法（这里是占位 —— 由上层业务通过 slot 或 provide 注入）
const fetchMethodRef = ref<AutoCompleteFetchMethod<T> | undefined>(undefined);

const controller = useAutoComplete<T>({
  query: toRef(() => queryInner.value),
  fetchMethod: (keyword: string) => {
    if (fetchMethodRef.value) {
      return fetchMethodRef.value(keyword);
    }
    return Promise.resolve([]);
  },
  debounceMs: props.debounce,
  minLength: props.minLength,
  cacheEnabled: props.cache,
  cacheTTL: props.cacheTTL,
});

const { suggestions, isLoading, activeIndex, showDropdown } = controller;

// 虚拟滚动：大数据量下启用
const virtualScrollHandler = useVirtualForList<AutoCompleteOption<T>>({
  items: () => suggestions.value,
  itemHeight: 32,
  threshold: props.virtualScroll ? 100 : Infinity,
  getKey: (item) => String(item.value),
});

/** 是否显示下拉面板 */
const isDropdownVisible = computed(() => showDropdown.value && !props.disabled);

/** 输入事件处理 */
function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  queryInner.value = target.value;
  emit('search', queryInner.value);
  if (!showDropdown.value && queryInner.value.trim().length >= props.minLength) {
    controller.triggerSearch(queryInner.value);
  }
}

/** 聚焦时自动触发搜索 */
function handleFocus(): void {
  if (queryInner.value.trim().length >= props.minLength) {
    controller.triggerSearch(queryInner.value);
  }
}

/** 键盘导航 */
function handleKeydown(event: KeyboardEvent): void {
  controller.handleKeydown(event, {
    select: (index) => {
      const opt = suggestions.value[index];
      if (opt) {
        handleSelect(opt);
      }
    },
    close: () => {
      controller['showDropdown'] && (controller['showDropdown'].value = false);
    },
  });
}

/** 选择候选 */
function handleSelect(option: AutoCompleteOption<T>): void {
  queryInner.value = option.label;
  emit('update:modelValue', option.value);
  emit('select', option);
  controller.selectOption(option);
}

/** 清空 */
function handleClear(): void {
  queryInner.value = '';
  emit('update:modelValue', undefined);
  emit('clear');
  controller.reset();
}

/** 高亮匹配文本 */
function highlightText(text: string, keyword: string): Array<{ text: string; hit: boolean }> {
  if (!keyword) {
    return [{ text, hit: false }];
  }
  const source = props.caseSensitive ? text : text.toLowerCase();
  const needle = props.caseSensitive ? keyword : keyword.toLowerCase();
  const parts: Array<{ text: string; hit: boolean }> = [];
  let idx = source.indexOf(needle);
  let last = 0;
  while (idx !== -1) {
    if (idx > last) {
      parts.push({ text: text.slice(last, idx), hit: false });
    }
    parts.push({ text: text.slice(idx, idx + keyword.length), hit: true });
    last = idx + keyword.length;
    idx = source.indexOf(needle, last);
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last), hit: false });
  }
  return parts;
}

/** 暴露 setFetchMethod：业务层调用后注入远端搜索逻辑 */
defineExpose({
  /** 注入远端搜索方法 */
  setFetchMethod: (fn: AutoCompleteFetchMethod<T>) => {
    fetchMethodRef.value = fn;
  },
  /** 重置组件 */
  reset: () => handleClear(),
});
</script>

<template>
  <div
    class="yd-auto-complete"
    :class="{ 'yd-auto-complete--disabled': props.disabled }"
  >
    <!-- 输入框 -->
    <input
      ref="inputRef"
      type="text"
      class="yd-auto-complete__input"
      :value="queryInner"
      :placeholder="props.placeholder ?? t('autoComplete.placeholder')"
      :disabled="props.disabled"
      :autofocus="props.autofocus"
      autocomplete="off"
      role="combobox"
      :aria-expanded="isDropdownVisible"
      :aria-controls="isDropdownVisible ? 'yd-auto-complete-listbox' : undefined"
      @input="handleInput"
      @focus="handleFocus"
      @keydown="handleKeydown"
    />

    <!-- 清空按钮 -->
    <button
      v-if="props.clearable && queryInner && !props.disabled"
      type="button"
      class="yd-auto-complete__clear-btn"
      :aria-label="t('autoComplete.clearAriaLabel')"
      @click.stop="handleClear"
    >
      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
      </svg>
    </button>

    <!-- 下拉面板 -->
    <Transition name="yd-auto-complete-fade">
      <div
        v-show="isDropdownVisible"
        :id="'yd-auto-complete-listbox'"
        ref="dropdownRef"
        class="yd-auto-complete__dropdown"
        :class="{ 'yd-auto-complete__dropdown--empty': suggestions.length === 0 && !isLoading }"
        role="listbox"
        :style="props.alignPanelWidth ? { width: `${inputRef?.offsetWidth ?? 0}px` } : undefined"
      >
        <!-- Loading 状态 -->
        <div v-if="isLoading" class="yd-auto-complete__loading">
          <span class="yd-auto-complete__spinner" aria-hidden="true" />
          <span class="yd-auto-complete__loading-text">{{ t('autoComplete.loadingText') }}</span>
        </div>

        <!-- 空数据 -->
        <div v-else-if="suggestions.length === 0" class="yd-auto-complete__empty">
          {{ t('autoComplete.emptyText') }}
        </div>

        <!-- 候选项列表 -->
        <template v-else-if="!virtualScrollHandler.isVirtualActive.value">
          <button
            v-for="(option, idx) in virtualScrollHandler.displayItems.value"
            :key="String((option as AutoCompleteOption<T>).value)"
            type="button"
            class="yd-auto-complete__option"
            :class="{
              'yd-auto-complete__option--active': activeIndex === idx,
              'yd-auto-complete__option--disabled': (option as AutoCompleteOption<T>).disabled,
            }"
            role="option"
            :aria-selected="activeIndex === idx"
            :disabled="(option as AutoCompleteOption<T>).disabled"
            @click="handleSelect(option as AutoCompleteOption<T>)"
            @mouseenter="activeIndex = idx"
          >
            <slot name="option" :option="(option as AutoCompleteOption<T>)" :keyword="queryInner">
              <span class="yd-auto-complete__option-text">
                <template v-for="(part, pIdx) in highlightText((option as AutoCompleteOption<T>).label, queryInner)" :key="pIdx">
                  <mark v-if="part.hit" class="yd-auto-complete__option-highlight">{{ part.text }}</mark>
                  <template v-else>{{ part.text }}</template>
                </template>
              </span>
            </slot>
          </button>
        </template>

        <!-- 虚拟滚动列表 -->
        <template v-else>
          <div v-bind="virtualScrollHandler.raw.containerProps.value" class="yd-auto-complete__virtual-container">
            <div v-bind="virtualScrollHandler.raw.spacerProps.value">
              <button
                v-for="vItem in virtualScrollHandler.displayItems.value"
                :key="vItem.key"
                type="button"
                class="yd-auto-complete__option"
                :class="{
                  'yd-auto-complete__option--active': activeIndex === vItem.index,
                  'yd-auto-complete__option--disabled': vItem.data.disabled,
                }"
                :style="{ position: 'absolute', top: `${vItem.offsetY}px`, width: '100%', height: `${vItem.height}px` }"
                role="option"
                :disabled="vItem.data.disabled"
                @click="handleSelect(vItem.data)"
                @mouseenter="activeIndex = vItem.index"
              >
                <span class="yd-auto-complete__option-text">
                  {{ vItem.data.label }}
                </span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.yd-auto-complete {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.yd-auto-complete__input {
  width: 100%;
  height: 32px;
  padding: 0 28px 0 8px;
  border: 1px solid var(--yd-color-border, #dcdfe6);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--yd-color-bg, #fff);
  color: var(--yd-color-text-primary, #303133);
  outline: none;
  transition: border-color 0.2s;
}

.yd-auto-complete__input:focus {
  border-color: var(--yd-color-primary, #1890ff);
}

.yd-auto-complete__input:disabled {
  background-color: var(--yd-color-bg-disabled, #f5f7fa);
  cursor: not-allowed;
}

.yd-auto-complete__clear-btn {
  position: absolute;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--yd-color-text-tertiary, #c0c4cc);
  border-radius: 50%;
}

.yd-auto-complete__clear-btn:hover {
  color: var(--yd-color-text-secondary, #606266);
}

.yd-auto-complete__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  max-height: 256px;
  overflow-y: auto;
  background: var(--yd-color-bg, #fff);
  border: 1px solid var(--yd-color-border, #e5e7eb);
  border-radius: 4px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  padding: 4px 0;
}

.yd-auto-complete__dropdown--empty {
  padding: 8px;
}

.yd-auto-complete__loading,
.yd-auto-complete__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--yd-color-text-tertiary, #909399);
}

.yd-auto-complete__spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--yd-color-border, #dcdfe6);
  border-top-color: var(--yd-color-primary, #1890ff);
  border-radius: 50%;
  animation: yd-auto-complete-spin 0.7s linear infinite;
}

@keyframes yd-auto-complete-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.yd-auto-complete__option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 12px;
  height: 32px;
  font-size: 14px;
  line-height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--yd-color-text-primary, #303133);
  text-align: left;
  transition: background-color 0.15s;
}

.yd-auto-complete__option:hover {
  background-color: var(--yd-color-bg-hover, #f5f7fa);
}

.yd-auto-complete__option--active {
  background-color: var(--yd-color-primary-bg-subtle, rgba(24, 144, 255, 0.08));
}

.yd-auto-complete__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.yd-auto-complete__option-highlight {
  background-color: transparent;
  color: var(--yd-color-primary, #1890ff);
  font-weight: 600;
}

.yd-auto-complete__virtual-container {
  position: relative;
  height: 256px;
  overflow-y: auto;
}

.yd-auto-complete-fade-enter-active,
.yd-auto-complete-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.yd-auto-complete-fade-enter-from,
.yd-auto-complete-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.yd-auto-complete--disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
