<!--
 * 可视化表达式编辑器
 *
 * <p>用于工作流条件表达式、变量赋值等场景的可视化编辑。
 * 支持：字段选择、运算符选择、函数选择、常量输入、表达式校验。
 * 完整对接后端 FlowDefinitionController 全部 8 个 conditionExpr 子端点。
 *
 * @path apps\workflow-web\src\views\designer\components\expression\ExpressionEditor.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 可视化表达式编辑器
 * <p>支持 Aviator 表达式语法，提供可视化构建和文本编辑两种模式。
 * 完整对接后端 conditionExpr 全部 8 个端点：operators / valueTypes / variables /
 * buildExpression / parseExpression / validateExpression / previewExpression / conditionTemplates。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
// TODO: EP → ydsz-ui 迁移待后续批次（表达式编辑器包含 ElTabs/ElTabPane/ElForm/ElFormItem 等复杂组合）
import { ElButton, ElForm, ElFormItem, ElInput, ElOption, ElSelect, ElTabPane, ElTabs } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';
import {
  buildExpression,
  conditionTemplates,
  operators,
  parseExpression,
  previewExpression,
  validateExpression,
  valueTypes,
  variables,
} from '#/api/flowDefinition';
import { $t } from '#/locales';
import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('expression-editor');

interface Props {
  /** 初始表达式 */
  modelValue?: string;
  /** 可用变量列表（外部传入时会话级传入；未传时从后端 variables 端点加载） */
  variables?: Array<{ name: string; label: string; type: string }>;
  /** 流程定义 ID，用于从后端加载可用变量列表 */
  definitionId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  variables: () => [],
  definitionId: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  success: [expression: string];
}>();

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    expressionText.value = props.modelValue;
    activeTab.value = 'visual';
    resetBuilder();
    loadMetaData();
  },
  onConfirm: async () => {
    if (!expressionText.value.trim()) {
      showToast.warning($t('wf.exprEmpty'));
      return;
    }
    modalApi.lock();
    try {
      // 校验表达式合法性
      await validateExpression({ expression: expressionText.value });
      emit('update:modelValue', expressionText.value);
      emit('success', expressionText.value);
      modalApi.close();
    } catch (error) {
      logger.warn('表达式校验失败，详见拦截器提示', error);
      // 用户提示由 errorMessageResponseInterceptor 统一处理
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
  valueType: '',
  logic: 'AND',
});

/** 运算符选项（从后端 operators 端点加载） */
const operatorOptions = ref<Array<{ label: string; value: string }>>([]);

/** 值类型选项（从后端 valueTypes 端点加载） */
const valueTypeOptions = ref<Array<{ label: string; value: string }>>([]);

/** 变量选项（从后端 variables 端点加载，或通过 props 传入） */
const variableOptions = ref<Array<{ name: string; label: string; type: string }>>([]);

/** 条件模板选项（从后端 conditionTemplates 端点加载） */
const templateOptions = ref<Array<{ label: string; value: string }>>([]);

/** 服务端预览结果 */
const serverPreview = ref('');

/** 校验结果 */
const validationResult = ref<{ valid: boolean; message: string } | null>(null);

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
const conditionList = ref<Array<{ field: string; operator: string; value: string; valueType: string; logic: string }>>(
  [],
);

