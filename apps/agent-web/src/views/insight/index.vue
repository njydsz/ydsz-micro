<!--
 * 洞察报告列表视图
 *
 * <p>展示用户近期生成的 BI 洞察报告列表，支持查看详情、导出 HTML、删除操作。
 *
 * @path apps/agent-web/src/views/insight/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 洞察报告列表
 * <p>消费后端 InsightReportController（apps/agent-web/src/api/insightReport.ts）：
 * listRecentReports() 获取用户近期报告列表，deleteReport() 删除指定报告。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { createLogger } from '@ydsz/utils';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { deleteReport, listRecentReports, type InsightReportResultVO } from '#/api/insightReport';

defineOptions({ name: 'InsightReportManagement' });

const logger = createLogger('agent-insight-report');

/** 当前用户 ID（实际应从 store / auth 获取） */
const currentUserId = ref('current-user');

const gridOptions: VxeTableGridOptions<InsightReportResultVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'reportId', title: '报告 ID', width: 200 },
    { field: 'title', title: '报告标题', width: 200, showOverflow: true },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: ({ row }) => {
        const theme = getStatusTheme(row.status);
        const text = getStatusText(row.status);
        return h(ElTag, { type: theme }, () => text);
      } },
    },
    { field: 'durationMs', title: '生成耗时(ms)', width: 120 },
    { field: 'createdAt', title: '创建时间', width: 160 },
    {
      field: 'action',
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: {
        default: ({ row }) => h('div', { class: 'flex gap-1' }, [
          h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleExport(row) }, () => '导出'),
          h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除'),
        ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        try {
          const items = await listRecentReports({ userId: currentUserId.value, limit: 50 });
          return { items: items ?? [], total: items?.length ?? 0 };
        } catch (error) {
          logger.error('加载洞察报告列表失败:', error);
          return { items: [], total: 0 };
        }
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'title', title: '报告标题', itemRender: { name: 'Input', props: { placeholder: '报告标题' } } },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/**
 * 导出 HTML 报告。
 *
 * @param row - 报告行数据
 */
async function handleExport(row: InsightReportResultVO) {
  if (!row.reportId) {
    return;
  }
  logger.info('导出洞察报告 HTML:', row.reportId);
  ElMessage.info('导出功能已触发，请在浏览器弹窗中完成下载。');
}

/**
 * 删除报告。
 *
 * @param row - 报告行数据
 */
async function handleDelete(row: InsightReportResultVO) {
  if (!row.reportId) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除报告「${row.title ?? row.reportId}」吗？`,
      '删除确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  try {
    await deleteReport(row.reportId);
    ElMessage.success('删除成功');
    gridApi.query();
  } catch {
    /* 错误已由请求拦截器展示，无需重复处理 */
  }
}

/**
 * 获取状态标签主题色。
 *
 * @param status - 报告状态
 */
function getStatusTheme(status: string | undefined): 'success' | 'danger' | 'warning' | 'info' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'exported':
      return 'warning';
    default:
      return 'info';
  }
}

/**
 * 获取状态文本。
 *
 * @param status - 报告状态
 */
function getStatusText(status: string | undefined): string {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'failed':
      return '生成失败';
    case 'exported':
      return '已导出';
    default:
      return '草稿';
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="洞察报告管理" />
  </Page>
</template>
