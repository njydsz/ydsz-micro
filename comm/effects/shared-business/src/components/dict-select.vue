<!--
 * dict-select 通用组件
 *
 * <p>从全局字典缓存获取数据，支持数据权限过滤。
 * 监听字典变更事件（{@link emitDictChange}），自动刷新缓存。
 *
 * @path comm\effects\shared-business\src\components\dict-select.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 字典选择器组件 — 从全局字典缓存获取数据
 */
import { computed, onMounted, onUnmounted, watch } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { onDictChange } from '../composables/use-dict-event';
import { useDictStore } from '@ydsz/stores';

interface Props {
  /** 字典类型编码，如 system_status */
  dictType: string;
  /** 数据权限过滤（仅显示指定值） */
  values?: string[];
  modelValue?: string | number | (string | number)[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择',
  disabled: false,
  clearable: true,
  multiple: false,
  values: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[]];
  change: [value: string | number];
}>();

const dictStore = useDictStore();

/** 从缓存获取字典项 */
const dictItems = computed(() => dictStore.getItems(props.dictType));

const options = computed(() => {
  const items = dictItems.value;
  if (props.values?.length) {
    return items.filter((item) => props.values!.includes(item.value));
  }
  return items;
});

/** 保证字典加载 */
function ensureLoadDict() {
  dictStore.ensureLoaded(props.dictType);
}

onMounted(() => {
  ensureLoadDict();
});

watch(
  () => props.dictType,
  (type) => {
    dictStore.ensureLoaded(type);
  },
  { immediate: true },
);

// 字典变更监听：当其他页面修改字典后，自动刷新当前组件的字典数据
const offDictChange = onDictChange((detail) => {
  // typeCode 未指定（字典类型变更）或 typeCode 与当前组件匹配时才刷新
  if (!detail.typeCode || detail.typeCode === props.dictType) {
    dictStore.invalidate(props.dictType);
    ensureLoadDict();
  }
});

onUnmounted(() => {
  offDictChange();
});

function handleChange(value: string | number) {
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :multiple="multiple"
    :loading="dictStore.loadingTypes.has(dictType)"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="opt in options"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>
