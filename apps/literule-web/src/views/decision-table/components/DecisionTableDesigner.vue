<!--
 * 决策表可视化编辑器
 *
 * <p>提供决策表的可视化编辑能力，支持条件列、动作列、规则行的可视化编辑。
 *
 * @path apps\literule-web\src\views\decision-table\components\DecisionTableDesigner.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { $t } from '@ydsz/locales';
defineOptions({
  name: 'DecisionTableDesigner',
});
/**
 * 决策表可视化编辑器
 * <p>消费后端契约 RuleDecisionTableController（apps/literule-web/src/api/ruleDecisionTable.ts）：
 * getDecisionTable() 获取决策表详情，saveDecisionTable() 保存决策表，
 * evaluateDecisionTable() 评估测试。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import {
  YdButton,
  YdDialog,
  YdForm,
  YdFormItem,
  YdInput,
  YdSelectItem,
  YdSelect,
  YdTable,
  YdTableColumn,
} from '@ydsz-core/ydsz-ui';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { showToast } from '@ydsz/notification';
import type { DecisionTableVO } from '#/api/models';
import {
  evaluateDecisionTable,
  getDecisionTable,
  saveDecisionTable,
} from '#/api/ruleDecisionTable';

interface Props {
  /** 决策表数据（编辑时传入） */
  tableData?: DecisionTableVO | null;
}

const props = withDefaults(defineProps<Props>(), {
  tableData: null,
});

const { t } = useI18n();

const emit = defineEmits<{
  success: [];
  close: [];
}>();

/** 弹窗可见性 */
const visible = ref(false);

/** 加载状态 */
const loading = ref(false);

/** 保存状态 */
const saving = ref(false);

/** 决策表基本信息 */
const tableInfo = ref({
  tableCode: '',
  tableName: '',
  description: '',
  category: '',
  hitPolicy: 'FIRST',
});

/** 条件列定义 */
const conditionColumns = ref<Record<string, unknown>[]>([]);

/** 动作列定义 */
const actionColumns = ref<Record<string, unknown>[]>([]);

/** 规则行数据 */
const ruleRows = ref<Record<string, unknown>[]>([]);

/** 评估测试弹窗 */
const evaluateDialogVisible = ref(false);
const evaluateParams = ref('');
const evaluateResults = ref<Record<string, unknown>[]>([]);
const evaluating = ref(false);

/** 命中策略选项 */
const hitPolicyOptions = computed(() => [
  { label: t('business.decisionTableHitFirst'), value: 'FIRST' },
  { label: t('business.decisionTableHitAll'), value: 'ALL' },
  { label: t('business.decisionTableHitUnique'), value: 'UNIQUE' },
  { label: t('business.rulePriority'), value: 'PRIORITY' },
  { label: t('business.decisionTableHitCollect'), value: 'COLLECT' },
]);

/** 列类型选项 */
const columnTypeOptions = computed(() => [
  { label: t('business.columnTypeString'), value: 'STRING' },
  { label: t('business.columnTypeNumber'), value: 'NUMBER' },
  { label: t('business.columnTypeDate'), value: 'DATE' },
  { label: t('business.columnTypeBoolean'), value: 'BOOLEAN' },
]);

/** 是否为编辑模式 */
const isEditMode = computed(() => !!props.tableData?.id);

/** 打开弹窗 */
async function open(): Promise<void> {
  visible.value = true;
  await nextTick();
  if (isEditMode.value && props.tableData?.tableCode) {
    await loadTableDetail();
  } else {
    // 初始化默认行列
    initDefaultTable();
  }
}

/** 关闭弹窗 */
function close(): void {
  visible.value = false;
  resetState();
  emit('close');
}

/** 重置状态 */
function resetState(): void {
  tableInfo.value = {
    tableCode: '',
    tableName: '',
    description: '',
    category: '',
    hitPolicy: 'FIRST',
  };
  conditionColumns.value = [];
  actionColumns.value = [];
  ruleRows.value = [];
}

