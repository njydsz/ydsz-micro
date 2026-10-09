<!--
 * 分布式锁管理页面 — 实时查看当前持有的分布式锁、强制释放、锁统计
 *
 * <p>展示活跃分布式锁列表、持有者分布、TTL 倒计时，并提供强制释放入口。
 * 数据来源：后端 {@code LockAdminController}（src/api/lock-admin.ts），30s 自动刷新。
 *
 * @path apps/system-web/src/views/lock-admin/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 分布式锁管理（列表页）
 * <p>消费后端契约 LockAdminController（src/api/lock-admin.ts）的分页列表与统计端点：
 * 分页查询 listLocks、统计 getLockStats、强制释放 releaseLock。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';

import { YdBadge, YdButton, YdCard, YdEmptyState } from '@ydsz-core/ydsz-ui';
import { computed, h, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAccess } from '@ydsz/access';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { getLockStats, listLocks, releaseLock } from '#/api/lock-admin';
import type { LockPageQuery, LockStatsVO, LockVO, PageQuery } from '#/api/lock-admin';

defineOptions({ name: 'LockAdminManagement' });

const { t } = useI18n();

/** 按钮级权限判断 */
const { hasAccessByCodesAll } = useAccess();

/** 行类型：分布式锁 VO */
type LockRow = LockVO;

/** 分页查询参数 */
type LockPageQueryParams = LockPageQuery & PageQuery;

/** 统计数据 */
const stats = ref<LockStatsVO | null>(null);
/** 统计加载状态 */
const statsLoading = ref(false);
/** 错误态 */
const loadError = ref<string | null>(null);

/**
 * 加载锁统计数据
 *
 * <p>调用后端 {@code GET /system/lock/stats} 获取活跃锁数量、已超时数量、持有者分布。
 */
async function loadStats() {
  statsLoading.value = true;
  try {
    stats.value = await getLockStats();
  } catch {
    // 统计加载失败不影响列表展示
    stats.value = null;
  } finally {
    statsLoading.value = false;
  }
}

/**
 * 加载分页列表与统计数据
 */
async function loadAll() {
  loadError.value = null;
  await loadStats();
  // 列表加载由 gridApi 自行管理
}

const gridOptions: VxeTableGridOptions<LockRow> = {
  columns: [
    { type: 'seq', width: 50, title: t('common.columns.seq') },
    {
      field: 'lockKey',
      title: t('lockAdmin.lockKey'),
      minWidth: 240,
    },
    {
      field: 'owner',
      title: t('lockAdmin.owner'),
      width: 200,
    },
    {
      field: 'acquiredAt',
      title: t('lockAdmin.acquiredAt'),
      width: 170,
    },
    {
      field: 'expiresAt',
      title: t('lockAdmin.expiresAt'),
      width: 170,
    },
    {
      field: 'remainingTtlMs',
      title: t('lockAdmin.remainingTtl'),
      width: 120,
      slots: {
        default: ({ row }) => {
          const lock = row as LockRow;
          return h(
            'span',
            {
              class: getTtlClass(lock.remainingTtlMs),
            },
            formatTtl(lock.remainingTtlMs),
          );
        },
      },
    },
    {
      field: 'reentrantCount',
      title: t('lockAdmin.reentrantCount'),
      width: 90,
      slots: {
        default: ({ row }) => {
          const lock = row as LockRow;
          const count = lock.reentrantCount ?? 1;
          return h(
            YdBadge,
            { variant: count > 1 ? 'warning' : undefined },
            () => String(count),
          );
        },
      },
    },
    {
      field: 'action',
      title: t('common.actions'),
      width: 120,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          const lock = row as LockRow;
          if (!hasAccessByCodesAll(['sys:lock:release'])) {
            return null;
          }
          return h(
            'div',
            { class: 'flex gap-1' },
            [
              h(
                YdButton,
                {
                  size: 'sm',
                  variant: 'destructive',
                  onClick: () => handleReleaseLock(lock),
                },
                () => t('lockAdmin.release'),
              ),
            ],
          );
        },
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page: pageInfo }, formValues) => {
        const query: LockPageQueryParams = {
          pageNum: pageInfo.currentPage,
          pageSize: pageInfo.pageSize,
          ...formValues,
        };
        try {
          const res = await listLocks({ query });
          return { items: res.data ?? [], total: res.total ?? 0 };
        } catch (error) {
          const msg = error instanceof Error ? error.message : t('common.noData');
          loadError.value = msg;
          return { items: [], total: 0 };
        }
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, search: true, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'lockKey', title: t('lockAdmin.lockKey'), itemRender: { name: 'YdInput', props: { placeholder: t('lockAdmin.lockKeyPlaceholder') } } },
      { field: 'owner', title: t('lockAdmin.owner'), itemRender: { name: 'YdInput', props: { placeholder: t('lockAdmin.ownerPlaceholder') } } },
    ],
  },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/**
 * 格式化 TTL 毫秒为可读字符串
 *
 * @param ttlMs - 剩余 TTL（毫秒）
 * @returns 格式化的人类可读字符串
 */
