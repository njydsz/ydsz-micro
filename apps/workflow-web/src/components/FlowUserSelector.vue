<!--
 * 流程用户选择器组件
 *
 * <p>基于后端 {@code UserinfoSearchController} 的用户全文检索能力，提供远程搜索选择。
 * <p>支持 v-model 双向绑定，可复用于转办/委托等需要选择目标用户的场景。
 *
 * @path apps\workflow-web\src\components\FlowUserSelector.vue
 * @author ydsz-team
 * @since 1.0.0
 -->
<script lang="ts" setup>
/**
 * 流程用户选择器组件
 * <p>远程搜索用户，支持分页加载。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { ElOption, ElSelect } from 'element-plus';
import { ref, watch } from 'vue';
import { searchUsers } from '#/api/flowUser';
import type { FlowUserSearchResult } from '#/api/flowUser';
import { $t } from '#/locales';

interface Props {
  /** 当前选中的用户 ID */
  modelValue?: string;
  /** 当前选中的用户姓名（用于回显） */
  modelLabel?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符 */
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  modelLabel: '',
  disabled: false,
  placeholder: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:modelLabel', value: string): void;
  (e: 'change', value: string, item?: FlowUserSearchResult): void;
}>();

/** 用户列表 */
const userList = ref<FlowUserSearchResult[]>([]);
/** 搜索加载状态 */
const loading = ref(false);
/** 当前搜索关键词 */
const searchKeyword = ref('');
/** 当前选中项映射（用于回显） */
const selectedMap = ref<Record<string, FlowUserSearchResult>>({});

/** 远程搜索用户 */
async function remoteSearch(keyword: string) {
  if (!keyword || keyword.trim().length < 1) {
    userList.value = [];
    return;
  }
  searchKeyword.value = keyword;
  loading.value = true;
  try {
    const result = await searchUsers({ keyword: keyword.trim(), page: 1, pageSize: 20 });
    const items = result.items ?? [];
    userList.value = items;
    // 构建选中映射
    items.forEach((item) => {
      if (item.userId) {
        selectedMap.value[item.userId] = item;
      }
    });
  } catch {
    userList.value = [];
  } finally {
    loading.value = false;
  }
}

/** 处理选择变化 */
function handleChange(value: string) {
  const selected = selectedMap.value[value];
  emit('update:modelValue', value);
  emit('update:modelLabel', selected?.userName ?? '');
  emit('change', value, selected);
}

/** 处理清空 */
function handleClear() {
  emit('update:modelValue', '');
  emit('update:modelLabel', '');
  emit('change', '', undefined);
}

/** 初始化时如果有 modelValue 但无列表，尝试加载 */
watch(() => props.modelValue, (newVal) => {
  if (newVal && userList.value.length === 0 && props.modelLabel) {
    // 有初始值但无列表时，将初始值加入列表用于回显
    userList.value = [{ userId: newVal, userName: props.modelLabel }];
  }
}, { immediate: true });
</script>

<template>
  <ElSelect
    :model-value="modelValue"
    :remote="true"
    :remote-method="remoteSearch"
    :loading="loading"
    :disabled="disabled"
    :placeholder="placeholder || $t('wf.targetUserPlaceholder')"
    filterable
    clearable
    style="width: 100%"
    @change="handleChange"
    @clear="handleClear"
  >
    <ElOption
      v-for="item in userList"
      :key="item.userId"
      :label="item.userName"
      :value="item.userId"
    />
  </ElSelect>
</template>