/** 客户端本地预览表达式 */
const localPreviewExpression = computed(() => {
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

/**
 * 加载元数据：operators / valueTypes / variables / conditionTemplates。
 * 全部 4 个 GET 端点并行调用，失败时降级到本地默认值。
 */
async function loadMetaData(): Promise<void> {
  const promises: Promise<void>[] = [];

  // operators — GET /definition/conditionExpr/operators
  promises.push(
    operators()
      .then((res) => {
        const list = res ?? [];
        if (list.length > 0) {
          operatorOptions.value = list.map((item) => ({
            label: item['label'] ?? item['name'] ?? Object.values(item)[0] ?? '',
            value: item['value'] ?? item['code'] ?? Object.values(item)[0] ?? '',
          }));
        }
      })
      .catch((error) => {
        logger.warn('加载运算符列表失败，使用本地默认值', error);
        operatorOptions.value = getDefaultOperators();
      }),
  );

  // valueTypes — GET /definition/conditionExpr/valueTypes
  promises.push(
    valueTypes()
      .then((res) => {
        const list = res ?? [];
        if (list.length > 0) {
          valueTypeOptions.value = list.map((item) => ({
            label: item['label'] ?? item['name'] ?? Object.values(item)[0] ?? '',
            value: item['value'] ?? item['code'] ?? Object.values(item)[0] ?? '',
          }));
        }
      })
      .catch((error) => {
        logger.warn('加载值类型列表失败', error);
      }),
  );

  // variables — GET /definition/conditionExpr/variables/{id}
  if (props.definitionId) {
    promises.push(
      variables({ id: props.definitionId })
        .then((res) => {
          const list = res ?? [];
          if (list.length > 0) {
            variableOptions.value = list.map((item) => ({
              name: item['name'] ?? item['code'] ?? Object.values(item)[0] ?? '',
              label: item['label'] ?? item['name'] ?? Object.values(item)[0] ?? '',
              type: item['type'] ?? item['dataType'] ?? 'string',
            }));
          }
        })
        .catch((error) => {
          logger.warn('加载流程变量列表失败', error);
        }),
    );
  } else if (props.variables.length > 0) {
    variableOptions.value = [...props.variables];
  }

  // conditionTemplates — GET /definition/conditionExpr/templates
  promises.push(
    conditionTemplates()
      .then((res) => {
        const list = res ?? [];
        if (list.length > 0) {
          templateOptions.value = list.map((item) => ({
            label: item['name'] ?? item['label'] ?? Object.values(item)[0] ?? '',
            value: item['expression'] ?? item['code'] ?? Object.values(item)[0] ?? '',
          }));
        }
      })
      .catch((error) => {
        logger.warn('加载条件模板列表失败', error);
      }),
  );

  await Promise.allSettled(promises);
}

/** 默认运算符降级列表 */
function getDefaultOperators(): Array<{ label: string; value: string }> {
  return [
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
}

/** 重置构建器 */
function resetBuilder(): void {
  builderForm.field = '';
  builderForm.operator = '';
  builderForm.value = '';
  builderForm.valueType = '';
  builderForm.logic = 'AND';
  conditionList.value = [];
  serverPreview.value = '';
  validationResult.value = null;
}

/** 添加条件 */
function handleAddCondition(): void {
  if (!builderForm.field || !builderForm.operator) {
    showToast.warning($t('wf.exprSelectFieldOp'));
    return;
  }
  conditionList.value.push({ ...builderForm });
  builderForm.field = '';
  builderForm.operator = '';
  builderForm.value = '';
  builderForm.valueType = '';
  serverPreview.value = '';
  validationResult.value = null;
}

/** 删除条件 */
function handleRemoveCondition(index: number): void {
  conditionList.value.splice(index, 1);
  serverPreview.value = '';
  validationResult.value = null;
}

/**
 * 构建表达式 — 调用后端 buildExpression 端点。
 * 将可视化条件列表发送到后端，获取标准化表达式字符串。
 */
async function handleBuildExpression(): Promise<void> {
  if (conditionList.value.length === 0) {
    showToast.warning($t('wf.exprAddConditionFirst'));
    return;
  }
  try {
    const result = await buildExpression({
      conditions: JSON.stringify(conditionList.value),
      expression: localPreviewExpression.value,
    });
    if (result) {
      expressionText.value = result;
      serverPreview.value = result;
      showToast.success($t('wf.exprBuildSuccess'));
    }
  } catch (error) {
    logger.warn('构建表达式失败，详见拦截器提示', error);
  }
}

/**
 * 解析表达式 — 调用后端 parseExpression 端点。
 * 将文本模式的表达式发送到后端解析为 AST/可读结构。
 */
async function handleParseExpression(): Promise<void> {
  if (!expressionText.value.trim()) return;
  try {
    const result = await parseExpression({ expression: expressionText.value });
    if (result) {
      showToast.success($t('wf.exprParseSuccess'));
      logger.info('解析结果', result);
    }
  } catch (error) {
    logger.warn('解析表达式失败，详见拦截器提示', error);
  }
}

/**
 * 校验表达式 — 调用后端 validateExpression 端点。
 */
async function handleValidateExpression(): Promise<void> {
  if (!expressionText.value.trim()) return;
  try {
    const result = await validateExpression({ expression: expressionText.value });
    validationResult.value = { valid: true, message: $t('wf.exprValid') };
    showToast.success($t('wf.exprValid'));
    logger.info('校验结果', result);
  } catch (error) {
    validationResult.value = { valid: false, message: $t('wf.exprInvalid') };
    logger.warn('表达式校验失败，详见拦截器提示', error);
  }
}

/**
 * 预览表达式 — 调用后端 previewExpression 端点。
 * 获取表达式在不同变量取值下的评估结果预览。
 */
async function handlePreviewExpression(): Promise<void> {
  if (!expressionText.value.trim()) return;
  try {
    const result = await previewExpression({
      expression: expressionText.value,
      variables: JSON.stringify({}),
    });
    serverPreview.value = JSON.stringify(result ?? {}, null, 2);
    showToast.success($t('wf.exprPreviewSuccess'));
  } catch (error) {
    logger.warn('预览表达式失败，详见拦截器提示', error);
  }
}

/** 应用可视化构建结果（本地生成，同时触发远端构建） */
function applyVisualResult(): void {
  expressionText.value = localPreviewExpression.value;
  handleBuildExpression();
}

/** 应用条件模板 */
function handleApplyTemplate(templateValue: string): void {
  if (templateValue) {
    expressionText.value = templateValue;
  }
}

/** 切换标签页时同步表达式 */
watch(activeTab, (tab) => {
  if (tab === 'visual') {
    // 切换到可视化模式时，尝试解析文本表达式
    if (expressionText.value.trim()) {
      handleParseExpression();
    }
    resetBuilder();
  } else {
    // 切换到文本模式时，同步可视化结果
    if (localPreviewExpression.value) {
      expressionText.value = localPreviewExpression.value;
    }
  }
});

watch(
  () => props.modelValue,
  (val) => {
    expressionText.value = val;
  },
);
</script>

<template>
  <Modal :title="$t('wf.exprEditor')" width="750px">
    <ElTabs v-model="activeTab">
      <!-- 可视化构建 -->
      <ElTabPane :label="$t('wf.exprVisualBuild')" name="visual">
        <div class="expression-builder">
          <!-- 条件模板快捷选择 -->
          <div v-if="templateOptions.length > 0" class="mb-3">
            <p class="mb-1 text-xs font-medium text-gray-600">{{ $t('wf.exprTemplates') }}：</p>
            <ElSelect
              :placeholder="$t('wf.exprSelectTemplate')"
              clearable
              style="width: 100%"
              @change="handleApplyTemplate"
            >
              <ElOption
                v-for="tmpl in templateOptions"
                :key="tmpl.value"
                :label="tmpl.label"
                :value="tmpl.value"
              />
            </ElSelect>
          </div>

          <!-- 条件列表 -->
          <div v-if="conditionList.length > 0" class="mb-4">
            <div
              v-for="(condition, index) in conditionList"
              :key="condition.field ? `${condition.field}-${condition.operator}` : index"
              class="mb-2 flex items-center gap-2 rounded border bg-gray-50 p-2"
            >
              <span v-if="index > 0" class="logic-tag">{{ condition.logic }}</span>
              <span class="field-tag">{{ condition.field }}</span>
              <span class="operator-tag">{{ condition.operator }}</span>
              <span class="value-tag">{{ condition.value }}</span>
              <ElButton size="small" link type="danger" @click="handleRemoveCondition(index)">{{
                $t('wf.delete')
              }}</ElButton>
            </div>
          </div>

          <!-- 条件输入 -->
          <ElForm :model="builderForm" label-width="80px" class="condition-form">
            <ElFormItem v-if="conditionList.length > 0" :label="$t('wf.exprLogic')">
              <ElSelect v-model="builderForm.logic" :placeholder="$t('wf.exprSelectLogic')">
                <ElOption
                  v-for="opt in logicOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="$t('wf.exprField')">
              <ElSelect v-model="builderForm.field" :placeholder="$t('wf.exprSelectField')" filterable>
                <ElOption
                  v-for="v in variableOptions"
                  :key="v.name"
                  :label="`${v.label} (${v.name})`"
                  :value="v.name"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="$t('wf.exprOperator')">
              <ElSelect v-model="builderForm.operator" :placeholder="$t('wf.exprSelectOperator')">
                <ElOption
                  v-for="opt in operatorOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem v-if="valueTypeOptions.length > 0" :label="$t('wf.exprValueType')">
              <ElSelect v-model="builderForm.valueType" :placeholder="$t('wf.exprSelectValueType')" clearable>
                <ElOption
                  v-for="vt in valueTypeOptions"
                  :key="vt.value"
                  :label="vt.label"
                  :value="vt.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="$t('wf.exprValue')">
              <ElInput v-model="builderForm.value" :placeholder="$t('wf.exprValuePlaceholder')" />
            </ElFormItem>
          </ElForm>
          <div class="mt-2 flex flex-wrap gap-2">
            <ElButton type="primary" size="small" @click="handleAddCondition">{{ $t('wf.exprAddCondition') }}</ElButton>
            <ElButton size="small" @click="applyVisualResult">{{ $t('wf.exprApplyVisual') }}</ElButton>
            <ElButton size="small" @click="handleBuildExpression">{{ $t('wf.exprBuild') }}</ElButton>
            <ElButton size="small" @click="resetBuilder">{{ $t('wf.exprClear') }}</ElButton>
          </div>
        </div>
      </ElTabPane>

      <!-- 文本编辑 -->
      <ElTabPane :label="$t('wf.exprTextEdit')" name="text">
        <div class="text-editor">
          <ElInput
            v-model="expressionText"
            type="textarea"
            :rows="8"
            :placeholder="$t('wf.exprTextPlaceholder')"
          />
          <!-- 校验结果提示 -->
          <div v-if="validationResult" class="mt-2">
            <p
              class="text-sm"
              :class="validationResult.valid ? 'text-green-600' : 'text-red-600'"
            >
              {{ validationResult.message }}
            </p>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <ElButton size="small" @click="handleValidateExpression">{{ $t('wf.exprValidate') }}</ElButton>
            <ElButton size="small" @click="handleParseExpression">{{ $t('wf.exprParse') }}</ElButton>
            <ElButton size="small" @click="handlePreviewExpression">{{ $t('wf.exprPreview') }}</ElButton>
          </div>
          <div class="mt-3">
            <p class="mb-2 text-xs font-medium text-gray-600">{{ $t('wf.exprCommonFunctions') }}：</p>
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
      <p class="mb-1 text-xs font-medium text-gray-500">{{ $t('wf.exprCurrentExpr') }}：</p>
      <pre class="overflow-auto whitespace-pre-wrap break-words text-sm text-gray-700">{{
        expressionText || '（空）'
      }}</pre>
      <!-- 服务端构建/预览结果 -->
      <div v-if="serverPreview" class="mt-2 border-t pt-2">
        <p class="mb-1 text-xs font-medium text-gray-500">{{ $t('wf.exprServerResult') }}：</p>
        <pre class="overflow-auto whitespace-pre-wrap break-words text-xs text-blue-700">{{ serverPreview }}</pre>
      </div>
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