/** 初始化默认表结构 */
function initDefaultTable(): void {
  conditionColumns.value = [
    {
      colCode: 'condition1',
      colName: t('business.conditionDefault', { index: 1 }),
      colType: 'STRING',
      operator: '==',
    },
  ];
  actionColumns.value = [
    { colCode: 'action1', colName: t('business.actionDefault', { index: 1 }), colType: 'STRING' },
  ];
  ruleRows.value = [createEmptyRow()];
}

/** 创建空行 */
function createEmptyRow(): Record<string, unknown> {
  const row: Record<string, unknown> = { _id: `row_${Date.now()}_${Math.random()}` };
  conditionColumns.value.forEach((col) => {
    row[`cond_${col.colCode as string}`] = '';
  });
  actionColumns.value.forEach((col) => {
    row[`act_${col.colCode as string}`] = '';
  });
  return row;
}

/** 加载决策表详情 */
async function loadTableDetail(): Promise<void> {
  if (!props.tableData?.tableCode) return;
  loading.value = true;
  try {
    const result = await getDecisionTable({ tableCode: props.tableData.tableCode });
    tableInfo.value = {
      tableCode: result.tableCode ?? '',
      tableName: result.tableName ?? '',
      description: result.description ?? '',
      category: result.category ?? '',
      hitPolicy: result.hitPolicy ?? 'FIRST',
    };
    // TODO: 加载决策表完整定义（条件列、动作列、规则行）
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 添加条件列 */
function addConditionColumn(): void {
  const index = conditionColumns.value.length + 1;
  conditionColumns.value.push({
    colCode: `condition${index}`,
    colName: t('business.conditionDefault', { index }),
    colType: 'STRING',
    operator: '==',
  });
}

/** 添加动作列 */
function addActionColumn(): void {
  const index = actionColumns.value.length + 1;
  actionColumns.value.push({
    colCode: `action${index}`,
    colName: t('business.actionDefault', { index }),
    colType: 'STRING',
  });
}

/** 添加规则行 */
function addRuleRow(): void {
  ruleRows.value.push(createEmptyRow());
}

/** 删除规则行 */
function deleteRuleRow(index: number): void {
  ruleRows.value.splice(index, 1);
}

/** 删除条件列 */
function removeConditionColumn(index: number): void {
  conditionColumns.value.splice(index, 1);
}

/** 删除动作列 */
function removeActionColumn(index: number): void {
  actionColumns.value.splice(index, 1);
}

/** 保存决策表 */
async function handleSave(): Promise<void> {
  if (!tableInfo.value.tableCode || !tableInfo.value.tableName) {
    showToast.warning(t('business.decisionTableCodeNameRequired'));
    return;
  }
  saving.value = true;
  try {
    await saveDecisionTable({
      ...tableInfo.value,
      conditionColumns: conditionColumns.value,
      actionColumns: actionColumns.value,
      rows: ruleRows.value,
    });
    showToast.success($t('operation.save.success'));
    emit('success');
    close();
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    saving.value = false;
  }
}

/** 评估测试 */
async function handleEvaluate(): Promise<void> {
  if (!tableInfo.value.tableCode) {
    showToast.warning(t('business.decisionTableSaveFirst'));
    return;
  }
  evaluateDialogVisible.value = true;
  evaluating.value = true;
  evaluateResults.value = [];
  try {
    const params = evaluateParams.value ? JSON.parse(evaluateParams.value) : {};
    const results = await evaluateDecisionTable({ tableCode: tableInfo.value.tableCode }, params);
    evaluateResults.value = Array.isArray(results) ? results : [results];
  } catch {
    evaluateResults.value = [{ error: t('business.decisionTableEvalFailed') }];
  } finally {
    evaluating.value = false;
  }
}

watch(visible, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      if (isEditMode.value && props.tableData?.tableCode) {
        loadTableDetail();
      } else {
        initDefaultTable();
      }
    });
  }
});

