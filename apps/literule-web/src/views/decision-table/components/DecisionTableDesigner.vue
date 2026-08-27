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
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';
import { computed, nextTick, ref, watch } from 'vue';
import {
  type DecisionTableDefinitionVO,
  type DecisionTableVO,
} from '#/api/models';
import { evaluateDecisionTable, getDecisionTable, saveDecisionTable } from '#/api/ruleDecisionTable';

interface Props {
  /** 决策表数据（编辑时传入） */
  tableData?: DecisionTableVO | null;
}

const props = withDefaults(defineProps<Props>(), {
  tableData: null,
});

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
const hitPolicyOptions = [
  { label: '首条匹配', value: 'FIRST' },
  { label: '全部匹配', value: 'ALL' },
  { label: '唯一匹配', value: 'UNIQUE' },
  { label: '优先级', value: 'PRIORITY' },
  { label: '收集', value: 'COLLECT' },
];

/** 列类型选项 */
const columnTypeOptions = [
  { label: '字符串', value: 'STRING' },
  { label: '数字', value: 'NUMBER' },
  { label: '日期', value: 'DATE' },
  { label: '布尔', value: 'BOOLEAN' },
];

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
    { colCode: 'condition1', colName: '条件1', colType: 'STRING', operator: '==' },
  ];
  actionColumns.value = [
    { colCode: 'action1', colName: '动作1', colType: 'STRING' },
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
    colName: `条件${index}`,
    colType: 'STRING',
    operator: '==',
  });
}

/** 添加动作列 */
function addActionColumn(): void {
  const index = actionColumns.value.length + 1;
  actionColumns.value.push({
    colCode: `action${index}`,
    colName: `动作${index}`,
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
    ElMessage.warning('请填写决策表编码和名称');
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
    ElMessage.success('保存成功');
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
    ElMessage.warning('请先保存决策表');
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
    evaluateResults.value = [{ error: '评估失败，请检查输入参数格式' }];
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
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="isEditMode ? '编辑决策表' : '新增决策表'"
    width="1200px"
    :close-on-click-modal="false"
    :show-close="true"
    @close="close"
  >
    <div v-loading="loading" class="designer-container">
      <!-- 基本信息 -->
      <ElForm label-width="100px" class="mb-4">
        <div class="grid grid-cols-2 gap-4">
          <ElFormItem label="决策表编码" required>
            <ElInput v-model="tableInfo.tableCode" placeholder="请输入编码" :disabled="isEditMode" />
          </ElFormItem>
          <ElFormItem label="决策表名称" required>
            <ElInput v-model="tableInfo.tableName" placeholder="请输入名称" />
          </ElFormItem>
          <ElFormItem label="分类">
            <ElInput v-model="tableInfo.category" placeholder="请输入分类" />
          </ElFormItem>
          <ElFormItem label="命中策略">
            <ElSelect v-model="tableInfo.hitPolicy" placeholder="请选择命中策略">
              <ElOption
                v-for="opt in hitPolicyOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="描述" class="col-span-2">
            <ElInput v-model="tableInfo.description" type="textarea" :rows="2" placeholder="请输入描述" />
          </ElFormItem>
        </div>
      </ElForm>

      <!-- 决策表编辑区 -->
      <div class="table-editor">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium">决策表规则</span>
          <div class="flex gap-2">
            <ElButton size="small" @click="addConditionColumn">添加条件列</ElButton>
            <ElButton size="small" @click="addActionColumn">添加动作列</ElButton>
            <ElButton size="small" type="success" @click="addRuleRow">添加规则行</ElButton>
          </div>
        </div>

        <div class="overflow-auto">
          <ElTable :data="ruleRows" border size="small" style="width: 100%">
            <ElTableColumn type="index" label="#" width="50" />
            
            <!-- 条件列 -->
            <ElTableColumn
              v-for="(col, colIndex) in conditionColumns"
              :key="`cond_${col.colCode as string`}"
              min-width="150"
            >
              <template #header>
                <div class="flex flex-col items-center gap-1">
                  <span class="text-xs text-blue-600">条件</span>
                  <ElInput
                    v-model="col.colName"
                    size="small"
                    class="w-full"
                    placeholder="列名"
                  />
                  <div class="flex gap-1">
                    <ElSelect v-model="col.operator" size="small" class="flex-1">
                      <ElOption label="等于" value="==" />
                      <ElOption label="不等于" value="!=" />
                      <ElOption label="大于" value=">" />
                      <ElOption label="小于" value="<" />
                      <ElOption label="大于等于" value=">=" />
                      <ElOption label="小于等于" value="<=" />
                      <ElOption label="包含" value="contains" />
                      <ElOption label="为空" value="empty" />
                    </ElSelect>
                    <ElButton size="small" type="danger" @click="removeConditionColumn(colIndex)">×</ElButton>
                  </div>
                </div>
              </template>
              <template #default="{ $index }">
                <ElInput
                  v-model="ruleRows[$index][`cond_${col.colCode as string}`]"
                  size="small"
                  placeholder="输入条件值"
                />
              </template>
            </ElTableColumn>

            <!-- 动作列 -->
            <ElTableColumn
              v-for="(col, colIndex) in actionColumns"
              :key="`act_${col.colCode as string`}"
              min-width="150"
            >
              <template #header>
                <div class="flex flex-col items-center gap-1">
                  <span class="text-xs text-green-600">动作</span>
                  <ElInput
                    v-model="col.colName"
                    size="small"
                    class="w-full"
                    placeholder="列名"
                  />
                  <div class="flex gap-1">
                    <ElSelect v-model="col.colType" size="small" class="flex-1">
                      <ElOption
                        v-for="opt in columnTypeOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </ElSelect>
                    <ElButton size="small" type="danger" @click="removeActionColumn(colIndex)">×</ElButton>
                  </div>
                </div>
              </template>
              <template #default="{ $index }">
                <ElInput
                  v-model="ruleRows[$index][`act_${col.colCode as string}`]"
                  size="small"
                  placeholder="输入动作值"
                />
              </template>
            </ElTableColumn>

            <!-- 操作列 -->
            <ElTableColumn label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <ElButton size="small" type="danger" link @click="deleteRuleRow($index)">
                  删除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="mt-4 flex justify-end gap-2 border-t pt-4">
        <ElButton @click="handleEvaluate">评估测试</ElButton>
        <ElButton @click="close">取消</ElButton>
        <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
      </div>
    </div>

    <!-- 评估测试弹窗 -->
    <ElDialog v-model="evaluateDialogVisible" title="评估测试" width="600px">
      <ElForm label-width="80px">
        <ElFormItem label="输入参数">
          <ElInput
            v-model="evaluateParams"
            type="textarea"
            :rows="4"
            placeholder='请输入JSON格式参数，如：{"age": 18, "level": "VIP"}'
          />
        </ElFormItem>
      </ElForm>
      <div v-loading="evaluating" class="mt-4">
        <p class="mb-2 text-sm font-medium">评估结果：</p>
        <div v-if="evaluateResults.length === 0" class="py-4 text-center text-gray-400">
          暂无结果
        </div>
        <div v-else class="max-h-60 overflow-auto">
          <div
            v-for="(result, index) in evaluateResults"
            :key="index"
            class="mb-2 rounded border bg-gray-50 p-3"
          >
            <pre class="whitespace-pre-wrap text-xs">{{ JSON.stringify(result, null, 2) }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <ElButton @click="evaluateDialogVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </ElDialog>
</template>

<style scoped>
.designer-container {
  max-height: 600px;
  overflow: auto;
}

.table-editor {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.col-span-2 {
  grid-column: span 2;
}
</style>
