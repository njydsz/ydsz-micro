<!--
 * Agent 管理（列表页）
 *
 * @path apps/agent-web/src/views/agent/index.vue
 * @author ydsz-team
 * @since 1.0.0
 * @modified 4.0.1 集成 useCrudTable + i18n，消除硬编码中文和空 catch。
-->
<script lang="ts" setup>
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useVbenModal } from '@ydsz/common-ui';
import { ElButton, h } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useCrudTable } from '@ydsz/shared-business';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { deleteAgentApi, getAgentPageApi, type AgentApi } from '#/api/agent';
import AgentForm from './agent-form.vue';

defineOptions({ name: 'AgentManagement' });
const { t } = useI18n();

const crud = useCrudTable({
  fetcher: (query) => getAgentPageApi({ ...query }),
  deleteFetcher: (row) => deleteAgentApi(row.id),
  deleteMessage: (row) => t('agent.confirmDelete', { name: row.agentName }),
});

const gridOptions: VxeGridProps<AgentApi.AgentVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'agentName', title: t('agent.columns.name'), width: 200 },
    { field: 'agentType', title: t('agent.columns.type'), width: 100 },
    { field: 'modelProvider', title: t('agent.columns.provider'), width: 120 },
    { field: 'modelName', title: t('agent.columns.model'), width: 120 },
    { field: 'status', title: t('common.status'), width: 80 },
    { field: 'createTime', title: t('common.createTime'), width: 160 },
    {
      field: 'action', title: t('common.actions'), width: 160, fixed: 'right',
      slots: { default: ({ row }) => h('div', { class: 'flex gap-1' }, [
        h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleEdit(row) }, () => t('common.edit')),
        h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => crud.handleDelete(row) }, () => t('common.delete')),
      ]) },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: { ajax: { query: async ({ page }, formValues) => await getAgentPageApi({ pageNum: page.currentPage, pageSize: page.pageSize, ...formValues }) } },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: { enabled: true, items: [
      { field: 'agentName', title: 'agentName', itemRender: { name: 'Input', props: { placeholder: 'agentName' } } },
  ] },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [AgentFormModal, agentFormApi] = useVbenModal({ connectedComponent: AgentForm });

function handleAdd() { agentFormApi.open(); }
function handleEdit(row: AgentApi.AgentVO) { agentFormApi.setData({ record: row }); agentFormApi.open(); }
</script>
<template>
  <Page auto-content-height>
    <Grid :table-title="t('agent.title')">
      <template #toolbar-tools><ElButton type="primary" @click="handleAdd">{{ t('common.create') }}</ElButton></template>
    </Grid>
    <AgentFormModal @success="gridApi.query()" />
  </Page>
</template>
