<!--
 * 文件分享（列表页）
 *
 * @path apps\nextwiki-web\src\views\share\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 文件分享（列表页）
 * <p>消费后端契约 ShareController（apps/nextwiki-web/src/api/share.ts）：
 * 上方「我的分享」myShares() 列表，支持新建分享 createShare（share-form.vue）、
 * 访问日志 getAccessLogs、接收人 getRecipients、撤销 revoke；
 * 下方「收到的分享」getReceivedShares() 展示我接收到的分享。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page, useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElDrawer, ElMessage, ElMessageBox, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { getAccessLogs, getReceivedShares, getRecipients, myShares, revoke } from '#/api/share';
import type { ShareAccessLogVO, ShareLinkVO, ShareRecipientVO } from '#/api/models';
import ShareForm from './share-form.vue';
defineOptions({ name: 'ShareManagement' });

/** 我的分享列表 */
const gridOptions: VxeGridProps<ShareLinkVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'id', title: '分享ID', width: 200 },
    { field: 'title', title: '标题', minWidth: 140 },
    { field: 'fileName', title: '文件名称', minWidth: 160 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.status === 'ACTIVE' ? 'success' : 'info' }, () => row.status ?? '-'),
      },
    },
    { field: 'accessCount', title: '访问次数', width: 90 },
    { field: 'expireTime', title: '过期时间', width: 170 },
    { field: 'createdAt', title: '创建时间', width: 170 },
    {
      field: 'action', title: '操作', width: 240, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => showLogs(row) }, () => '访问日志'),
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => showRecipients(row) }, () => '接收人'),
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleRevoke(row) }, () => '撤销'),
          ]),
      },
    },
  ],
  height: 420,
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await myShares();
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 收到的分享列表 */
const receivedGridOptions: VxeGridProps<ShareRecipientVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'id', title: '接收记录ID', width: 200 },
    { field: 'shareId', title: '分享ID', width: 200 },
    { field: 'recipientName', title: '分享人', width: 140 },
    {
      field: 'status', title: '状态', width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.status === 'VIEWED' ? 'success' : 'info' }, () => row.status ?? '-'),
      },
    },
    { field: 'viewedAt', title: '查看时间', width: 170 },
    { field: 'createdAt', title: '接收时间', width: 170 },
  ],
  height: 320,
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await getReceivedShares();
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [ReceivedGrid] = useYDSZVxeGrid({ gridOptions: receivedGridOptions });

const [ShareFormModal, shareFormApi] = useYDSZModal({ connectedComponent: ShareForm });

function handleAdd() { shareFormApi.open(); }

/** 当前查看的分享 ID */
const currentShareId = ref('');
/** 访问日志抽屉 */
const logsVisible = ref(false);
const logsLoading = ref(false);
const accessLogs = ref<ShareAccessLogVO[]>([]);
async function showLogs(row: ShareLinkVO) {
  if (!row.id) return;
  currentShareId.value = row.id;
  logsVisible.value = true;
  await loadLogs();
}
async function loadLogs() {
  if (!currentShareId.value) return;
  logsLoading.value = true;
  try {
    accessLogs.value = await getAccessLogs({ shareId: currentShareId.value }, {});
  } finally {
    logsLoading.value = false;
  }
}

/** 接收人抽屉 */
const recipientsVisible = ref(false);
const recipientsLoading = ref(false);
const recipients = ref<ShareRecipientVO[]>([]);
async function showRecipients(row: ShareLinkVO) {
  if (!row.id) return;
  currentShareId.value = row.id;
  recipientsVisible.value = true;
  await loadRecipients();
}
async function loadRecipients() {
  if (!currentShareId.value) return;
  recipientsLoading.value = true;
  try {
    recipients.value = await getRecipients({ shareId: currentShareId.value });
  } finally {
    recipientsLoading.value = false;
  }
}

async function handleRevoke(row: ShareLinkVO) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确定撤销分享「${row.title || row.fileName}」吗？`, '撤销确认', { type: 'warning' });
    await revoke({ shareId: row.id });
    ElMessage.success('撤销成功');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
</script>
<template>
  <Page auto-content-height>
    <Grid table-title="我的分享">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleAdd">新建分享</ElButton>
      </template>
    </Grid>
    <ReceivedGrid table-title="收到的分享" />
    <ShareFormModal @success="gridApi.query()" />
    <ElDrawer v-model="logsVisible" title="访问日志" :size="640">
      <div class="mb-2 flex justify-end">
        <ElButton size="small" :loading="logsLoading" @click="loadLogs">刷新</ElButton>
      </div>
      <ElTable :data="accessLogs" border size="small">
        <ElTableColumn prop="visitorName" label="访问者" min-width="120" />
        <ElTableColumn prop="visitorIp" label="IP" min-width="140" />
        <ElTableColumn prop="accessType" label="访问类型" width="110" />
        <ElTableColumn prop="accessStatus" label="状态" width="100" />
        <ElTableColumn prop="accessTime" label="访问时间" min-width="170" />
        <ElTableColumn prop="failReason" label="失败原因" min-width="120" />
      </ElTable>
    </ElDrawer>
    <ElDrawer v-model="recipientsVisible" title="接收人" :size="640">
      <div class="mb-2 flex justify-end">
        <ElButton size="small" :loading="recipientsLoading" @click="loadRecipients">刷新</ElButton>
      </div>
      <ElTable :data="recipients" border size="small">
        <ElTableColumn prop="recipientName" label="接收人" min-width="140" />
        <ElTableColumn prop="recipientType" label="接收类型" width="110" />
        <ElTableColumn prop="status" label="状态" width="100" />
        <ElTableColumn prop="viewedAt" label="查看时间" min-width="170" />
        <ElTableColumn prop="createdAt" label="创建时间" min-width="170" />
      </ElTable>
    </ElDrawer>
  </Page>
</template>