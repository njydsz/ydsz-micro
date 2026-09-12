<!--
 * 配置审批管理页面 — 审批单列表（Tab + VxeTable）
 *
 * <p>三个 Tab：待我审批 / 我已发起 / 全部。
 * <p>TODO: 后端 API 对接后将 gridOptions.proxyConfig.ajax.query
 * 中 MOCK 数据源切换为 listPendingApprovalApi / listSubmittedApprovalApi / listAllApprovalApi。
 *
 * @path apps\system-web\src\views\config-approval\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 配置审批 —— 列表页
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import { createLogger } from '@ydsz-core/shared/utils';
import {
  ElButton,
  ElMessage,
  ElMessageBox,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';
import { h, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type {
  ConfigApprovalChangeType,
  ConfigApprovalRecord,
  ConfigApprovalResourceType,
  ConfigApprovalStatus,
} from '#/api/types/config-approval';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';

import ApprovalDetailDialog from './approval-detail-dialog.vue';
import { MOCK_APPROVAL_RECORDS } from './mock-data';

defineOptions({ name: 'ConfigApprovalManagement' });

const logger = createLogger('config-approval');

const { t } = useI18n();

// =====================================================================
// Tab 切换
// =====================================================================

/** Tab 值：pending=待我审批  submitted=我已发起  all=全部 */
type TabValue = 'pending' | 'submitted' | 'all';

const activeTab = ref<TabValue>('pending');

// =====================================================================
// 状态映射工具函数
// =====================================================================

/** 状态 -> Element Plus Tag type */
function statusTagType(status: ConfigApprovalStatus): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'danger';
    case 'WITHDRAWN':
      return 'info';
  }
}

/** 状态 -> i18n 显示文本 */
function statusLabel(status: ConfigApprovalStatus): string {
  switch (status) {
    case 'PENDING':
      return t('configApproval.statusPending');
    case 'APPROVED':
      return t('configApproval.statusApproved');
    case 'REJECTED':
      return t('configApproval.statusRejected');
    case 'WITHDRAWN':
      return t('configApproval.statusWithdrawn');
  }
}

/** 资源类型 -> i18n 显示文本 */
function resourceTypeLabel(type: ConfigApprovalResourceType): string {
  switch (type) {
    case 'CONFIG':
      return t('configApproval.resourceConfig');
    case 'DICT':
      return t('configApproval.resourceDict');
    case 'VARIABLE':
      return t('configApproval.resourceVariable');
  }
}

/** 变更类型 -> i18n 显示文本 */
function changeTypeLabel(type: ConfigApprovalChangeType): string {
  switch (type) {
    case 'CREATE':
      return t('configApproval.changeCreate');
    case 'UPDATE':
      return t('configApproval.changeUpdate');
    case 'DELETE':
      return t('configApproval.changeDelete');
  }
}

// =====================================================================
// Mock 数据源 —— TODO: 后端 API 对接后替换为真实接口
// =====================================================================

/**
 * 从 Mock 数据池中按 Tab 过滤。
 *
 * <p>真实对接后应将整段函数删除，改为在 gridOptions.proxyConfig.ajax 中直接调用 API。
 */
function filterMockByTab(tab: TabValue): ConfigApprovalRecord[] {
  // 模拟：所有 mock 都视为当前用户待审批 / 已发起
  // 实际中应依据后端返回的 currentApproverId / submitterId 过滤
  switch (tab) {
    case 'pending':
      // 状态为 PENDING 且当前审批人为「当前用户」
      return MOCK_APPROVAL_RECORDS.filter(
        (r) => r.status === 'PENDING' && r.currentApproverName === '当前用户',
      );
    case 'submitted':
      // 发起人为「张三」（模拟当前用户）
      return MOCK_APPROVAL_RECORDS.filter((r) => r.submitterName === '张三');
    case 'all':
    default:
      return MOCK_APPROVAL_RECORDS;
  }
}

// =====================================================================
// 操作处理函数
// =====================================================================

/** 审批详情弹窗引用 */
const detailDialogRef = ref<InstanceType<typeof ApprovalDetailDialog>>();

function handleViewDetail(row: ConfigApprovalRecord) {
  detailDialogRef.value?.open(row);
}

function handleApprove(row: ConfigApprovalRecord) {
  ElMessageBox.confirm(t('configApproval.approveConfirm'), t('common.confirm'), {
    type: 'warning',
  })
    .then(async () => {
      // TODO: 对接真实 API —— approveApprovalApi(row.id)
      logger.info('[Mock] 通过审批单:', row.id);
      ElMessage.success(t('configApproval.approveSuccess'));
      gridApi.query();
    })
    .catch(() => {
      /* 用户关闭确认框 */
    });
}

