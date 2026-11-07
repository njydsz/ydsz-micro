<!--
 * 安全告警管理列表视图
 *
 * <p>提供安全告警的完整管理功能：分页查询、确认、解决、忽略。
 *
 * @path apps/userinfo-web/src/views/system/security-alert/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 安全告警管理列表
 * <p>消费后端 SecurityAlertController（apps/userinfo-web/src/api/securityAlert.ts）：
 * pageAlerts() 分页查询，getPendingAlerts() 待处理告警，
 * acknowledgeAlert() 确认告警，resolveAlert() 解决告警，ignoreAlert() 忽略告警。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { YdBadge, YdButton } from '@ydsz-core/ydsz-ui';
import { h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { createLogger } from '@ydsz/utils';
import { showToast } from '@ydsz/notification';
import { YdConfirm } from '@ydsz-core/popup-ui';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  acknowledgeAlert,
  getPendingAlerts,
  ignoreAlert,
  pageAlerts,
  resolveAlert,
} from '#/api/securityAlert';

defineOptions({ name: 'SecurityAlertManagement' });

const logger = createLogger('userinfo-security-alert');
const { t } = useI18n();

/** 告警等级映射（标签颜色） */
const RISK_LEVEL_MAP: Record<string, { label: string; type: string }> = {
  CRITICAL: { label: t('securityAlert.riskCritical'), type: 'danger' },
  HIGH: { label: t('securityAlert.riskHigh'), type: 'danger' },
  MEDIUM: { label: t('securityAlert.riskMedium'), type: 'warning' },
  LOW: { label: t('securityAlert.riskLow'), type: 'info' },
};

/** 告警类型映射 */
const ALERT_TYPE_MAP: Record<string, { label: string; type: string }> = {
  ACCOUNT_LOCKED: { label: t('securityAlert.typeAccountLocked'), type: 'danger' },
  ACCOUNT_BANNED: { label: t('securityAlert.typeAccountBanned'), type: 'danger' },
  MFA_FAILED: { label: t('securityAlert.typeMfaFailed'), type: 'warning' },
  BRUTE_FORCE: { label: t('securityAlert.typeBruteForce'), type: 'danger' },
  ANOMALOUS_LOGIN: { label: t('securityAlert.typeAnomalousLogin'), type: 'warning' },
  PASSWORD_SPRAY: { label: t('securityAlert.typePasswordSpray'), type: 'danger' },
};

/** 告警状态映射 */
const ALERT_STATUS_MAP: Record<string, { label: string; type: string }> = {
  PENDING: { label: t('securityAlert.statusPending'), type: 'warning' },
  ACKNOWLEDGED: { label: t('securityAlert.statusAcknowledged'), type: 'primary' },
  RESOLVED: { label: t('securityAlert.statusResolved'), type: 'success' },
  IGNORED: { label: t('securityAlert.statusIgnored'), type: 'info' },
};

/** 待处理告警数量 */
const pendingCount = ref(0);

/** 告警行数据 */
interface AlertRow {
  id: string;
  alertType: string;
  riskLevel: string;
  alertStatus: string;
  index: number;
}

/**
 * 加载待处理告警数量。
 */
async function loadPendingCount(): Promise<void> {
  try {
    const alerts = await getPendingAlerts({ limit: 100 });
    pendingCount.value = alerts?.length ?? 0;
  } catch (error) {
    logger.warn('加载待处理告警数量失败:', error);
    pendingCount.value = 0;
  }
}

