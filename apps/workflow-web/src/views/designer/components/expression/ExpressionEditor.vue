<!--
 * 可视化表达式编辑器
 *
 * <p>用于工作流条件表达式、变量赋值等场景的可视化编辑。
 * 支持：字段选择、运算符选择、函数选择、常量输入、表达式校验。
 *
 * @path apps\workflow-web\src\views\designer\components\expression\ExpressionEditor.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 可视化表达式编辑器
 * <p>支持 Aviator 表达式语法，提供可视化构建和文本编辑两种模式。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect, ElTabPane, ElTabs } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

interface Props {
  /** 初始表达式 */
  modelValue?: string;
  /** 可用变量列表 */
  variables?: Array<{ name: string; label: string; type: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  variables: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  success: [expression: string];
}>();

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    expressionText.value = props.modelValue;
    activeTab.value = 'visual';
    resetBuilder();
  },
  onConfirm: async () => {
    if (!expressionText.value.trim()) {
      ElMessage.warning('请输入表达式');
      return;
    }
    modalApi.lock();
    try {
      emit('update:modelValue', expressionText.value);
      emit('success', expressionText.value);
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

/** 当前激活的标签页 */
const activeTab = ref<'visual' | 'text'>('visual');

/** 表达式文本 */
const expressionText = ref(props.modelValue);

/** 可视化构建器状态 */
const builderForm = reactive({
  field: '',
  operator: '',
  value: '',
  logic: 'AND',
});

/** 运算符选项 */
const operatorOptions = [
  { label: '等于 (=)', value: '==' },
  { label: '不等于 (!=)', value: '!=' },
  { label: '大于 (>)', value: '>' },
  { label: '大于等于 (>=)', value: '>=' },
  { label: '小于 (<)', value: '<' },
  { label: '小于等于 (<=)', value: '<=' },
  { label: '包含 (in)', value: 'in' },
  { label: '不包含 (not in)', value: 'not in' },
  { label: '为空 (nil)', value: 'nil' },
  { label: '不为空 (not nil)', value: 'not nil' },
];

/** 逻辑连接符选项 */
const logicOptions = [
  { label: '并且 (AND)', value: 'AND' },
  { label: '或者 (OR)', value: 'OR' },
];

/** 函数选项 */
const functionOptions = [
  { label: '字符串长度 string.length()', value: 'string.length' },
  { label: '字符串包含 string.contains()', value: 'string.contains' },
  { label: '字符串开头 string.starts_with()', value: 'string.starts_with' },
  { label: '字符串结尾 string.ends_with()', value: 'string.ends_with' },
  { label: '当前日期 now()', value: 'now' },
  { label: '日期格式化 date_to_string()', value: 'date_to_string' },
  { label: '求和 math.abs()', value: 'math.abs' },
  { label: '四舍五入 math.round()', value: 'math.round' },
];

/** 已构建的条件列表 */
const conditionList = ref<Array<{ field: string; operator: string; value: string; logic: string }>>([]);

/** 预览表达式 */
const previewExpression = computed(() => {
  if (conditionList.value.length === 0) return '';
  return conditionList.value
    .map((c, index) => {
      const prefix = index > 0 ? ` ${c.logic} ` : '';
      if (c.operator === 'nil' || c.operator === 'not nil') {
        return `${prefix}${c.field} == ${c.operator === 'nil' ? 'nil' : 'string.nil'}`;
      }
      const val = isNaN(Number(c.value)) ? `"${c.value}"` : c.value;
      return `${prefix}${c.field} ${c.operator} ${val}`;
    })
    .join('');
});

/** 重置构建器 */
function resetBuilder(): void {
  builderForm.field = '';
  builderForm.operator = '';
  builderForm.value = '';
  builderForm.logic = 'AND';
  conditionList.value = [];
}

/** 添加条件 */
function handleAddCondition(): void {
  if (!builderForm.field || !builderForm.operator) {
    ElMessage.warning('请选择字段和运算符');
    return;
  }
  conditionList.value.push({ ...builderForm });
  builderForm.field = '';
  builderForm.operator = '';
  builderForm.value = '';
}

/** 删除条件 */
function handleRemoveCondition(index: number): void {
  conditionList.value.splice(index, 1);
}

/** 应用可视化构建结果 */
function applyVisualResult(): void {
  expressionText.value = previewExpression.value;
}

/** 切换标签页时同步表达式 */
watch(activeTab, (tab) => {
  if (tab === 'visual') {
    // 切换到可视化模式时，尝试解析文本表达式
    resetBuilder();
  } else {
    // 切换到文本模式时，同步可视化结果
    if (previewExpression.value) {
      expressionText.value = previewExpression.value;
    }
  }
});

watch(() => props.modelValue, (val) => {
  expressionText.value = val;
});
</script>

<template>
  <Modal title="表达式编辑器" width="700px">
    <ElTabs v-model="activeTab">
      <!-- 可视化构建 -->
      <ElTabPane label="可视化构建" name="visual">
        <div class="expression-builder">
          <!-- 条件列表 -->
          <div v-if="conditionList.length > 0" class="mb-4">
            <div
              v-for="(condition, index) in conditionList"
              :key="index"
              class="mb-2 flex items-center gap-2 rounded border bg-gray-50 p-2"
            >
              <span v-if="index > 0" class="logic-tag">{{ condition.logic }}</span>
              <span class="field-tag">{{ condition.field }}</span>
              <span class="operator-tag">{{ condition.operator }}</span>
              <span class="value-tag">{{ condition.value }}</span>
              <ElButton size="small" link type="danger" @click="handleRemoveCondition(index)">删除</ElButton>
            </div>
          </div>

          <!-- 条件输入 -->
          <ElForm :model="builderForm" label-width="80px" class="condition-form">
            <ElFormItem v-if="conditionList.length > 0" label="逻辑连接">
              <ElSelect v-model="builderForm.logic" placeholder="选择逻辑连接符">
                <ElOption v-for="opt in logicOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="字段">
              <ElSelect v-model="builderForm.field" placeholder="选择变量/字段" filterable>
                <ElOption
                  v-for="v in variables"
                  :key="v.name"
                  :label="`${v.label} (${v.name})`"
                  :value="v.name"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="运算符">
              <ElSelect v-model="builderForm.operator" placeholder="选择运算符">
                <ElOption v-for="opt in operatorOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="值">
              <ElInput v-model="builderForm.value" placeholder="输入比较值（可为常量或变量名）" />
            </ElFormItem>
          </ElForm>
          <div class="mt-2 flex gap-2">
            <ElButton type="primary" size="small" @click="handleAddCondition">添加条件</ElButton>
            <ElButton size="small" @click="applyVisualResult">应用到表达式</ElButton>
            <ElButton size="small" @click="resetBuilder">清空</ElButton>
          </div>
        </div>
      </ElTabPane>

      <!-- 文本编辑 -->
      <ElTabPane label="文本编辑" name="text">
        <div class="text-editor">
          <ElInput
            v-model="expressionText"
            type="textarea"
            :rows="8"
            placeholder="请输入 Aviator 表达式，如：amount > 100 && status == 'APPROVED'"
          />
          <div class="mt-3">
            <p class="mb-2 text-xs font-medium text-gray-600">常用函数：</p>
            <div class="flex flex-wrap gap-2">
              <ElButton
                v-for="func in functionOptions"
                :key="func.value"
                size="small"
                @click="expressionText += ` ${func.value}()`"
              >
                {{ func.label }}
              </ElButton>
            </div>
          </div>
        </div>
      </ElTabPane>
    </ElTabs>

    <!-- 表达式预览 -->
    <div class="mt-4 rounded border bg-gray-50 p-3">
      <p class="mb-1 text-xs font-medium text-gray-500">当前表达式：</p>
      <pre class="overflow-auto whitespace-pre-wrap break-words text-sm text-gray-700">{{ expressionText || '（空）' }}</pre>
    </div>
  </Modal>
</template>

<style scoped>
.expression-builder {
  min-height: 200px;
}

.condition-form {
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  padding: 12px;
}

.logic-tag {
  padding: 2px 8px;
  background: #e6a23c;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.field-tag {
  padding: 2px 8px;
  background: #409eff;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.operator-tag {
  padding: 2px 8px;
  background: #67c23a;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.value-tag {
  padding: 2px 8px;
  background: #909399;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.text-editor {
  min-height: 200px;
}
</style>