function handleReject(row: ConfigApprovalRecord) {
  // 打开详情弹窗，弹窗内提供拒绝原因填写 UI
  detailDialogRef.value?.open(row, 'reject');
}

function handleWithdraw(row: ConfigApprovalRecord) {
  ElMessageBox.confirm(t('common.cancel') + '?', t('common.withdraw'), {
    type: 'warning',
  })
    .then(async () => {
      // TODO: 对接真实 API —— withdrawApprovalApi(row.id)
      logger.info('[Mock] 撤回审批单:', row.id);
      ElMessage.success(t('configApproval.withdrawSuccess'));
      gridApi.query();
    })
    .catch(() => {
      /* 用户关闭确认框 */
    });
}

// =====================================================================
// VxeTable 配置
// =====================================================================

const gridOptions: VxeTableGridOptions<ConfigApprovalRecord> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'title', title: t('configApproval.colTitle'), minWidth: 240 },
    {
      field: 'resourceType',
      title: t('configApproval.colResourceType'),
      width: 100,
      slots: {
        default: ({ row }) => resourceTypeLabel(row.resourceType),
      },
    },
    {
      field: 'changeType',
      title: t('configApproval.colChangeType'),
      width: 100,
      slots: {
        default: ({ row }) => changeTypeLabel(row.changeType),
      },
    },
    { field: 'submitterName', title: t('configApproval.colSubmitter'), width: 100 },
    { field: 'submittedAt', title: t('configApproval.colSubmittedAt'), width: 170 },
    {
      field: 'status',
      title: t('configApproval.colStatus'),
      width: 100,
      slots: {
        default: ({ row }) => h(ElTag, { type: statusTagType(row.status) }, () => statusLabel(row.status)),
      },
    },
    {
      field: 'currentApproverName',
      title: t('configApproval.colCurrentApprover'),
      width: 120,
    },
    {
      field: 'action',
      title: t('configApproval.colAction'),
      width: 220,
      fixed: 'right',
      slots: {
        default: ({ row }) => h('div', { class: 'flex gap-1' }, [
          // 查看详情按钮
          h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleViewDetail(row) }, () => t('common.viewDetail')),
          // 待我审批 Tab：通过 / 拒绝
          ...(activeTab.value === 'pending'
            ? [
                h(ElButton, { size: 'small', link: true, type: 'success', onClick: () => handleApprove(row) }, () => t('common.approve')),
                h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleReject(row) }, () => t('common.reject')),
              ]
            : []),
          // 我已发起 Tab：撤回（仅 PENDING 状态）
          ...(activeTab.value === 'submitted' && row.status === 'PENDING'
            ? [
                h(ElButton, { size: 'small', link: true, type: 'warning', onClick: () => handleWithdraw(row) }, () => t('common.withdraw')),
              ]
            : []),
        ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page: pageInfo }) => {
        // TODO: 对接真实 API —— 根据 activeTab 调不同的 API
        await new Promise((resolve) => setTimeout(resolve, 200));
        const allItems = filterMockByTab(activeTab.value);
        const start = ((pageInfo?.currentPage ?? 1) - 1) * (pageInfo?.pageSize ?? 20);
        const items = allItems.slice(start, start + (pageInfo?.pageSize ?? 20));
        return { items, total: allItems.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      {
        field: 'title',
        title: t('configApproval.colTitle'),
        itemRender: { name: 'Input', props: { placeholder: t('configApproval.colTitle') } },
      },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** Tab 切换 —— 刷新列表 */
function handleTabChange(_tab: TabValue) {
  gridApi.query();
}
</script>

<template>
  <Page :auto-content-height="false" :content-full-height="true">
    <div class="config-approval-page">
      <ElTabs v-model="activeTab" @tab-change="handleTabChange">
        <ElTabPane :label="t('configApproval.tabPending')" name="pending" />
        <ElTabPane :label="t('configApproval.tabSubmitted')" name="submitted" />
        <ElTabPane :label="t('configApproval.tabAll')" name="all" />
      </ElTabs>
      <Grid :table-title="t('configApproval.title')" />
      <!-- TODO 提示：当前使用 Mock 数据 -->
      <div v-if="activeTab !== 'all'" style="margin-top: 8px; color: #909399; font-size: 12px">
        {{ t('configApproval.mockData') }}
      </div>
    </div>
    <ApprovalDetailDialog ref="detailDialogRef" @approved="gridApi.query()" @rejected="gridApi.query()" @withdrawn="gridApi.query()" />
  </Page>
</template>

<style scoped>
.config-approval-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
