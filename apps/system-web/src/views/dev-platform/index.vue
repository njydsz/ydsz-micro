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

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

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
    const response = await fetch('/generator/api/generator/datasources');
    const data = await response.json();
    if (data && data.code === 'A00000') {
      datasources.value = data.data;
      const defaultDs = datasources.value.find((ds) => ds.isDefault);
      if (defaultDs) {
        selectedDatasourceId.value = defaultDs.id;
      } else if (datasources.value.length > 0) {
        selectedDatasourceId.value = datasources.value[0].id;
      }
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
    const response = await fetch(
      `/generator/api/generator/tables?datasourceId=${selectedDatasourceId.value}`,
    );
    const data = await response.json();
    if (data && data.code === 'A00000') {
      tables.value = data.data;
    } else {
      tables.value = [];
    }
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
    const response = await fetch(
      `/generator/api/generator/tables/columns?tableMetaId=${tableId}`,
    );
    const data = await response.json();
    if (data && data.code === 'A00000') {
      columns.value = data.data;
    } else {
      columns.value = [];
    }
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
    ElMessage.warning('请先选择数据源和表名');
    return;
  }
  generating.value = true;
  resultFiles.value = [];
  try {
    const response = await fetch('/generator/api/generator/code/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        datasourceId: selectedDatasourceId.value,
        templateGroupId: 1,
        tableName: selectedTableName.value.trim(),
        outputDir: configForm.outputDir,
        conflictStrategy: configForm.conflictStrategy,
        triggeredBy: configForm.author,
      }),
    });
    const data = await response.json();
    if (data && data.code === 'A00000' && data.data) {
      resultFiles.value = data.data.generatedFiles ?? [];
      ElMessage.success(`代码生成完成，共 ${resultFiles.value.length} 个文件`);
      activeTab.value = 'result';
    } else {
      ElMessage.error(data?.msg || '代码生成失败');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : '代码生成请求失败';
    ElMessage.error(msg);
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
  <div class="dev-platform p-4 space-y-4">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">数据源 & 表选择</span>
          <ElTag v-if="selectedDatasourceId" size="small" type="info">
            数据源 #{{ selectedDatasourceId }}
          </ElTag>
        </div>
      </template>

      <ElForm label-width="100px">
        <ElFormItem label="数据源">
          <ElSelect
            v-model="selectedDatasourceId"
            placeholder="请选择数据源"
            :loading="tablesLoading"
            style="width: 100%"
          >
            <ElOption
              v-for="ds in datasources"
              :key="ds.id"
              :value="ds.id"
              :label="ds.name + (ds.isDefault ? '（默认）' : '')"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="选择表">
          <ElSelect
            v-model="selectedTableId"
            placeholder="请先选择数据源，再选择表"
            :disabled="!selectedDatasourceId"
            :loading="tablesLoading"
            @change="onTableSelect"
            style="width: 100%"
          >
            <ElOption
              v-for="tbl in tables"
              :key="tbl.id"
              :value="tbl.id"
              :label="tbl.tableName + (tbl.tableComment ? ' — ' + tbl.tableComment : '')"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 字段预览 -->
    <ElCard v-if="columns.length > 0">
      <template #header>
        <span class="font-medium">
          字段预览 — {{ selectedTableName }} ({{ columns.length }} 列)
        </span>
      </template>
      <ElTable :data="columns" size="small" stripe max-height="300">
        <ElTableColumn prop="columnName" label="列名" min-width="140" />
        <ElTableColumn prop="columnType" label="类型" width="120" />
        <ElTableColumn label="主键" width="60">
          <template #default="{ row }">
            <ElTag v-if="row.pk" type="danger" size="small">PK</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="可空" width="60">
          <template #default="{ row }">
            <ElTag v-if="row.nullable" type="info" size="small">NULL</ElTag>
            <ElTag v-else type="success" size="small">NOT NULL</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="columnComment" label="注释" min-width="160" />
      </ElTable>
    </ElCard>

    <!-- 生成配置 & 操作 -->
    <ElCard>
      <template #header>
        <span class="font-medium">生成配置</span>
      </template>
      <ElForm label-width="100px">
        <ElFormItem label="输出目录">
          <ElInput v-model="configForm.outputDir" placeholder="生成代码的目标目录绝对路径" />
        </ElFormItem>
        <ElFormItem label="作者">
          <ElInput v-model="configForm.author" placeholder="Javadoc 作者" />
        </ElFormItem>
        <ElFormItem label="冲突策略">
          <ElSelect v-model="configForm.conflictStrategy" style="width: 200px">
            <ElOption value="SKIP" label="跳过已存在" />
            <ElOption value="OVERRIDE" label="覆盖" />
            <ElOption value="MERGE" label="合并" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton
            type="primary"
            :loading="generating"
            :disabled="!hasSelectedTable"
            @click="handleGenerate"
          >
            生成代码
          </ElButton>
          <span v-if="!hasSelectedTable" class="ml-3 text-sm text-gray-400">
            请先选择数据源和表
          </span>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 生成结果 -->
    <ElCard v-if="resultFiles.length > 0">
      <template #header>
        <span class="font-medium">生成结果 ({{ resultFiles.length }} 个文件)</span>
      </template>
      <div class="space-y-1 max-h-96 overflow-y-auto">
        <div
          v-for="(file, idx) in resultFiles"
          :key="idx"
          class="flex items-center gap-2 text-sm py-1 border-b border-dashed last:border-b-0"
        >
          <ElTag type="success" size="small">✓</ElTag>
          <code class="text-xs text-gray-600 break-all font-mono">{{ file }}</code>
        </div>
      </div>
    </ElCard>

    <!-- 空态提示 -->
    <ElEmpty
      v-if="!hasSelectedTable && columns.length === 0 && !generating"
      description="请选择数据源和表开始代码生成"
      :image-size="80"
    />
  </div>
</template>
