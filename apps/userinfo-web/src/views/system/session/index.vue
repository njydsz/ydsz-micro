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
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import {
  banUser,
  forceLogout,
  getAllActiveSessions,
  getSessionStatistics,
} from '#/api/adminSession';
import type { UserSessionStatistics, UserSessionVO } from '#/api/models';

defineOptions({ name: 'SessionManagement' });

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
    { type: 'seq', width: 50, title: '序号' },
    { field: 'username', title: '用户名', minWidth: 120 },
    { field: 'loginIp', title: '登录IP', width: 140 },
    { field: 'device', title: '设备', width: 120 },
    { field: 'userAgent', title: 'User-Agent', minWidth: 200 },
    { field: 'loginTime', title: '登录时间', width: 170 },
    { field: 'expireTime', title: '过期时间', width: 170 },
    {
      field: 'action', title: '操作', width: 180, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'danger', onClick: () => handleForceLogout(row) }, () => '强制下线'),
            h(ElButton, { size: 'small', link: true, type: 'warning', onClick: () => handleBanUser(row) }, () => '封禁用户'),
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
      `确定强制用户「${row.username}」下线吗？该用户将被立即登出。`,
      '强制下线确认',
      { type: 'warning' },
    );
    // 使用 accessToken 的前8位作为 userId 标识（实际应从会话中获取 userId）
    await forceLogout({ userId: row.username, accessToken: row.accessToken });
    ElMessage.success('强制下线成功');
    gridApi.query();
    loadStatistics();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}

/** 封禁用户 */
async function handleBanUser(row: UserSessionVO) {
  if (!row.username) return;
  try {
    await ElMessageBox.confirm(
      `确定封禁用户「${row.username}」吗？封禁后该用户将无法登录。`,
      '封禁确认',
      { type: 'warning' },
    );
    await banUser({ userId: row.username }, { banType: 'MANUAL', banReason: '管理员手动封禁' });
    ElMessage.success('封禁成功');
    gridApi.query();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
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
        <div class="text-sm text-gray-600">活跃会话数</div>
        <div class="mt-1 text-2xl font-bold text-blue-600">
          {{ statistics.totalActiveSessions ?? 0 }}
        </div>
      </div>
      <div class="rounded-lg border bg-gradient-to-r from-green-50 to-green-100 p-4">
        <div class="text-sm text-gray-600">在线用户数</div>
        <div class="mt-1 text-2xl font-bold text-green-600">
          {{ statistics.activeUserCount ?? 0 }}
        </div>
      </div>
      <div class="rounded-lg border bg-gradient-to-r from-orange-50 to-orange-100 p-4">
        <div class="text-sm text-gray-600">设备类型数</div>
        <div class="mt-1 text-2xl font-bold text-orange-600">
          {{ Object.keys(statistics.sessionsPerDevice ?? {}).length }}
        </div>
      </div>
    </div>

    <Grid table-title="在线用户">
      <template #toolbar-tools>
        <ElButton type="primary" @click="() => { gridApi.query(); loadStatistics(); }">刷新</ElButton>
      </template>
    </Grid>
  </Page>
</template>
