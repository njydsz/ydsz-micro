<!--
 * Cascader 级联选择器：支持多层级联下拉、搜索、多选、清除。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\cascader\cascader.vue
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CascaderEmits, CascaderOption, CascaderProps } from './cascader-types';

import { computed, ref } from 'vue';

import { Check, ChevronDown, ChevronRight, CircleX } from '@ydsz-core/icons';

defineOptions({ name: 'YdCascader' });

const props = withDefaults(defineProps<CascaderProps>(), {
  allowClear: true,
  multiple: false,
  searchable: false,
  separator: ' / ',
  strategy: 'any',
});

const emit = defineEmits<CascaderEmits>();

/** 下拉是否展开 */
const isOpen = ref(false);

/** 搜索关键词 */
const searchText = ref('');

/** 当前展开的面板层级路径 */
const expandedPath = ref<CascaderOption[]>([]);

/** 已选选项值 */
const selectedValues = ref<Array<string | number>>([]);

/** 当前面板显示的数据 */
const currentPanelData = computed<CascaderOption[]>(() => {
  if (expandedPath.value.length === 0) {
    return props.options;
  }
  const lastNode = expandedPath.value[expandedPath.value.length - 1];
  return lastNode.children ?? [];
});

/** 搜索过滤后的选项 */
const filteredOptions = computed<CascaderOption[]>(() => {
  if (!searchText.value || !props.searchable) return props.options;
  return filterOptions(props.options, searchText.value.toLowerCase());
});

function filterOptions(options: CascaderOption[], keyword: string): CascaderOption[] {
  const result: CascaderOption[] = [];
  for (const opt of options) {
    const match = opt.label.toLowerCase().includes(keyword);
    const filteredChildren = opt.children ? filterOptions(opt.children, keyword) : [];
    if (match || filteredChildren.length > 0) {
      result.push({
        ...opt,
        children: filteredChildren.length > 0 ? filteredChildren : opt.children,
      });
    }
  }
  return result;
}

/** 切换下拉 */
function toggleOpen(): void {
  if (props.isDisabled) return;
  isOpen.value = !isOpen.value;
}

/** 选择节点 */
function handleSelect(option: CascaderOption, level: number): void {
  if (option.isDisabled) return;

  // 更新展开路径
  expandedPath.value = [...expandedPath.value.slice(0, level), option];

  const isLeaf = option.isLeaf ?? (!option.children || option.children.length === 0);
  if (isLeaf || props.strategy === 'any') {
    selectedValues.value = [option.value];
    emit('update:value', [option.value]);
    if (!props.multiple) {
      isOpen.value = false;
    }
  }

  if (!isLeaf) {
    emit('expand', expandedPath.value);
  }
}

/** 清除已选 */
function handleClear(event: Event): void {
  event.stopPropagation();
  selectedValues.value = [];
  expandedPath.value = [];
  emit('update:value', []);
}

/** 判断节点是否选中 */
function isSelected(option: CascaderOption): boolean {
  return selectedValues.value.includes(option.value);
}

/** 显示文本 */
const displayText = computed(() => {
  if (selectedValues.value.length === 0) return props.placeholder ?? '请选择';
  return selectedValues.value.join(props.separator);
});
</script>

<template>
  <div :class="['yd-cascader', { 'yd-cascader--open': isOpen, 'yd-cascader--disabled': isDisabled }]">
    <!-- 触发器 -->
    <button
      :class="['yd-cascader__trigger', props.class]"
      type="button"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-disabled="isDisabled"
      @click="toggleOpen"
    >
      <span class="yd-cascader__value">{{ displayText }}</span>
      <ChevronDown v-if="!allowClear || selectedValues.length === 0" class="yd-cascader__icon" />
      <CircleX v-else class="yd-cascader__clear" role="button" aria-label="清除" @click="handleClear" />
    </button>

    <!-- 面板 -->
    <div v-if="isOpen" class="yd-cascader__panel" role="listbox">
      <!-- 搜索框 -->
      <div v-if="searchable" class="yd-cascader__search">
        <input v-model="searchText" type="text" placeholder="搜索..." class="yd-cascader__search-input" />
      </div>

      <!-- 级联列 -->
      <div class="yd-cascader__columns">
        <div class="yd-cascader__column" role="listbox">
          <template v-for="(option, idx) in filteredOptions" :key="idx">
            <div
              :class="[
                'yd-cascader__option',
                { 'yd-cascader__option--active': isSelected(option) },
                { 'yd-cascader__option--disabled': option.isDisabled },
              ]"
              role="option"
              :aria-selected="isSelected(option)"
              @click="handleSelect(option, 0)"
            >
              <Check v-if="isSelected(option)" class="yd-cascader__check" />
              <span class="yd-cascader__label">{{ option.label }}</span>
              <ChevronRight v-if="option.children && option.children.length > 0" class="yd-cascader__arrow" />
            </div>
          </template>
        </div>

        <!-- 子级列（递归展示） -->
        <template v-for="(parent, level) in expandedPath" :key="level">
          <div v-if="parent.children && parent.children.length > 0" class="yd-cascader__column" role="listbox">
            <template v-for="(child, cIdx) in parent.children" :key="cIdx">
              <div
                :class="['yd-cascader__option', { 'yd-cascader__option--active': isSelected(child) }]"
                role="option"
                :aria-selected="isSelected(child)"
                @click="handleSelect(child, level + 1)"
              >
                <Check v-if="isSelected(child)" class="yd-cascader__check" />
                <span class="yd-cascader__label">{{ child.label }}</span>
                <ChevronRight v-if="child.children && child.children.length > 0" class="yd-cascader__arrow" />
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.yd-cascader {
  position: relative;
  display: inline-flex;
}

.yd-cascader__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  padding: 6px 12px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 6px;
  background: var(--ydsz-color-bg, #fff);
  cursor: pointer;
  font-size: 14px;
  transition: border-color var(--ydsz-motion-duration-fast, 150ms);

  &:hover {
    border-color: var(--ydsz-color-primary, #1677ff);
  }
}

.yd-cascader--disabled .yd-cascader__trigger {
  opacity: 0.5;
  cursor: not-allowed;
}

.yd-cascader__value {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yd-cascader__clear {
  cursor: pointer;
  flex-shrink: 0;
}

.yd-cascader__panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: var(--ydsz-z-popup, 1000);
  margin-top: 4px;
  padding: 8px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 6px;
  background: var(--ydsz-color-bg, #fff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.yd-cascader__search {
  margin-bottom: 8px;
}

.yd-cascader__search-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--ydsz-color-border, #d9d9d9);
  border-radius: 4px;
  outline: none;
  font-size: 14px;

  &:focus {
    border-color: var(--ydsz-color-primary, #1677ff);
  }
}

.yd-cascader__columns {
  display: flex;
  gap: 0;
}

.yd-cascader__column {
  min-width: 160px;
  max-height: 256px;
  overflow-y: auto;
  border-right: 1px solid var(--ydsz-color-border-light, #f0f0f0);

  &:last-child {
    border-right: none;
  }
}

.yd-cascader__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color var(--ydsz-motion-duration-fast, 150ms);

  &:hover {
    background: var(--ydsz-color-bg-hover, #f5f5f5);
  }

  &--active {
    color: var(--ydsz-color-primary, #1677ff);
    font-weight: 500;
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.yd-cascader__check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.yd-cascader__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.yd-cascader__arrow {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--ydsz-color-text-secondary, #999);
}
</style>