/** 暴露 open/close 供父组件通过模板 ref 调用 */
defineExpose({ open, close });
</script>

<template>
  <YdDialog
    v-model="visible"
    :title="isEditMode ? t('business.decisionTableEditTitle') : t('business.decisionTableCreateTitle')"
    width="1200px"
    :close-on-click-modal="false"
    :show-close="true"
    @close="close"
  >
    <div v-loading="loading" class="designer-container">
      <!-- 基本信息 -->
      <YdForm label-width="100px" class="mb-4">
        <div class="grid grid-cols-2 gap-5">
          <YdFormItem :label="t('business.decisionTableCode')" required>
            <YdInput
              v-model="tableInfo.tableCode"
              :placeholder="t('business.decisionTableCodePlaceholder')"
              :disabled="isEditMode"
            />
          </YdFormItem>
          <YdFormItem :label="t('business.decisionTableName')" required>
            <YdInput v-model="tableInfo.tableName" :placeholder="t('business.namePlaceholder')" />
          </YdFormItem>
          <YdFormItem :label="t('business.category')">
            <YdInput v-model="tableInfo.category" :placeholder="t('business.categoryPlaceholder')" />
          </YdFormItem>
          <YdFormItem :label="t('business.hitPolicy')">
            <YdSelect v-model="tableInfo.hitPolicy" :placeholder="t('business.hitPolicyPlaceholder')">
              <YdSelectItem
                v-for="opt in hitPolicyOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </YdSelect>
          </YdFormItem>
          <YdFormItem :label="t('business.description')" class="col-span-2">
            <YdInput
              v-model="tableInfo.description"
              type="textarea"
              :rows="2"
              :placeholder="t('business.descriptionPlaceholder')"
            />
          </YdFormItem>
        </div>
      </YdForm>

      <!-- 决策表编辑区 -->
      <div class="table-editor">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium">{{ t('business.decisionTableRules') }}</span>
          <div class="flex gap-2">
            <YdButton size="small" @click="addConditionColumn">
              {{ t('business.addConditionColumn') }}
            </YdButton>
            <YdButton size="small" @click="addActionColumn">
              {{ t('business.addActionColumn') }}
            </YdButton>
            <YdButton size="small" type="success" @click="addRuleRow">
              {{ t('business.addRuleRow') }}
            </YdButton>
          </div>
        </div>

        <div class="overflow-auto">
          <YdTable :data="ruleRows" border size="small" style="width: 100%">
            <YdTableColumn type="index" label="#" width="50" />

            <!-- 条件列 -->
            <YdTableColumn
              v-for="(col, colIndex) in conditionColumns"
              :key="`cond_${col.colCode as string}`"
              min-width="150"
            >
              <template #header>
                <div class="flex flex-col items-center gap-1">
                  <span class="text-xs text-blue-600">{{ t('business.conditionColumn') }}</span>
                  <YdInput
                    v-model="col.colName"
                    size="small"
                    class="w-full"
                    :placeholder="t('business.columnNamePlaceholder')"
                  />
                  <div class="flex gap-1">
                    <YdSelect v-model="col.operator" size="small" class="flex-1">
                      <YdSelectItem :label="t('business.operatorEqual')" value="==" />
                      <YdSelectItem :label="t('business.operatorNotEqual')" value="!=" />
                      <YdSelectItem :label="t('business.operatorGreater')" value=">" />
                      <YdSelectItem :label="t('business.operatorLess')" value="<" />
                      <YdSelectItem :label="t('business.operatorGreaterEqual')" value=">=" />
                      <YdSelectItem :label="t('business.operatorLessEqual')" value="<=" />
                      <YdSelectItem :label="t('business.operatorContains')" value="contains" />
                      <YdSelectItem :label="t('business.operatorEmpty')" value="empty" />
                    </YdSelect>
                    <YdButton size="small" type="danger" @click="removeConditionColumn(colIndex)"
                      >×</YdButton
                    >
                  </div>
                </div>
              </template>
              <template #default="{ $index }">
                <YdInput
                  v-model="ruleRows[$index][`cond_${col.colCode as string}`]"
                  size="small"
                  :placeholder="t('business.conditionValuePlaceholder')"
                />
              </template>
            </YdTableColumn>

            <!-- 动作列 -->
            <YdTableColumn
              v-for="(col, colIndex) in actionColumns"
              :key="`act_${col.colCode as string}`"
              min-width="150"
            >
              <template #header>
                <div class="flex flex-col items-center gap-1">
                  <span class="text-xs text-green-600">{{ t('business.actionColumn') }}</span>
                  <YdInput
                    v-model="col.colName"
                    size="small"
                    class="w-full"
                    :placeholder="t('business.columnNamePlaceholder')"
                  />
                  <div class="flex gap-1">
                    <YdSelect v-model="col.colType" size="small" class="flex-1">
                      <YdSelectItem
                        v-for="opt in columnTypeOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </YdSelect>
                    <YdButton size="small" type="danger" @click="removeActionColumn(colIndex)"
                      >×</YdButton
                    >
                  </div>
                </div>
              </template>
              <template #default="{ $index }">
                <YdInput
                  v-model="ruleRows[$index][`act_${col.colCode as string}`]"
                  size="small"
                  :placeholder="t('business.actionValuePlaceholder')"
                />
              </template>
            </YdTableColumn>

            <!-- 操作列 -->
            <YdTableColumn :label="t('business.operation')" width="80" fixed="right">
              <template #default="{ $index }">
                <YdButton size="small" type="danger" link @click="deleteRuleRow($index)">
                  {{ t('business.delete') }}
                </YdButton>
              </template>
            </YdTableColumn>
          </YdTable>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="mt-4 flex justify-end gap-2 border-t pt-4">
        <YdButton @click="handleEvaluate">{{ t('business.decisionTableEvaluate') }}</YdButton>
        <YdButton @click="close">{{ t('business.cancelBtn') }}</YdButton>
        <YdButton type="primary" :loading="saving" @click="handleSave">
          {{ t('page.ruleChainDesigner.save') }}
        </YdButton>
      </div>
    </div>

    <!-- 评估测试弹窗 -->
    <YdDialog v-model="evaluateDialogVisible" :title="t('business.decisionTableEvaluateTitle')" width="600px">
      <YdForm label-width="80px">
        <YdFormItem :label="t('business.inputParams')">
          <YdInput
            v-model="evaluateParams"
            type="textarea"
            :rows="4"
            :placeholder="t('business.evalParamsPlaceholder')"
          />
        </YdFormItem>
      </YdForm>
      <div v-loading="evaluating" class="mt-4">
        <p class="mb-2 text-sm font-medium">{{ t('business.evalResultLabel') }}</p>
        <div v-if="evaluateResults.length === 0" class="py-4 text-center text-gray-400">
          {{ t('business.noEvalResult') }}
        </div>
        <div v-else class="max-h-60 overflow-auto">
          <div
            v-for="(result, index) in evaluateResults"
            :key="index"
            class="mb-2 rounded border bg-gray-50 p-3"
          >
            <!--
              @index-key 评估结果为任意结构 JSON 快照（无稳定业务 ID），
              列表为只读展示且不做重排，index 作为兜底 key 不引发复用错位。
            -->
            <pre class="whitespace-pre-wrap text-xs">{{ JSON.stringify(result, null, 2) }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <YdButton @click="evaluateDialogVisible = false">{{ t('business.rulePackStressClose') }}</YdButton>
      </template>
    </YdDialog>
  </YdDialog>
</template>

<style scoped>
.designer-container {
  max-height: 600px;
  overflow: auto;
}

.table-editor {
  border: 1px solid hsl(var(--border-default));
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.col-span-2 {
  grid-column: span 2;
}
</style>
