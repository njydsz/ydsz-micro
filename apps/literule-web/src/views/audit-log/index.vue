<!--
 * 规则审计日志查询页面
 *
 * @path apps\literule-web\src\views\audit-log\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则审计日志（只读查询页）
 * <p>审计日志查询页，数据来自后端契约 API（apps/literule-web/src/api/ruleAuditLog.ts）。
 * <p>支持按规则编码/操作人/动作/时间范围筛选。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { AuditLogEntryVO } from '#/api/models';
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElTag } from 'element-plus';
import { h, reactive } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { byAction, byOperator, byRuleCode, byTimeRange, recent } from '#/api/ruleAuditLog';
defineOptions({ name: 'AuditLogManagement' });
/** 审计日志筛选条件 */
interface AuditFilter {
  ruleCode: string;
  operator: string;
  action: string;
  startTime: string;
  endTime: string;
}
const filter = reactive<AuditFilter>({
  ruleCode: '',
  operator: '',
  action: '',
  startTime: '',
  endTime: '',
});
/** 按当前筛选条件查询审计日志 */
async function queryAudit(): Promise<{ items: AuditLogEntryVO[]; total: number }> {
  let items: AuditLogEntryVO[] = [];
  if (filter.ruleCode.trim()) {
    items = await byRuleCode({ ruleCode: filter.ruleCode.trim() }, {});
  } else if (filter.operator.trim()) {
    items = await byOperator({ operator: filter.operator.trim() });
  } else if (filter.action.trim()) {
    items = await byAction({ action: filter.action.trim() });
  } else if (filter.startTime || filter.endTime) {
    items = await byTimeRange({
      startTime: filter.startTime || undefined,
      endTime: filter.endTime || undefined,
    });
  } else {
    items = await recent({});
  }
  return { items, total: items.length };
}
/** 重置筛选条件并重新查询 */
function handleReset() {
  Object.assign(filter, {
    ruleCode: '',
    operator: '',
    action: '',
    startTime: '',
    endTime: '',
  });
  gridApi.query();
}
const gridOptions: VxeGridProps<AuditLogEntryVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'ruleCode', title: '规则编码', width: 150 },
    { field: 'ruleName', title: '规则名称', width: 160 },
    {
      field: 'action',
      title: '动作',
      width: 120,
      slots: { default: ({ row }) => h(ElTag, { type: 'primary' }, () => row.action ?? '-') },
    },
    { field: 'operator', title: '操作人', width: 100 },
    { field: 'result', title: '结果', width: 90 },
    { field: 'createdAt', title: '触发时间', width: 170 },
    { field: 'errorMessage', title: '错误信息', minWidth: 160 },
  ],
  height: 'auto',
  proxyConfig: { ajax: { query: async () => await queryAudit() } },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });
</script>
<template>
  <Page auto-content-height>
    <div class="mb-2 flex flex-wrap items-center gap-2 rounded border border-gray-200 bg-white p-3">
      <ElInput v-model="filter.ruleCode" placeholder="规则编码" clearable class="w-40" />
      <ElInput v-model="filter.operator" placeholder="操作人" clearable class="w-40" />
      <ElInput v-model="filter.action" placeholder="动作" clearable class="w-40" />
      <ElDatePicker
        v-model="filter.startTime"
        type="datetime"
        placeholder="开始时间"
        value-format="YYYY-MM-DD HH:mm:ss"
        class="w-48"
      />
      <span class="text-gray-400">-</span>
      <ElDatePicker
        v-model="filter.endTime"
        type="datetime"
        placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
        class="w-48"
      />
      <ElButton type="primary" @click="gridApi.query()">查询</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </div>
    <Grid table-title="审计日志" />
  </Page>
</template>
