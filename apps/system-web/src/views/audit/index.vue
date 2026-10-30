<!--
 * 审计日志（列表页）— 多维度筛选分页列表 + 详情抽屉
 *
 * @path apps\system-web\src\views\audit\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 审计日志（列表页）
 * <p>消费后端契约 AuditAdminController（apps/system-web/src/api/auditAdmin.ts）：
 * queryByTimeRange() 按时间范围分页查询审计日志。
 * <p>筛选维度：时间范围、操作人、操作类型、模块；操作列可打开详情抽屉查看完整审计记录。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';
import {
  YdBadge,
  YdButton,
  YdDatePicker,
  YdInput,
  YdSelect,
  YdSelectItem,
} from '@ydsz-core/ydsz-ui';
import { h, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import type { AuditLog } from '#/api/models';
import { queryByTimeRange } from '#/api/auditAdmin';

import AuditDetailDrawer from './audit-detail-drawer.vue';

defineOptions({ name: 'AuditLogManagement' });

const { t } = useI18n();

/** 搜索表单 */
const searchForm = reactive({
  startTime: '',
  endTime: '',
  operatorId: '',
  action: '',
  module: '',
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

/** 模块选项（当前为静态枚举，后续可改为字典动态加载） */
const moduleOptions = [
  { label: t('common.allTab'), value: '' },
  { label: 'userinfo', value: 'userinfo' },
  { label: 'system', value: 'system' },
  { label: 'workflow', value: 'workflow' },
  { label: 'config', value: 'config' },
  { label: 'dict', value: 'dict' },
  { label: 'tenant', value: 'tenant' },
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

/** 详情抽屉引用 */
const detailDrawerRef = ref<InstanceType<typeof AuditDetailDrawer>>();

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
          return h(YdBadge, { variant: config.type, size: 'small' }, () => t(config.i18nKey));
        },
      },
    },
    { field: 'content', title: t('audit.columns.content'), minWidth: 200 },
    { field: 'operatorName', title: t('audit.columns.operator'), width: 120 },
    {
      field: 'status',
      title: t('audit.columns.status'),
      width: 90,
      slots: {
        default: ({ row }) =>
          h(YdBadge, { variant: row.status === 1 ? 'success' : 'danger', size: 'small' }, () =>
            row.status === 1 ? t('audit.status.success') : t('audit.status.failed'),
          ),
      },
    },
    { field: 'operationTime', title: t('audit.columns.time'), width: 170 },
    {
      field: 'detail',
      title: t('audit.columns.detail'),
      width: 100,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h(
            YdButton,
            {
              size: 'sm',
              variant: 'outline',
              'aria-label': `${t('audit.buttons.viewDetail')} - ${row.id ?? ''}`,
              onClick: () => handleViewDetail(row),
            },
            () => t('audit.buttons.viewDetail'),
          ),
      },
    },
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
        if (searchForm.module) params.module = searchForm.module;
        /** 后端返回 YdszResponse<PageResult<AuditLogVO>>，response 拦截器已解包至 .data */
        const res = (await queryByTimeRange(params)) as unknown as { items: AuditLog[]; total: number };
        return { items: res.items ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
});
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 打开详情抽屉 */
function handleViewDetail(row: AuditLog): void {
  detailDrawerRef.value?.open(row);
}

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
  searchForm.module = '';
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索头部 -->
    <div class="mb-4 flex flex-wrap items-center gap-3 px-4 pt-3">
      <YdDatePicker
        v-model="searchForm.startTime"
        type="datetime"
        :placeholder="t('audit.placeholder.startTime')"
        class="w-48"
      />
      <YdDatePicker
        v-model="searchForm.endTime"
        type="datetime"
        :placeholder="t('audit.placeholder.endTime')"
        class="w-48"
      />
      <YdInput v-model="searchForm.operatorId" :placeholder="t('audit.placeholder.operatorId')" clearable class="w-40" />
      <YdSelect v-model="searchForm.action" :placeholder="t('audit.placeholder.actionType')" clearable class="w-32">
        <YdSelectItem v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </YdSelect>
      <YdSelect v-model="searchForm.module" :placeholder="t('audit.columns.module')" clearable class="w-32">
        <YdSelectItem v-for="opt in moduleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </YdSelect>
      <YdButton type="primary" @click="handleSearch">{{ t('common.buttons.search') }}</YdButton>
      <YdButton @click="handleReset">{{ t('common.buttons.reset') }}</YdButton>
    </div>

    <Grid :table-title="t('audit.title')">
      <template #toolbar-tools>
        <YdButton @click="gridApi.query()">{{ t('common.buttons.refresh') }}</YdButton>
      </template>
    </Grid>

    <!-- 审计详情抽屉 -->
    <AuditDetailDrawer ref="detailDrawerRef" />
  </Page>
</template>
