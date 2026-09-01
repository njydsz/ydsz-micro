<!--
 * 操作审计日志（列表页）
 *
 * @path apps\userinfo-web\src\views\system\audit\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 操作审计日志（列表页）
 * <p>展示用户操作审计日志，包括登录、权限变更、敏感操作等。
 * <p>消费后端契约 SecurityAlertController（apps/userinfo-web/src/api/securityAlert.ts）：
 * pageAlerts() 分页查询安全告警，getPendingAlerts() 待处理告警，
 * acknowledgeAlert() 确认告警，resolveAlert() 解决告警，ignoreAlert() 忽略告警。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElTag } from 'element-plus';
import { h, onMounted, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  acknowledgeAlert,
  getPendingAlerts,
  ignoreAlert,
  pageAlerts,
  resolveAlert,
} from '#/api/securityAlert';

defineOptions({ name: 'AuditLogManagement' });

/** 告警类型映射 */
const ALERT_TYPE_MAP: Record<string, { label: string; type: string }> = {
  ACCOUNT_LOCKED: { label: '账户锁定', type: 'danger' },
  ACCOUNT_BANNED: { label: '账户封禁', type: 'danger' },
  MFA_FAILED: { label: 'MFA失败', type: 'warning' },
  BRUTE_FORCE: { label: '暴力破解', type: 'danger' },
  ANOMALOUS_LOGIN: { label: '异常登录', type: 'warning' },
  PASSWORD_SPRAY: { label: '密码喷洒', type: 'danger' },
};

/** 待处理告警数量 */
const pendingCount = ref(0);

/** 加载待处理告警数量 */
async function loadPendingCount(): Promise<void> {
  try {
    const alerts = await getPendingAlerts({ limit: 100 });
    pendingCount.value = alerts.length;
  } catch {
    pendingCount.value = 0;
  }
}

interface AlertRow {
  id: string;
  alertType: string;
  index: number;
}

const gridOptions: VxeGridProps<AlertRow> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    {
      field: 'alertType',
      title: '告警类型',
      width: 140,
      slots: {
        default: ({ row }) => {
          const alertType = row.alertType ?? '';
          const config = ALERT_TYPE_MAP[alertType] ?? { label: alertType, type: 'info' };
          return h(ElTag, { type: config.type, size: 'small' }, () => config.label);
        },
      },
    },
    {
      field: 'alertType',
      title: '类型编码',
      width: 140,
      slots: {
        default: ({ row }) => h('span', { class: 'font-mono text-xs text-gray-500' }, row.alertType ?? '-'),
      },
    },
    {
      field: 'action', title: '操作', width: 180, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'primary', onClick: () => handleAcknowledge(row) }, () => '确认'),
            h(ElButton, { size: 'small', link: true, type: 'success', onClick: () => handleResolve(row) }, () => '解决'),
            h(ElButton, { size: 'small', link: true, type: 'info', onClick: () => handleIgnore(row) }, () => '忽略'),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const res = await pageAlerts({
          query: {
            page: page.currentPage,
            pageSize: page.pageSize,
          },
        });
        // 将字符串数组转换为 AlertRow 对象数组
        const items: AlertRow[] = (res.data ?? []).map((alertType, index) => ({
          id: `${page.currentPage}_${index}`,
          alertType,
          index: (page.currentPage - 1) * page.pageSize + index,
        }));
        return { items, total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 确认告警 */
async function handleAcknowledge(row: AlertRow): Promise<void> {
  try {
    await acknowledgeAlert({ id: row.id }, { note: '管理员确认' });
    ElMessage.success('确认成功');
    gridApi.query();
    loadPendingCount();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

/** 解决告警 */
async function handleResolve(row: AlertRow): Promise<void> {
  try {
    await resolveAlert({ id: row.id }, { note: '管理员解决' });
    ElMessage.success('解决成功');
    gridApi.query();
    loadPendingCount();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

/** 忽略告警 */
async function handleIgnore(row: AlertRow): Promise<void> {
  try {
    await ignoreAlert({ id: row.id }, { note: '管理员忽略' });
    ElMessage.success('忽略成功');
    gridApi.query();
    loadPendingCount();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

onMounted(() => {
  loadPendingCount();
});
</script>

<template>
  <Page auto-content-height>
    <!-- 统计头部 -->
    <div class="mb-4 px-4 pt-3">
      <div class="rounded-lg border bg-red-50 px-4 py-3">
        <span class="text-sm text-gray-600">待处理安全告警：</span>
        <span class="text-xl font-bold text-red-600">{{ pendingCount }}</span>
        <span class="ml-2 text-xs text-gray-400">请及时处理高危告警</span>
      </div>
    </div>

    <Grid table-title="操作审计日志">
      <template #toolbar-tools>
        <ElButton type="primary" @click="() => { gridApi.query(); loadPendingCount(); }">刷新</ElButton>
      </template>
    </Grid>
  </Page>
</template>