function formatTtl(ttlMs: number | undefined): string {
  if (ttlMs == null) return '-';
  if (ttlMs <= 0) return t('lockAdmin.ttlExpired');
  const seconds = Math.floor(ttlMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  return `${minutes}m${remSeconds}s`;
}

/**
 * 根据剩余 TTL 获取样式类别
 *
 * <p>剩余 TTL < 30s 显示警告红色，< 2min 显示提醒橙色，其他为正常色。
 *
 * @param ttlMs - 剩余 TTL（毫秒）
 */
function getTtlClass(ttlMs: number | undefined): string {
  if (ttlMs == null) return '';
  if (ttlMs <= 0) return 'text-red-500 font-semibold';
  if (ttlMs < 30000) return 'text-red-500 font-semibold';
  if (ttlMs < 120000) return 'text-yellow-500 font-semibold';
  return 'text-green-600';
}

/**
 * 强制释放分布式锁
 *
 * <p>弹出二次确认，用户确认后调用后端 DELETE 接口。
 * 失败提示由错误响应拦截器统一处理。
 *
 * @param row - 待释放的锁行
 */
async function handleReleaseLock(row: LockRow) {
  // 步骤1：确认弹窗（用户取消直接返回）
  try {
    await YdConfirm(
      t('lockAdmin.releaseConfirm', [row.lockKey ?? '']),
      { title: t('lockAdmin.releaseTitle'), type: 'warning' },
    );
  } catch {
    return; // 用户主动取消操作
  }
  // 步骤2：执行释放 API
  try {
    await releaseLock({ lockKey: row.lockKey ?? '' });
    showToast.success(t('operationSuccess'));
    gridApi.query();
    loadStats();
  } catch {
    // 错误已由请求拦截器展示，无需重复处理
  }
}

/** 自动刷新定时器 */
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  loadAll();
  timer = setInterval(() => {
    loadStats();
    gridApi.query();
  }, 30000);
});

onUnmounted(() => {
  if (timer !== undefined) {
    clearInterval(timer);
  }
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex flex-col gap-5">
      <!-- 顶部统计卡片 -->
      <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
        <!-- 活跃锁数量 -->
        <YdCard shadow="hover">
          <div class="text-center p-2">
            <div class="text-sm text-gray-500">{{ t('lockAdmin.activeLockCount') }}</div>
            <div v-if="statsLoading" class="text-2xl font-bold mt-2">
              <span class="text-gray-400">--</span>
            </div>
            <div v-else class="text-2xl font-bold mt-2">
              {{ stats?.activeLockCount ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">{{ t('lockAdmin.realTime') }}</div>
          </div>
        </YdCard>

        <!-- 已超时数量 -->
        <YdCard shadow="hover">
          <div class="text-center p-2">
            <div class="text-sm text-gray-500">{{ t('lockAdmin.expiredCount') }}</div>
            <div v-if="statsLoading" class="text-2xl font-bold mt-2">
              <span class="text-gray-400">--</span>
            </div>
            <div
              v-else
              class="text-2xl font-bold mt-2"
              :class="(stats?.expiredCount ?? 0) > 0 ? 'text-red-500' : ''"
            >
              {{ stats?.expiredCount ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">{{ t('lockAdmin.aboutToExpire') }}</div>
          </div>
        </YdCard>

        <!-- 持有者分布 -->
        <YdCard shadow="hover">
          <div class="p-2">
            <div class="text-sm text-gray-500 mb-2">{{ t('lockAdmin.ownerDistribution') }}</div>
            <div v-if="statsLoading" class="text-gray-400 text-sm">--</div>
            <div
              v-else-if="stats?.ownerDistribution && Object.keys(stats.ownerDistribution).length > 0"
              class="space-y-1.5 max-h-20 overflow-y-auto"
            >
              <div
                v-for="(count, instance) in stats.ownerDistribution"
                :key="instance"
                class="flex items-center gap-2 text-xs"
              >
                <span class="truncate flex-1 text-gray-600 dark:text-gray-400" :title="instance">
                  {{ instance }}
                </span>
                <YdBadge variant="secondary">{{ count }}</YdBadge>
              </div>
            </div>
            <div v-else class="text-xs text-gray-400">{{ t('common.noData') }}</div>
          </div>
        </YdCard>
      </div>

      <!-- 错误提示 -->
      <YdEmptyState
        v-if="loadError"
        :description="loadError"
        class="border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/10 dark:border-red-800"
      />

      <!-- 锁列表表格 -->
      <Grid :table-title="t('lockAdmin.title')">
        <template #toolbar-tools>
          <YdButton size="sm" :loading="statsLoading" @click="loadAll">
            {{ t('common.buttons.refresh') }}
          </YdButton>
        </template>
        <template #empty>
          <YdEmptyState :description="t('lockAdmin.emptyText')" />
        </template>
      </Grid>
    </div>
  </Page>
</template>
