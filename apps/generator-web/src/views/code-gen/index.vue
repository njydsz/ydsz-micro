<!--
 * 代码生成（主面板）
 *
 * <p>选择数据源、模板分组和表名，预览代码、单表生成、全量生成。
 *
 * @path apps/generator-web/src/views/code-gen/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
/**
 * 代码生成主面板。
 *
 * <p>选择数据源 → 模板分组 → 表名 → 预览 → 正式生成，支持全量模式。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, reactive, ref, watch } from 'vue';

import { useRoute } from 'vue-router';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { generate, generateAll, preview } from '#/api/code-gen';
import { listDatasources } from '#/api/datasource';
import type { GenDatasourceRespVO } from '#/api/models';
import { getActiveGroup, listGroups } from '#/api/template';
import type { GenTemplateGroup } from '#/api/models';
import { listTables } from '#/api/table-meta';
import type { CodePreviewVO, GenResultVO } from '#/api/models';

import CodePreviewDialog from './code-preview-dialog.vue';

const route = useRoute();

defineOptions({ name: 'CodeGenManagement' });

// ══════ 数据源 / 分组 / 表 选择 ══════

const datasourceList = ref<GenDatasourceRespVO[]>([]);
const groupList = ref<GenTemplateGroup[]>([]);
const tableList = ref<string[]>([]);
const selectedDatasourceId = ref<number | undefined>(undefined);
const selectedGroupId = ref<number | undefined>(undefined);
const selectedTableName = ref('');
const tablesLoading = ref(false);

// ══════ 生成参数 ══════

const genForm = reactive<{
  outputDir: string;
  conflictStrategy: 'SKIP' | 'OVERRIDE' | 'MERGE';
  triggeredBy: string;
}>({
  outputDir: 'D:/Code/open/ydsz-cloud',
  conflictStrategy: 'SKIP',
  triggeredBy: '',
});

const previewData = ref<CodePreviewVO[]>([]);
const previewLoading = ref(false);
const previewDialogVisible = ref(false);

const generating = ref(false);
const genResult = ref<GenResultVO | null>(null);

const activeTab = ref('config');

// ══════ 全量模式 ══════

const batchGenerating = ref(false);
const batchResult = ref<GenResultVO | null>(null);

// ══════ 数据加载 ══════

async function loadDatasources() {
  datasourceList.value = await listDatasources();
}

async function loadGroups() {
  groupList.value = await listGroups();
  // 激活分组作为默认
  try {
    const activeGroup = await getActiveGroup();
    if (activeGroup?.id) {
      selectedGroupId.value = activeGroup.id;
    }
  } catch {
    // 如果只有一个分组则默认选中
    if (groupList.value.length === 1) {
      selectedGroupId.value = groupList.value[0]?.id;
    }
  }
}

async function loadTablesForDatasource() {
  if (!selectedDatasourceId.value) {
    tableList.value = [];
    return;
  }
  tablesLoading.value = true;
  try {
    const tables = await listTables({ datasourceId: selectedDatasourceId.value });
    tableList.value = tables.map((t) => t.tableName);
  } finally {
    tablesLoading.value = false;
  }
}

watch(
  () => selectedDatasourceId.value,
  () => {
    void loadTablesForDatasource();
  },
);

onMounted(async () => {
  await loadDatasources();
  await loadGroups();
  const queryDsId = route.query.datasourceId;
  const queryTableName = route.query.tableName;
  if (queryDsId) {
    selectedDatasourceId.value = Number(queryDsId);
  } else if (datasourceList.value.length > 0) {
    const defaultDs = datasourceList.value.find((ds) => ds.defaultFlag);
    selectedDatasourceId.value = defaultDs?.id ?? datasourceList.value[0]?.id;
  }
  if (queryTableName && typeof queryTableName === 'string') {
    selectedTableName.value = queryTableName;
  }
});

// ══════ 操作 ══════

/** 预览代码 */
async function handlePreview() {
  if (!validateSelection()) return;
  previewLoading.value = true;
  previewData.value = [];
  try {
    previewData.value = await preview({
      datasourceId: selectedDatasourceId.value!,
      templateGroupId: selectedGroupId.value!,
      tableName: selectedTableName.value,
    });
    previewDialogVisible.value = true;
  } finally {
    previewLoading.value = false;
  }
}

/** 单表生成 */
async function handleGenerate() {
  if (!validateSelection()) return;
  if (!genForm.outputDir.trim()) {
    ElMessage.warning('请配置输出目录');
    return;
  }
  generating.value = true;
  genResult.value = null;
  try {
    genResult.value = await generate({
      datasourceId: selectedDatasourceId.value!,
      templateGroupId: selectedGroupId.value!,
      tableName: selectedTableName.value,
      outputDir: genForm.outputDir,
      conflictStrategy: genForm.conflictStrategy,
      triggeredBy: genForm.triggeredBy || undefined,
    });
    ElMessage.success(
      `生成完成！成功 ${genResult.value.successCount ?? 0} 个，跳过 ${genResult.value.skipCount ?? 0} 个，失败 ${genResult.value.failCount ?? 0} 个`,
    );
  } finally {
    generating.value = false;
  }
}

