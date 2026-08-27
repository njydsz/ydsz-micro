<!--
 * 配置版本管理（列表页）
 *
 * @path apps\system-web\src\views\config-version\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 配置版本管理（列表页）
 * <p>消费后端契约 ConfigVersionController（apps/system-web/src/api/configVersion.ts）：
 * listByResourceKey() 查询配置版本历史，rollback() 回滚到指定版本。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeGridProps } from '@ydsz/plugins/vxe-table';
import { Page } from '@ydsz/common-ui';
import { ElButton, ElInput, ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { h, ref } from 'vue';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { listByResourceKey, rollback } from '#/api/configVersion';
import type { EntityVersionVO } from '#/api/models';

defineOptions({ name: 'ConfigVersionManagement' });

/** 资源Key输入 */
const resourceKey = ref('');
/** 版本列表 */
const versionList = ref<EntityVersionVO[]>([]);
/** 加载状态 */
const loading = ref(false);

const gridOptions: VxeGridProps<EntityVersionVO> = {
  columns: [
    { type: 'seq', width: 50, title: '序号' },
    { field: 'version', title: '版本号', width: 100 },
    { field: 'resourceType', title: '资源类型', width: 120 },
    { field: 'resourceKey', title: '资源Key', minWidth: 160 },
    { field: 'resourceGroup', title: '资源分组', width: 120 },
    { field: 'changeLog', title: '变更说明', minWidth: 200 },
    { field: 'effectiveDate', title: '生效时间', width: 170 },
    {
      field: 'action', title: '操作', width: 120, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(ElButton, { size: 'small', link: true, type: 'warning', onClick: () => handleRollback(row) }, () => '回滚'),
          ]),
      },
    },
  ],
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        return { items: versionList.value, total: versionList.value.length };
      },
    },
  },
  toolbarConfig: { custom: true, refresh: { code: 'query' }, zoom: true },
};
const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 查询版本历史 */
async function handleQuery(): Promise<void> {
  if (!resourceKey.value.trim()) {
    ElMessage.warning('请输入资源Key');
    return;
  }
  loading.value = true;
  try {
    versionList.value = await listByResourceKey({ resourceKey: resourceKey.value.trim() });
    gridApi.query();
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 回滚到指定版本 */
async function handleRollback(row: EntityVersionVO): Promise<void> {
  if (!resourceKey.value || !row.version) return;
  try {
    await ElMessageBox.confirm(
      `确定回滚到版本 ${row.version} 吗？回滚后当前配置将被覆盖。`,
      '回滚确认',
      { type: 'warning' },
    );
    await rollback({ resourceKey: resourceKey.value }, { targetVersion: row.version });
    ElMessage.success('回滚成功');
    await handleQuery();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索头部 -->
    <div class="mb-4 flex items-center gap-3 px-4 pt-3">
      <ElInput
        v-model="resourceKey"
        placeholder="请输入资源Key（如：system.mail.smtp）"
        clearable
        class="w-80"
        @keyup.enter="handleQuery"
      />
      <ElButton type="primary" :loading="loading" @click="handleQuery">查询版本历史</ElButton>
    </div>

    <Grid table-title="配置版本历史">
      <template #toolbar-tools>
        <ElButton type="primary" @click="handleQuery">刷新</ElButton>
      </template>
    </Grid>
  </Page>
</template>
