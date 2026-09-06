<!--
 * 审计日志（列表页）
 *
 * @path apps\system-web\src\views\audit\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 审计日志（列表页）
 * <p>消费后端契约 AuditAdminController（apps/system-web/src/api/auditAdmin.ts）：
 * queryByTimeRange() 按时间范围查询，queryByOperator() 按操作人查询，
 * queryByAction() 按操作类型查询，queryByTraceId() 按链路追踪ID查询。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElDatePicker, ElInput, ElOption, ElSelect, ElTag } from 'element-plus';
import { h, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import type { AuditLog } from '#/api/models';
import { queryByTimeRange } from '#/api/auditAdmin';

defineOptions({ name: 'AuditLogManagement' });

const { t } = useI18n();

/** 搜索表单 */
const searchForm = reactive({
  startTime: '',
  endTime: '',
  operatorId: '',
  action: '',
  keyword: '',
});

/** 操作类型选项 */
const actionOptions = [
  { label: t('common.allTab'), value: '' },
  { label: t('audit.action.create'), value: '1' },
  { label: t('audit.action.update'), value: '2' },
  { label: t('audit.action.delete'), value: '3' },
  { label: t('audit.action.query'), value: '4' },
  { label: t('audit.action.export'), value: '5' },
  { label: t('audit.action.login'), value: '6' },
  { label: t('audit.action.logout'), value: '7' },
];

/** 操作类型标签映射（tagName 仅做样式标记，label 由 i18n 在模板层处理） */
const actionTagMap: Record<number, { i18nKey: string; type: string }> = {
  1: { i18nKey: 'audit.action.create', type: 'success' },
  2: { i18nKey: 'audit.action.update', type: 'primary' },
  3: { i18nKey: 'audit.action.delete', type: 'danger' },
  4: { i18nKey: 'audit.action.query', type: 'info' },
  5: { i18nKey: 'audit.action.export', type: 'warning' },
  6: { i18nKey: 'audit.action.login', type: 'success' },
  7: { i18nKey: 'audit.action.logout', type: 'info' },
};

const gridOptions = reactive<VxeGridProps<AuditLog>>({
  columns: [
    { type: 'seq', width: 50, title: t('common.columns.seq') },
    { field: 'id', title: t('audit.columns.id'), width: 200 },
    { field: 'module', title: t('audit.columns.module'), width: 120 },
    {
      field: 'action',
      title: t('audit.columns.action'),
      width: 100,
      slots: {
        default: ({ row }) => {
          const action = row.action ?? 0;
          const config = actionTagMap[action] ?? { i18nKey: 'audit.action.query', type: 'info' };
          return h(ElTag, { type: config.type, size: 'small' }, () => t(config.i18nKey));
        },
      },
    },
    { field: 'content', title: t('audit.columns.content'), minWidth: 200 },
    { field: 'operatorName', title: t('audit.columns.operator'), width: 120 },
    { field: 'operatorId', title: t('audit.columns.operatorId'), width: 120 },
    {
      field: 'status',
      title: t('audit.columns.status'),
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.status === 1 ? 'success' : 'danger', size: 'small' }, () =>
            row.status === 1 ? t('audit.status.success') : t('audit.status.failed'),
          ),
      },
    },
    { field: 'businessNo', title: t('audit.columns.businessNo'), width: 160 },
    { field: 'createdAt', title: t('audit.columns.time'), width: 170 },
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const params: Record<string, unknown> = {
          page: page.currentPage,
          size: page.pageSize,
        };
        if (searchForm.startTime) params.startTime = searchForm.startTime;
        if (searchForm.endTime) params.endTime = searchForm.endTime;
        if (searchForm.operatorId) params.operatorId = searchForm.operatorId;
        if (searchForm.action) params.action = searchForm.action;
        /** 后端返回 YdszResponse<PageResult<AuditLogVO>>，response 拦截器已解包至 .data */
        const res = (await queryByTimeRange(params)) as unknown as { items: AuditLog[]; total: number };
        return { items: res.items ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
});
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 搜索 */
function handleSearch(): void {
  gridApi.query();
}

/** 重置搜索 */
function handleReset(): void {
  searchForm.startTime = '';
  searchForm.endTime = '';
  searchForm.operatorId = '';
  searchForm.action = '';
  searchForm.keyword = '';
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索头部 -->
    <div class="mb-4 flex flex-wrap items-center gap-3 px-4 pt-3">
      <ElDatePicker
        v-model="searchForm.startTime"
        type="datetime"
        :placeholder="t('audit.placeholder.startTime')"
        class="w-48"
      />
      <ElDatePicker
        v-model="searchForm.endTime"
        type="datetime"
        :placeholder="t('audit.placeholder.endTime')"
        class="w-48"
      />
      <ElInput v-model="searchForm.operatorId" :placeholder="t('audit.placeholder.operatorId')" clearable class="w-40" />
      <ElSelect v-model="searchForm.action" :placeholder="t('audit.placeholder.actionType')" clearable class="w-32">
        <ElOption v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </ElSelect>
      <ElButton type="primary" @click="handleSearch">{{ t('common.buttons.search') }}</ElButton>
      <ElButton @click="handleReset">{{ t('common.buttons.reset') }}</ElButton>
    </div>

    <Grid :table-title="t('audit.title')">
      <template #toolbar-tools>
        <ElButton @click="gridApi.query()">{{ t('common.buttons.refresh') }}</ElButton>
      </template>
    </Grid>
  </Page>
</template>
