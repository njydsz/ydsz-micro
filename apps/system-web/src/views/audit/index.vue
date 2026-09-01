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
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { queryByTimeRange } from '#/api/auditAdmin';
import type { AuditLog } from '#/api/models';

defineOptions({ name: 'AuditLogManagement' });

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
  { label: '全部', value: '' },
  { label: '新增', value: '1' },
  { label: '修改', value: '2' },
  { label: '删除', value: '3' },
  { label: '查询', value: '4' },
  { label: '导出', value: '5' },
  { label: '登录', value: '6' },
  { label: '登出', value: '7' },
];

const gridOptions: VxeGridProps<AuditLog> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'id', title: '日志ID', width: 200 },
    { field: 'module', title: '模块', width: 120 },
    {
      field: 'action',
      title: '操作类型',
      width: 100,
      slots: {
        default: ({ row }) => {
          const actionMap: Record<number, { label: string; type: string }> = {
            1: { label: '新增', type: 'success' },
            2: { label: '修改', type: 'primary' },
            3: { label: '删除', type: 'danger' },
            4: { label: '查询', type: 'info' },
            5: { label: '导出', type: 'warning' },
            6: { label: '登录', type: 'success' },
            7: { label: '登出', type: 'info' },
          };
          const action = row.action ?? 0;
          const config = actionMap[action] ?? { label: '未知', type: 'info' };
          return h(ElTag, { type: config.type, size: 'small' }, () => config.label);
        },
      },
    },
    { field: 'content', title: '操作内容', minWidth: 200 },
    { field: 'operatorName', title: '操作人', width: 120 },
    { field: 'operatorId', title: '操作人ID', width: 120 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }) =>
          h(ElTag, { type: row.status === 1 ? 'success' : 'danger', size: 'small' }, () => (row.status === 1 ? '成功' : '失败')),
      },
    },
    { field: 'businessNo', title: '业务单号', width: 160 },
    { field: 'createdAt', title: '操作时间', width: 170 },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
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
        const items = await queryByTimeRange(params);
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
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
        placeholder="开始时间"
        class="w-48"
      />
      <ElDatePicker
        v-model="searchForm.endTime"
        type="datetime"
        placeholder="结束时间"
        class="w-48"
      />
      <ElInput v-model="searchForm.operatorId" placeholder="操作人ID" clearable class="w-40" />
      <ElSelect v-model="searchForm.action" placeholder="操作类型" clearable class="w-32">
        <ElOption v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </ElSelect>
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </div>

    <Grid table-title="审计日志">
      <template #toolbar-tools>
        <ElButton type="primary" @click="gridApi.query()">刷新</ElButton>
      </template>
    </Grid>
  </Page>
</template>