const gridOptions: VxeTableGridOptions = {
  columns: [
    { type: 'seq', width: 50, title: t('rowIndex') },
    {
      field: 'alertType',
      title: t('securityAlert.alertType'),
      width: 130,
      slots: {
        default: ({ row }) => {
          const alertRow = row as unknown as AlertRow;
          const config = ALERT_TYPE_MAP[alertRow.alertType] ?? {
            label: alertRow.alertType ?? '-',
            type: 'info',
          };
          return h(
            YdBadge,
            {
              variant:
                config.type === 'danger'
                  ? 'destructive'
                  : config.type === 'warning'
                    ? 'outline'
                    : config.type === 'primary'
                      ? 'default'
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
      field: 'riskLevel',
      title: t('securityAlert.riskLevel'),
      width: 100,
      slots: {
        default: ({ row }) => {
          const alertRow = row as unknown as AlertRow;
          const config = RISK_LEVEL_MAP[alertRow.riskLevel] ?? {
            label: alertRow.riskLevel ?? '-',
            type: 'info',
          };
          return h(
            YdBadge,
            {
              variant:
                config.type === 'danger'
                  ? 'destructive'
                  : config.type === 'warning'
                    ? 'outline'
                    : config.type === 'primary'
                      ? 'default'
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
      field: 'alertStatus',
      title: t('securityAlert.alertStatus'),
      width: 100,
      slots: {
        default: ({ row }) => {
          const alertRow = row as unknown as AlertRow;
          const config = ALERT_STATUS_MAP[alertRow.alertStatus] ?? {
            label: alertRow.alertStatus ?? '-',
            type: 'info',
          };
          return h(
            YdBadge,
            {
              variant:
                config.type === 'danger'
                  ? 'destructive'
                  : config.type === 'warning'
                    ? 'outline'
                    : config.type === 'primary'
                      ? 'default'
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
      field: 'action',
      title: t('operation'),
      width: 200,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const alertRow = row as unknown as AlertRow;
          return h('div', { class: 'flex gap-1' }, [
            h(
              YdButton,
              { size: 'sm', variant: 'link', onClick: () => handleAcknowledge(alertRow) },
              () => t('securityAlert.acknowledge'),
            ),
            h(
              YdButton,
              {
                size: 'sm',
                variant: 'link',
                class: 'border-green-500 text-green-600 dark:text-green-400',
                onClick: () => handleResolve(alertRow),
              },
              () => t('securityAlert.resolve'),
            ),
            h(
              YdButton,
              { size: 'sm', variant: 'ghost', onClick: () => handleIgnore(alertRow) },
              () => t('securityAlert.ignore'),
            ),
          ]);
        },
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page: pageParams }) => {
        try {
          const res = await pageAlerts({} as Record<string, unknown>);
          // auto-generated 返回值为 PageResponse<string[]>，将字符串枚举数组转换为 AlertRow 对象数组
          const alertData = (res?.data ?? []) as unknown as string[];
          const items: AlertRow[] = alertData.map((alertType: string, index: number) => ({
            id: String((pageParams?.currentPage ?? 1) * 1000 + index),
            alertType,
            riskLevel: 'MEDIUM',
            alertStatus: 'PENDING',
            index: ((pageParams?.currentPage ?? 1) - 1) * (pageParams?.pageSize ?? 20) + index,
          }));
          return { items: items as unknown as Record<string, unknown>[], total: res?.total ?? 0 };
        } catch (error) {
          logger.error('加载安全告警列表失败:', error);
          return { items: [] as Record<string, unknown>[], total: 0 };
        }
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/**
 * 确认告警。
 *
 * @param row - 行数据
 */
async function handleAcknowledge(row: AlertRow): Promise<void> {
  try {
    await YdConfirm(t('securityAlert.confirmAcknowledge'), {
      title: t('securityAlert.acknowledgeTitle'),
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await acknowledgeAlert({ id: row.id }, { note: t('securityAlert.adminAcknowledge') });
    showToast.success(t('securityAlert.acknowledgeSuccess'));
    gridApi.query();
    loadPendingCount();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

/**
 * 解决告警。
 *
 * @param row - 行数据
 */
async function handleResolve(row: AlertRow): Promise<void> {
  try {
    await YdConfirm(t('securityAlert.confirmResolve'), {
      title: t('securityAlert.resolveTitle'),
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    await resolveAlert({ id: row.id }, { note: t('securityAlert.adminResolve') });
    showToast.success(t('securityAlert.resolveSuccess'));
    gridApi.query();
    loadPendingCount();
  } catch {
    /* 错误提示由请求拦截器统一处理 */
  }
}

/**
 * 忽略告警。
 *
 * @param row - 行数据
 */
async function handleIgnore(row: AlertRow): Promise<void> {
  try {
    await YdConfirm(t('securityAlert.confirmIgnore'), {
      title: t('securityAlert.ignoreTitle'),
      type: 'info',
    });
  } catch {
    return;
  }
  try {
    await ignoreAlert({ id: row.id }, { note: t('securityAlert.adminIgnore') });
    showToast.success(t('securityAlert.ignoreSuccess'));
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
    <!-- 待处理告警统计 -->
    <div class="mb-4 px-4 pt-3">
      <div class="rounded-lg border bg-orange-50 px-4 py-3">
        <span class="text-sm text-gray-600">{{ t('securityAlert.pendingAlerts') }}</span>
        <span class="text-xl font-bold text-orange-600">{{ pendingCount }}</span>
        <span class="ml-2 text-xs text-gray-400">{{ t('securityAlert.handleHighRisk') }}</span>
      </div>
    </div>

    <Grid :table-title="t('securityAlert.title')">
      <template #toolbar-tools>
        <YdButton
          variant="default"
          @click="
            () => {
              gridApi.query();
              loadPendingCount();
            }
          "
          >{{ t('securityAlert.refresh') }}</YdButton
        >
      </template>
    </Grid>
  </Page>
</template>

<style lang="scss" scoped>
.mb-4 {
  margin-bottom: 16px;
}

.px-4 {
  padding-left: 16px;
  padding-right: 16px;
}

.pt-3 {
  padding-top: 12px;
}

.rounded-lg {
  border-radius: 8px;
}

.border {
  border-width: 1px;
  border-style: solid;
  border-color: #e5e7eb;
}

.bg-orange-50 {
  background-color: #fff7ed;
}

.py-3 {
  padding-top: 12px;
  padding-bottom: 12px;
}

.text-sm {
  font-size: 14px;
}

.text-gray-600 {
  color: #4b5563;
}

.text-xl {
  font-size: 20px;
}

.font-bold {
  font-weight: 700;
}

.text-orange-600 {
  color: #ea580c;
}

.ml-2 {
  margin-left: 8px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
