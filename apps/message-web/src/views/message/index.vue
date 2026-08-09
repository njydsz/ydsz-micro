<!--
 * 消息发送记录列表页组件
 *
 * @path apps/message-web/src/views/message/index.vue
 * @author ydsz-team
 * @since 1.0.0
 * @modified 4.0.1 集成 useCrudTable + i18n。
-->
<script lang="ts" setup>
/**
 * 消息（列表页）
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useVbenModal } from '@ydsz/common-ui';
import { ElButton, h } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useCrudTable } from '@ydsz/shared-business';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { deleteMessageApi, getMessagePageApi, type MessageApi } from '#/api/message';
import MessageForm from './message-form.vue';

defineOptions({ name: 'MessageManagement' });
const { t } = useI18n();

const crud = useCrudTable({
  fetcher: (query) => getMessagePageApi({ ...query }),
  deleteFetcher: (row) => deleteMessageApi(row.id),
  deleteMessage: (row) => t('message.confirmDelete', { id: row.messageId }),
});

const gridOptions: VxeGridProps<MessageApi.MessageVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'messageId', title: t('message.columns.id'), width: 150 },
    { field: 'channel', title: t('message.columns.channel'), width: 100 },
    { field: 'recipient', title: t('message.columns.recipient'), width: 150 },
    { field: 'subject', title: t('message.columns.subject'), width: 200 },
    { field: 'status', title: t('common.status'), width: 100 },
    { field: 'sendTime', title: t('message.columns.sendTime'), width: 160 },
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
  proxyConfig: { ajax: { query: async ({ page }, formValues) => await getMessagePageApi({ pageNum: page.currentPage, pageSize: page.pageSize, ...formValues }) } },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: { enabled: true, items: [
      { field: 'channel', title: 'channel', itemRender: { name: 'Input', props: { placeholder: 'channel' } } },
      { field: 'status', title: 'status', itemRender: { name: 'Input', props: { placeholder: 'status' } } },
  ] },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
const [MessageFormModal, messageFormApi] = useVbenModal({ connectedComponent: MessageForm });
function handleAdd() { messageFormApi.open(); }
function handleEdit(row: MessageApi.MessageVO) { messageFormApi.setData({ record: row }); messageFormApi.open(); }
</script>
<template>
  <Page auto-content-height>
    <Grid :table-title="t('message.title')">
      <template #toolbar-tools><ElButton type="primary" @click="handleAdd">{{ t('common.create') }}</ElButton></template>
    </Grid>
    <MessageFormModal @success="gridApi.query()" />
  </Page>
</template>