/** 全量生成 */
async function handleGenerateAll() {
  if (!selectedDatasourceId.value || !selectedGroupId.value) {
    ElMessage.warning('请选择数据源和模板分组');
    return;
  }
  if (!genForm.outputDir.trim()) {
    ElMessage.warning('请配置输出目录');
    return;
  }
  batchGenerating.value = true;
  batchResult.value = null;
  try {
    batchResult.value = await generateAll({
      datasourceId: selectedDatasourceId.value,
      templateGroupId: selectedGroupId.value,
      outputDir: genForm.outputDir,
      conflictStrategy: genForm.conflictStrategy,
      triggeredBy: genForm.triggeredBy || undefined,
    });
    ElMessage.success(
      `全量生成完成！成功 ${batchResult.value.successCount ?? 0} 个，跳过 ${batchResult.value.skipCount ?? 0} 个，失败 ${batchResult.value.failCount ?? 0} 个`,
    );
  } finally {
    batchGenerating.value = false;
  }
}

/** 校验必要选择 */
function validateSelection(): boolean {
  if (!selectedDatasourceId.value) {
    ElMessage.warning('请选择数据源');
    return false;
  }
  if (!selectedGroupId.value) {
    ElMessage.warning('请选择模板分组');
    return false;
  }
  if (!selectedTableName.value.trim()) {
    ElMessage.warning('请选择或输入表名');
    return false;
  }
  return true;
}
</script>

<template>
  <div class="code-gen p-4">
    <ElTabs v-model="activeTab">
      <!-- ═══ 生成配置 Tab ═══ -->
      <ElTabPane label="生成配置" name="config">
        <ElCard class="mt-4" shadow="hover">
          <template #header>
            <div class="flex items-center gap-2">
              <span class="font-medium">数据源与模板</span>
            </div>
          </template>
          <ElForm label-width="120px">
            <ElFormItem label="数据源">
              <ElSelect
                v-model="selectedDatasourceId"
                placeholder="选择数据源"
                style="width: 100%"
              >
                <ElOption
                  v-for="ds in datasourceList"
                  :key="ds.id"
                  :label="`${ds.name} (${ds.dialect})`"
                  :value="ds.id"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="模板分组">
              <ElSelect
                v-model="selectedGroupId"
                placeholder="选择模板分组"
                style="width: 100%"
              >
                <ElOption
                  v-for="group in groupList"
                  :key="group.id"
                  :label="`${group.name}${group.active ? ' (当前激活)' : ''}`"
                  :value="group.id"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="目标表名">
              <ElSelect
                v-model="selectedTableName"
                :loading="tablesLoading"
                :allow-create="true"
                :filterable="true"
                placeholder="选择或输入表名"
                style="width: 100%"
              >
                <ElOption
                  v-for="t in tableList"
                  :key="t"
                  :label="t"
                  :value="t"
                />
              </ElSelect>
            </ElFormItem>
          </ElForm>
        </ElCard>

        <ElCard class="mt-4" shadow="hover">
          <template #header>
            <span class="font-medium">生成参数</span>
          </template>
          <ElForm label-width="120px">
            <ElFormItem label="输出目录">
              <ElInput
                v-model="genForm.outputDir"
                placeholder="生成代码的目标目录绝对路径"
              />
            </ElFormItem>
            <ElFormItem label="冲突策略">
              <ElRadioGroup v-model="genForm.conflictStrategy">
                <ElRadioButton label="SKIP">跳过（推荐）</ElRadioButton>
                <ElRadioButton label="OVERRIDE">覆盖并备份</ElRadioButton>
                <ElRadioButton label="MERGE">智能合并</ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>
            <ElFormItem label="触发人">
              <ElInput
                v-model="genForm.triggeredBy"
                placeholder="可选，记录在生成历史中"
              />
            </ElFormItem>
            <ElFormItem>
              <div class="flex gap-2">
                <ElButton
                  type="info"
                  :loading="previewLoading"
                  @click="handlePreview"
                >
                  预览代码
                </ElButton>
                <ElButton
                  type="primary"
                  :loading="generating"
                  @click="handleGenerate"
                >
                  生成当前表
                </ElButton>
                <ElButton
                  type="success"
                  :loading="batchGenerating"
                  @click="handleGenerateAll"
                >
                  全量生成（全部表）
                </ElButton>
              </div>
            </ElFormItem>
          </ElForm>
        </ElCard>

        <!-- 生成结果展示 -->
        <ElCard v-if="genResult || batchResult" class="mt-4" shadow="hover">
          <template #header>
            <span class="font-medium">生成结果</span>
          </template>
          <div class="grid grid-cols-4 gap-4 text-center">
            <div class="p-3 bg-gray-50 rounded">
              <div class="text-2xl font-bold text-blue-500">
                {{ (genResult ?? batchResult)?.fileCount ?? 0 }}
              </div>
              <div class="text-sm text-gray-500">总文件数</div>
            </div>
            <div class="p-3 bg-gray-50 rounded">
              <div class="text-2xl font-bold text-green-500">
                {{ (genResult ?? batchResult)?.successCount ?? 0 }}
              </div>
              <div class="text-sm text-gray-500">成功</div>
            </div>
            <div class="p-3 bg-gray-50 rounded">
              <div class="text-2xl font-bold text-yellow-500">
                {{ (genResult ?? batchResult)?.skipCount ?? 0 }}
              </div>
              <div class="text-sm text-gray-500">跳过</div>
            </div>
            <div class="p-3 bg-gray-50 rounded">
              <div class="text-2xl font-bold text-red-500">
                {{ (genResult ?? batchResult)?.failCount ?? 0 }}
              </div>
              <div class="text-sm text-gray-500">失败</div>
            </div>
          </div>
        </ElCard>
      </ElTabPane>
    </ElTabs>

    <CodePreviewDialog
      v-if="previewDialogVisible"
      v-model:visible="previewDialogVisible"
      :preview-list="previewData"
    />
  </div>
</template>

<style scoped>
.code-gen {
  max-width: 1000px;
}
</style>
