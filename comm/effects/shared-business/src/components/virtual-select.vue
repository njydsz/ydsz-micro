<!--
 * virtual-select 通用组件 — 大数据量下拉选择器
 *
 * 当前内部使用 shadcn Select，保留对外 API 兼容（options / modelValue / filterable）。
 * 真实虚拟滚动能力待 P1-1 自研 SelectV2 落地后回补；暂以分页 limit 200 兜底。
 *
 * @path comm\effects\shared-business\src\components\virtual-select.vue
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
/**
 * 虚拟滚动下拉选择器 — 临时降级 API 兼容层
 *
 * 注：P1-1 落地 SelectV2 虚拟滚动后替换本实现。
 */
import { computed, ref, watch } from 'vue';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ydsz-core/shadcn-ui';

interface Option {
  label: string;
  value: string | number;
  [key: string]: unknown;
}

interface Props {
  /** 选项数据（大数据场景推荐传入全部选项） */
  options: Option[];
  modelValue?: string | number | (string | number)[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  filterable?: boolean;
  /** 虚拟滚动的可见行数，默认 10；实现占位 */
  virtualRows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择',
  disabled: false,
  clearable: true,
  multiple: false,
  filterable: true,
  virtualRows: 10,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[]];
}>();

/** 搜索关键字 */
const searchKeyword = ref('');

/** 过滤 + 分页限流的选项（临时兜底） */
const visibleOptions = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const filtered = keyword
    ? props.options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(keyword) ||
          String(opt.value).toLowerCase().includes(keyword),
      )
    : props.options;
  // 临时兜底：大数据集仅展示前 200 条（等 SelectV2 回补虚拟滚动）
  return filtered.slice(0, 200);
});

function handleSearchInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  searchKeyword.value = target.value;
}

function handleChange(value: string | number | (string | number)[]): void {
  emit('update:modelValue', value);
}

// 同步外部 options 变化
watch(
  () => props.options,
  () => {
    searchKeyword.value = '';
  },
  { immediate: true },
);
</script>

<template>
  <Select
    :disabled="disabled"
    :multiple="multiple"
    :model-value="multiple ? undefined : (modelValue as string | number | undefined)"
    @update:model-value="handleChange"
  >
    <SelectTrigger class="w-full">
      <div class="virtual-select__trigger flex w-full items-center gap-1">
        <input
          v-if="filterable"
          :value="searchKeyword"
          :placeholder="placeholder"
          class="virtual-select__input flex-1 border-none bg-transparent text-sm outline-none"
          type="text"
          @input="handleSearchInput"
        />
        <SelectValue
          v-else
          :placeholder="placeholder"
          class="flex-1"
        />
      </div>
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="opt in visibleOptions"
        :key="String(opt.value)"
        :value="String(opt.value)"
      >
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<style scoped>
.virtual-select__trigger {
  min-width: 0;
}

.virtual-select__input::placeholder {
  color: hsl(var(--txt-tertiary, #909399));
}
</style>
