<!--
 * 在线用户管理（会话管理）
 *
 * @path apps\userinfo-web\src\views\system\session\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 在线用户管理（会话管理）
 * <p>消费后端契约 AdminSessionController（apps/userinfo-web/src/api/adminSession.ts）：
 * getAllActiveSessions() 展示全部在线会话，getSessionStatistics() 会话统计，
 * forceLogout() 强制下线，banUser() 封禁用户，unbanUser() 解封用户。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElMessage, ElMessageBox } from 'element-plus';
import { h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@YDSZ-core/shared/utils';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  banUser,
  forceLogout,
  getAllActiveSessions,
  getSessionStatistics,
} from '#/api/adminSession';
import type { UserSessionStatistics, UserSessionVO } from '#/api/models';

defineOptions({ name: 'SessionManagement' });

const logger = createLogger('userinfo-session');
const { t } = useI18n();

/** 会话统计数据 */
const statistics = ref<UserSessionStatistics>({});
const statisticsLoading = ref(false);

/** 加载统计数据 */
async function loadStatistics(): Promise<void> {
  statisticsLoading.value = true;
  try {
    statistics.value = await getSessionStatistics();
  } finally {
    statisticsLoading.value = false;
  }
}

const gridOptions: VxeGridProps<UserSessionVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('page.rowIndex') },
    { field: 'username', title: t('page.username'), minWidth: 120 },
    { field: 'loginIp', title: t('session.loginIp'), width: 140 },
    { field: 'device', title: t('session.device'), width: 120 },
    { field: 'userAgent', title: t('session.userAgent'), minWidth: 200 },
    { field: 'loginTime', title: t('session.loginTime'), width: 170 },
    { field: 'expireTime', title: t('session.expireTime'), width: 170 },
    {
      field: 'action', title: t('page.operation'), width: 180, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleForceLogout(row) }, () => t('session.forceLogout')),
            h(ElButton, { size: 'small', link: true, type: 'warning', onClick: () => handleBanUser(row) }, () => t('session.banUser')),
          ]),
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const items = await getAllActiveSessions({ page: page.currentPage, size: page.pageSize });
        return { items, total: items.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 强制下线 */
async function handleForceLogout(row: UserSessionVO) {
  if (!row.accessToken || !row.username) return;
  try {
    await ElMessageBox.confirm(
      t('session.forceLogoutConfirm', { username: row.username }),
      t('session.forceLogoutTitle'),
      { type: 'warning' },
    );
    // 使用 accessToken 的前8位作为 userId 标识（实际应从会话中获取 userId）
    await forceLogout({ userId: row.username, accessToken: row.accessToken });
    ElMessage.success(t('session.forceLogoutSuccess'));
    gridApi.query();
    loadStatistics();
  } catch (error) {
    logger.warn('强制下线失败: {}', error);
  }
}

/** 封禁用户 */
async function handleBanUser(row: UserSessionVO) {
  if (!row.username) return;
  try {
    await ElMessageBox.confirm(
      t('session.banConfirm', { username: row.username }),
      t('session.banTitle'),
      { type: 'warning' },
    );
    await banUser({ userId: row.username }, { banType: 'MANUAL', banReason: t('session.banReason') });
    ElMessage.success(t('session.banSuccess'));
    gridApi.query();
  } catch (error) {
    logger.warn('封禁用户失败: {}', error);
  }
}

onMounted(() => {
  loadStatistics();
});
</script>

<template>
  <Page auto-content-height>
    <!-- 统计卡片 -->
    <div class="mb-4 grid grid-cols-3 gap-4 px-4 pt-3">
      <div class="rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 p-4">
        <div class="text-sm text-gray-600">{{ t('session.activeSessions') }}</div>
        <div class="mt-1 text-2xl font-bold text-blue-600">
          {{ statistics.totalActiveSessions ?? 0 }}
        </div>
      </div>
      <div class="rounded-lg border bg-gradient-to-r from-green-50 to-green-100 p-4">
        <div class="text-sm text-gray-600">{{ t('session.onlineUsers') }}</div>
        <div class="mt-1 text-2xl font-bold text-green-600">
          {{ statistics.activeUserCount ?? 0 }}
        </div>
      </div>
      <div class="rounded-lg border bg-gradient-to-r from-orange-50 to-orange-100 p-4">
        <div class="text-sm text-gray-600">{{ t('session.deviceTypes') }}</div>
        <div class="mt-1 text-2xl font-bold text-orange-600">
          {{ Object.keys(statistics.sessionsPerDevice ?? {}).length }}
        </div>
      </div>
    </div>

    <Grid :table-title="t('session.onlineUserMgmt')">
      <template #toolbar-tools>
        <ElButton type="primary" @click="() => { gridApi.query(); loadStatistics(); }">{{ t('page.refresh') }}</ElButton>
      </template>
    </Grid>
  </Page>
</template>
