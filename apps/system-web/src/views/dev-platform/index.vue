<!--
 * 在线开发平台 — 代码生成快速入口
 *
 * <p>简洁的代码生成配置器，选择数据源和表后可：
 * <ul>
 *   <li>预览生成的代码文件列表</li>
 *   <li>查看表的字段元数据</li>
 *   <li>一键调用后端生成代码到本地目录</li>
 * </ul>
 * 完整功能（历史记录、模板编辑、导入导出）请前往「代码生成器」模块。
 *
 * @path apps/system-web/src/views/dev-platform/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 在线开发平台 — 代码生成快速入口
 * <p>调用后端 ydzz-generator REST API 完成代码预览与生成。
 *
 * @author ydsz-team
 * @since 26.09.08
 */
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { YdBadge, YdButton, YdInput, YdTable, YdTableColumn, YdCard, YdEmptyState, YdForm, YdFormItem, YdSelectItem, YdSelect } from '@ydsz-core/ydsz-ui';

import { showToast } from '@ydsz/notification';

import { requestClient } from '#/api/request';

/** 数据源 */
interface Datasource {
  id: number;
  name: string;
  url?: string;
  username?: string;
  isDefault?: boolean;
}

/** 表元数据 */
interface TableMeta {
  id: number;
  tableName: string;
  tableComment: string;
  engine?: string;
}

/** 列元数据 */
interface ColumnMeta {
  id: number;
  columnName: string;
  columnType: string;
  columnComment: string;
  pk?: boolean;
  nullable?: boolean;
}

/** 代码生成结果（契约 GenResultVO 的本地视图，仅消费生成文件列表） */
interface GenerateResult {
  /** 生成的文件相对路径列表 */
  generatedFiles?: string[];
}

const { t } = useI18n();

const datasources = ref<Datasource[]>([]);
const tables = ref<TableMeta[]>([]);
const columns = ref<ColumnMeta[]>([]);

const selectedDatasourceId = ref<number | null>(null);
const selectedTableId = ref<number | null>(null);
const selectedTableName = ref<string>('');
const tablesLoading = ref(false);
const columnsLoading = ref(false);

const generating = ref(false);
const resultFiles = ref<string[]>([]);
const activeTab = ref('select');

const configForm = reactive({
  outputDir: 'D:/Code/open/ydsz-cloud',
  author: 'ydsz-team',
  conflictStrategy: 'SKIP',
});

/**
 * 加载数据源列表
 */
async function loadDatasources() {
  try {
    // 统一请求客户端（规范 §6.1），路径对齐契约 /api/generator/datasources
    datasources.value = await requestClient.get<Datasource[]>(
      '/generator/datasources',
    );
    const defaultDs = datasources.value.find((ds) => ds.isDefault);
    if (defaultDs) {
      selectedDatasourceId.value = defaultDs.id;
    } else if (datasources.value.length > 0) {
      selectedDatasourceId.value = datasources.value[0].id;
    }
  } catch {
    // 数据源加载失败时展示空列表
    datasources.value = [];
  }
}

/**
 * 数据源切换时加载表列表
 */
async function loadTables() {
  if (selectedDatasourceId.value == null) {
    tables.value = [];
    return;
  }
  tablesLoading.value = true;
  columns.value = [];
  selectedTableId.value = null;
  selectedTableName.value = '';
  try {
    tables.value = await requestClient.get<TableMeta[]>('/generator/tables', {
      params: { datasourceId: selectedDatasourceId.value },
    });
  } catch {
    tables.value = [];
  } finally {
    tablesLoading.value = false;
  }
}

/**
 * 表选择时加载字段元数据
 */
async function onTableSelect(tableId: number) {
  columnsLoading.value = true;
  const table = tables.value.find((t) => t.id === tableId);
  selectedTableName.value = table?.tableName ?? '';
  try {
    columns.value = await requestClient.get<ColumnMeta[]>(
      '/generator/tables/columns',
      { params: { tableMetaId: tableId } },
    );
  } catch {
    columns.value = [];
  } finally {
    columnsLoading.value = false;
  }
}

/**
 * 触发代码生成
 */
