<!--
 * 数据源管理（列表页）
 *
 * <p>CRUD 数据源配置，测试数据库连接。
 *
 * @path apps/generator-web/src/views/datasource/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 数据源管理列表页。
 *
 * <p>数据源 CRUD + 连接测试功能。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, ref } from 'vue';

import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page, useYDSZModal } from '@ydsz/common-ui';

import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { useI18n } from 'vue-i18n';

import {
  createDatasource,
  deleteDatasource,
  listDatasources,
  testConnection,
  updateDatasource,
} from '#/api/datasource';
import type { GenDatasource, GenDatasourceRespVO } from '#/api/models';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import DatasourceForm from './datasource-form.vue';

const { t } = useI18n();

defineOptions({ name: 'DatasourceManagement' });

const dataList = ref<GenDatasourceRespVO[]>([]);
const testingId = ref<number | undefined>(undefined);

const gridOptions: VxeTableGridOptions<GenDatasourceRespVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'name', title: '数据源名称', width: 150 },
    { field: 'jdbcUrl', title: 'JDBC URL', minWidth: 250 },
    { field: 'username', title: '用户名', width: 120 },
    { field: 'dialect', title: '方言', width: 100 },
    {
      field: 'defaultFlag',
      title: '默认',
      width: 70,
      slots: {
        default: ({ row }) => {
          const ds = row as GenDatasourceRespVO;
          return ds.defaultFlag
            ? h(ElTag, { type: 'success', size: 'small' }, () => '是')
            : h(ElTag, { type: 'info', size: 'small' }, () => '否');
        },
      },
    },
    { field: 'description', title: '描述', width: 150 },
    {
      field: 'createdAt',
      title: '创建时间',
      width: 160,
      formatter: ({ cellValue }) => (cellValue ? String(cellValue).replace('T', ' ') : '-'),
    },
    {
      field: 'action',
      title: t('common.actions'),
      width: 280,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const ds = row as GenDatasourceRespVO;
          return h('div', { class: 'flex gap-1' }, [
            h(
              ElButton,
              {
                size: 'small',
                link: true,
                type: 'success',
                loading: testingId.value === ds.id,
                onClick: () => handleTestConnection(ds),
              },
              () => '测试连接',
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(ds) },
              () => t('common.edit'),
            ),
            h(
              ElButton,
              { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(ds) },
              () => t('common.delete'),
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
        const items = await listDatasources();
        return { items: items ?? [], total: items?.length ?? 0 };
      },
    },
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [DatasourceFormModal, datasourceFormApi] = useYDSZModal({
  connectedComponent: DatasourceForm,
});

/**
 * 新增数据源。
 *
 * <p>重置表单数据并打开数据源新增弹窗。
 */
function handleAdd() {
  datasourceFormApi.setData({ record: null });
  datasourceFormApi.open();
}

/**
 * 编辑数据源。
 *
 * <p>将当前行数据填充到表单并打开数据源编辑弹窗。
 *
 * @param row - 待编辑的数据源行
 */
function handleEdit(row: GenDatasourceRespVO) {
  const record: GenDatasource = {
    id: row.id,
    name: row.name,
    jdbcUrl: row.jdbcUrl,
    username: row.username,
    password: '',
    dialect: row.dialect,
    defaultFlag: row.defaultFlag,
    description: row.description,
  };
  datasourceFormApi.setData({ record });
  datasourceFormApi.open();
}

async function handleTestConnection(row: GenDatasourceRespVO) {
  if (!row.id) return;
  testingId.value = row.id;
  try {
    const success = await testConnection({
      id: row.id,
      name: row.name,
      jdbcUrl: row.jdbcUrl,
      username: row.username,
      password: '',
      dialect: row.dialect,
    });
    if (success) {
      ElMessage.success('连接成功');
    } else {
      ElMessage.error('连接失败，请检查配置');
    }
  } catch {
    ElMessage.error('连接测试请求失败');
  } finally {
    testingId.value = undefined;
  }
}

/**
 * 删除数据源。
 *
 * <p>弹出二次确认对话框，确认后调用后端删除接口，成功后刷新列表。
 *
 * @param row - 待删除的数据源行
 */
async function handleDelete(row: GenDatasourceRespVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定删除数据源「${row.name}」吗？`, '删除确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await deleteDatasource({ id: row.id });
    ElMessage.success('删除成功');
    await gridApi.query();
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 表单提交成功回调 */
async function handleFormSubmit(formData: GenDatasource) {
  if (formData.id) {
    await updateDatasource(formData);
    ElMessage.success('更新成功');
  } else {
    await createDatasource(formData);
    ElMessage.success('创建成功');
  }
  await gridApi.query();
}

onMounted(() => {
  dataList.value = [];
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="数据源管理">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">{{ t('common.create') }}</ElButton>
      </template>
    </Grid>
    <DatasourceFormModal @submit="handleFormSubmit" @success="gridApi.query()" />
  </Page>
</template>
