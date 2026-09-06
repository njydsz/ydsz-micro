<!--
 * 表元数据管理（列表页）
 *
 * <p>选择数据源查看其下全部表的元数据、刷新表缓存、查看列明细。
 *
 * @path apps/generator-web/src/views/table-meta/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 表元数据管理列表页。
 *
 * <p>选择数据源后加载表列表，支持刷新表缓存、查看列元数据。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, ref } from 'vue';

import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import { ElButton, ElMessage, ElOption, ElSelect } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import {
  listTables,
  refreshTables,
} from '#/api/table-meta';
import type { GenTableMeta } from '#/api/models';
import { listDatasources } from '#/api/datasource';
import type { GenDatasourceRespVO } from '#/api/models';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import ColumnDialog from './column-dialog.vue';

const router = useRouter();
const { t } = useI18n();

defineOptions({ name: 'TableMetaManagement' });

const datasourceList = ref<GenDatasourceRespVO[]>([]);
const selectedDatasourceId = ref<number | undefined>(undefined);
const columnDialogVisible = ref(false);
const selectedTableId = ref<number | undefined>(undefined);
const selectedTableName = ref('');

/** 加载数据源列表 */
async function loadDatasources() {
  try {
    datasourceList.value = await listDatasources();
    if (datasourceList.value.length > 0) {
      const defaultDs = datasourceList.value.find((ds) => ds.defaultFlag);
      selectedDatasourceId.value = defaultDs?.id ?? datasourceList.value[0]?.id;
      if (selectedDatasourceId.value) {
        await gridApi.query();
      }
    }
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 切换数据源 */
async function handleDatasourceChange() {
  await gridApi.query();
}

/** 刷新表缓存 */
async function handleRefreshTables() {
  if (!selectedDatasourceId.value) {
    ElMessage.warning('请先选择数据源');
    return;
  }
  try {
    await refreshTables({ datasourceId: selectedDatasourceId.value });
    ElMessage.success('刷新表缓存成功');
    await gridApi.query();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 查看列元数据 */
function handleViewColumns(row: GenTableMeta) {
  if (!row.id) return;
  selectedTableId.value = row.id;
  selectedTableName.value = row.tableName;
  columnDialogVisible.value = true;
}

const gridOptions: VxeTableGridOptions<GenTableMeta> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'tableName', title: '表名', width: 200 },
    { field: 'comment', title: '表注释', width: 200 },
    { field: 'aliasName', title: '别名', width: 140 },
    { field: 'moduleName', title: '模块名', width: 140 },
    {
      field: 'cachedAt',
      title: '缓存时间',
      width: 170,
      formatter: ({ cellValue }) => (cellValue ? String(cellValue).replace('T', ' ') : '-'),
    },
    {
      field: 'action',
      title: t('common.actions'),
      width: 200,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const table = row as GenTableMeta;
          return h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              {
                size: 'small',
                link: true,
                type: 'primary',
                onClick: () => handleViewColumns(table),
              },
              () => '查看列',
            ),
            h(
              ElButton,
              {
                size: 'small',
                link: true,
                type: 'success',
                onClick: () => handleGotoCodeGen(table),
              },
              () => '去生成',
            ),
          ]);
        },
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 50, pageSizes: [20, 50, 100] },
  toolbarConfig: { refresh: { code: 'query' }, zoom: true },
  proxyConfig: {
    ajax: {
      query: async () => {
        if (!selectedDatasourceId.value) {
          return { items: [], total: 0 };
        }
        const items = await listTables({ datasourceId: selectedDatasourceId.value });
        return { items: items ?? [], total: items?.length ?? 0 };
      },
    },
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 跳转到代码生成页并携带表名 */
function handleGotoCodeGen(row: GenTableMeta) {
  router.push({
    path: '/code-gen/index',
    query: { tableName: row.tableName, datasourceId: String(row.datasourceId ?? '') },
  });
}

onMounted(() => {
  void loadDatasources();
});
</script>

<template>
  <Page auto-content-height>
    <div class="mb-4 flex items-center gap-4">
      <span class="text-sm text-gray-600">选择数据源：</span>
      <ElSelect
        v-model="selectedDatasourceId"
        placeholder="请选择数据源"
        @change="handleDatasourceChange"
      >
        <ElOption
          v-for="ds in datasourceList"
          :key="ds.id"
          :label="`${ds.name} (${ds.jdbcUrl})`"
          :value="ds.id"
        />
      </ElSelect>
      <ElButton type="primary" @click="handleRefreshTables">刷新表缓存</ElButton>
    </div>
    <Grid table-title="表元数据" />
    <ColumnDialog
      v-if="columnDialogVisible"
      v-model:visible="columnDialogVisible"
      :table-meta-id="selectedTableId"
      :table-name="selectedTableName"
    />
  </Page>
</template>
