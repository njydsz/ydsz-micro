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
import { YdBadge, YdButton } from '@ydsz-core/ydsz-ui';
import { h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { showToast } from '@ydsz/notification';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  acknowledgeAlert,
  getPendingAlerts,
  ignoreAlert,
  pageAlerts,
  resolveAlert,
} from '#/api/securityAlert';

defineOptions({ name: 'AuditLogManagement' });

const { t } = useI18n();

/** 告警类型映射 */
const ALERT_TYPE_MAP: Record<string, { label: string; type: string }> = {
  ACCOUNT_LOCKED: { label: t('audit.alertTypeAccountLocked'), type: 'danger' },
  ACCOUNT_BANNED: { label: t('audit.alertTypeAccountBanned'), type: 'danger' },
  MFA_FAILED: { label: t('audit.alertTypeMfaFailed'), type: 'warning' },
  BRUTE_FORCE: { label: t('audit.alertTypeBruteForce'), type: 'danger' },
  ANOMALOUS_LOGIN: { label: t('audit.alertTypeAnomalousLogin'), type: 'warning' },
  PASSWORD_SPRAY: { label: t('audit.alertTypePasswordSpray'), type: 'danger' },
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
    { type: 'seq', width: 50, title: t('rowIndex') },
    {
      field: 'alertType',
      title: t('audit.alertType'),
      width: 140,
      slots: {
        default: ({ row }) => {
          const alertType = row.alertType ?? '';
          const config = ALERT_TYPE_MAP[alertType] ?? { label: alertType, type: 'info' };
          return h(
            YdBadge,
            {
              variant:
                config.type === 'danger'
                  ? 'destructive'
                  : config.type === 'warning'
                    ? 'outline'
                    : 'secondary',
              class:
                config.type === 'warning'
                  ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                  : 'text-xs',
            },
            () => config.label,
          );
        },
      },
    },
    {
      field: 'alertType',
      title: t('audit.typeCode'),
      width: 140,
      slots: {
        default: ({ row }) =>
          h('span', { class: 'font-mono text-xs text-gray-500' }, row.alertType ?? '-'),
      },
    },
    {
      field: 'action',
      title: t('operation'),
      width: 180,
      fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleAcknowledge(row) },
              () => t('audit.acknowledge'),
            ),
            h(
              YdButton,
              {
                size: 'sm',
                variant: 'link',
                class: 'border-green-500 text-green-600 dark:text-green-400',
                onClick: () => handleResolve(row),
              },
              () => t('audit.resolve'),
            ),
            h(
              YdButton,
              { size: 'sm', variant: 'ghost', onClick: () => handleIgnore(row) },
              () => t('audit.ignore'),
            ),
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
          page: page.currentPage,
          pageSize: page.pageSize,
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
    await acknowledgeAlert({ id: row.id }, { note: t('audit.adminAcknowledge') });
    showToast.success(t('audit.acknowledgeSuccess'));
    gridApi.query();
    loadPendingCount();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

/** 解决告警 */
async function handleResolve(row: AlertRow): Promise<void> {
  try {
    await resolveAlert({ id: row.id }, { note: t('audit.adminResolve') });
    showToast.success(t('audit.resolveSuccess'));
    gridApi.query();
    loadPendingCount();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

/** 忽略告警 */
async function handleIgnore(row: AlertRow): Promise<void> {
  try {
    await ignoreAlert({ id: row.id }, { note: t('audit.adminIgnore') });
    showToast.success(t('audit.ignoreSuccess'));
    gridApi.query();
    loadPendingCount();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
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
        <span class="text-sm text-gray-600">{{ t('audit.pendingAlerts') }}</span>
        <span class="text-xl font-bold text-red-600">{{ pendingCount }}</span>
        <span class="ml-2 text-xs text-gray-400">{{ t('audit.handleHighRisk') }}</span>
      </div>
    </div>

    <Grid :table-title="t('audit.title')">
      <template #toolbar-tools>
        <YdButton
          variant="default"
          @click="
            () => {
              gridApi.query();
              loadPendingCount();
            }
          "
          >{{ t('audit.refresh') }}</YdButton
        >
      </template>
    </Grid>
  </Page>
</template>