async function handleGenerate() {
  if (!selectedDatasourceId.value || !selectedTableName.value.trim()) {
    showToast.warning(t('devPlatform.selectDsAndTableFirst'));
    return;
  }
  generating.value = true;
  resultFiles.value = [];
  try {
    const result = await requestClient.post<GenerateResult>(
      '/generator/code/generate',
      {
        datasourceId: selectedDatasourceId.value,
        templateGroupId: 1,
        tableName: selectedTableName.value.trim(),
        outputDir: configForm.outputDir,
        conflictStrategy: configForm.conflictStrategy,
        triggeredBy: configForm.author,
      },
    );
    if (result) {
      resultFiles.value = result.generatedFiles ?? [];
      showToast.success(t('devPlatform.generateSuccess', { count: resultFiles.value.length }));
      activeTab.value = 'result';
    } else {
      showToast.error(t('devPlatform.generateFailed'));
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : t('devPlatform.requestFailed');
    showToast.error(msg);
  } finally {
    generating.value = false;
  }
}

// 数据源变化时自动加载表
watch(selectedDatasourceId, () => {
  loadTables();
});

// 初始化加载数据源
loadDatasources();

/** 是否已选择表 */
const hasSelectedTable = computed(() => selectedTableId.value != null);
</script>

<template>
  <div class="dev-platform p-5 space-y-4">
    <YdCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ t('devPlatform.datasourceSection') }}</span>
          <YdBadge v-if="selectedDatasourceId" variant="secondary">
            {{ t('devPlatform.datasourceBadge', { id: selectedDatasourceId }) }}
          </YdBadge>
        </div>
      </template>

      <YdForm label-width="100px">
        <YdFormItem :label="t('devPlatform.datasourceLabel')">
          <YdSelect
            v-model="selectedDatasourceId"
            :placeholder="t('devPlatform.datasourcePlaceholder')"
            :loading="tablesLoading"
            style="width: 100%"
          >
            <YdSelectItem
              v-for="ds in datasources"
              :key="ds.id"
              :value="ds.id"
              :label="ds.name + (ds.isDefault ? t('devPlatform.defaultSuffix') : '')"
            />
          </YdSelect>
        </YdFormItem>
        <YdFormItem :label="t('devPlatform.selectTableLabel')">
          <YdSelect
            v-model="selectedTableId"
            :placeholder="t('devPlatform.selectTablePlaceholder')"
            :disabled="!selectedDatasourceId"
            :loading="tablesLoading"
            @change="onTableSelect"
            style="width: 100%"
          >
            <YdSelectItem
              v-for="tbl in tables"
              :key="tbl.id"
              :value="tbl.id"
              :label="tbl.tableName + (tbl.tableComment ? ' — ' + tbl.tableComment : '')"
            />
          </YdSelect>
        </YdFormItem>
      </YdForm>
    </YdCard>

    <!-- 字段预览 -->
    <YdCard v-if="columns.length > 0">
      <template #header>
        <span class="font-medium">
          {{ t('devPlatform.columnsPreview', { table: selectedTableName, count: columns.length }) }}
        </span>
      </template>
      <YdTable :data="columns" size="small" stripe max-height="300">
        <YdTableColumn prop="columnName" :label="t('devPlatform.colColumnName')" min-width="140" />
        <YdTableColumn prop="columnType" :label="t('devPlatform.colColumnType')" width="120" />
        <YdTableColumn :label="t('devPlatform.colPrimaryKey')" width="60">
          <template #default="{ row }">
            <YdBadge v-if="row.pk" variant="destructive">PK</YdBadge>
          </template>
        </YdTableColumn>
        <YdTableColumn :label="t('devPlatform.colNullable')" width="60">
          <template #default="{ row }">
            <YdBadge v-if="row.nullable" variant="secondary">NULL</YdBadge>
            <YdBadge v-else>NOT NULL</YdBadge>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="columnComment" :label="t('devPlatform.colComment')" min-width="160" />
      </YdTable>
    </YdCard>

    <!-- 生成配置 & 操作 -->
    <YdCard>
      <template #header>
        <span class="font-medium">{{ t('devPlatform.generateConfig') }}</span>
      </template>
      <YdForm label-width="100px">
        <YdFormItem :label="t('devPlatform.outputDirLabel')">
          <YdInput v-model="configForm.outputDir" :placeholder="t('devPlatform.outputDirPlaceholder')" />
        </YdFormItem>
        <YdFormItem :label="t('devPlatform.authorLabel')">
          <YdInput v-model="configForm.author" :placeholder="t('devPlatform.authorPlaceholder')" />
        </YdFormItem>
        <YdFormItem :label="t('devPlatform.conflictPolicy')">
          <YdSelect v-model="configForm.conflictStrategy" style="width: 200px">
            <YdSelectItem value="SKIP" :label="t('devPlatform.policySkip')" />
            <YdSelectItem value="OVERRIDE" :label="t('devPlatform.policyOverride')" />
            <YdSelectItem value="MERGE" :label="t('devPlatform.policyMerge')" />
          </YdSelect>
        </YdFormItem>
        <YdFormItem>
          <YdButton
            :loading="generating"
            :disabled="!hasSelectedTable"
            @click="handleGenerate"
          >
        {{ t('devPlatform.generateCode') }}
          </YdButton>
          <span v-if="!hasSelectedTable" class="ml-3 text-sm text-gray-400">
        {{ t('devPlatform.selectDsAndTableFirst') }}
          </span>
        </YdFormItem>
      </YdForm>
    </YdCard>

    <!-- 生成结果 -->
    <YdCard v-if="resultFiles.length > 0">
      <template #header>
        <span class="font-medium">{{ t('devPlatform.resultSection', { count: resultFiles.length }) }}</span>
      </template>
      <div class="space-y-1 max-h-96 overflow-y-auto">
        <div
          v-for="(file, idx) in resultFiles"
          :key="file ?? idx"
          class="flex items-center gap-2 text-sm py-1 border-b border-dashed last:border-b-0"
        >
          <YdBadge variant="default" class="h-5 px-1 text-[10px]">✓</YdBadge>
          <code class="text-xs text-gray-600 break-all font-mono">{{ file }}</code>
        </div>
      </div>
    </YdCard>

    <!-- 空态提示 -->
    <YdEmptyState
      v-if="!hasSelectedTable && columns.length === 0 && !generating"
      :description="t('devPlatform.emptyHint')"
      :image-size="80"
    />
  </div>
</template>
