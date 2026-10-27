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
import { YdButton, YdInput } from '@ydsz-core/ydsz-ui';
import { h, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { showToast } from '@ydsz/notification';
import { YdConfirm } from '@ydsz-core/popup-ui';
import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { listByResourceKey, rollback } from '#/api/configVersion';
import type { EntityVersionVO } from '#/api/models';

defineOptions({ name: 'ConfigVersionManagement' });

const { t } = useI18n();

/** 资源Key输入 */
const resourceKey = ref('');
/** 版本列表 */
const versionList = ref<EntityVersionVO[]>([]);
/** 加载状态 */
const loading = ref(false);

const gridOptions: VxeGridProps<EntityVersionVO> = {
  columns: [
    { type: 'seq', width: 50, title: t('seq') },
    { field: 'version', title: t('configVersion.version'), width: 100 },
    { field: 'resourceType', title: t('configVersion.resourceType'), width: 120 },
    { field: 'resourceKey', title: t('configVersion.resourceKey'), minWidth: 160 },
    { field: 'resourceGroup', title: t('configVersion.resourceGroup'), width: 120 },
    { field: 'changeLog', title: t('configVersion.changeLog'), minWidth: 200 },
    { field: 'effectiveDate', title: t('configVersion.effectiveDate'), width: 170 },
    {
      field: 'action', title: t('action'), width: 120, fixed: 'right',
      slots: {
        default: ({ row }) =>
          h('div', { class: 'flex gap-1' }, [
            h(YdButton, { size: 'sm', variant: 'destructive', onClick: () => handleRollback(row) }, () => t('configVersion.rollback')),
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
    showToast.warning(t('configVersion.resourceKeyRequired'));
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
    await YdConfirm(
      t('configVersion.rollbackConfirm', {
        version: row.version ?? '',
        changeLog: row.changeLog ?? '-',
      }),
      t('configVersion.rollbackTitle'),
      { type: 'warning' },
    );
    await rollback({ resourceKey: resourceKey.value }, { targetVersion: row.version });
    showToast.success(t('operationSuccess'));
    await handleQuery();
  } catch { /* 错误提示由请求拦截器统一处理 */ }
}
</script>

<template>
  <Page auto-content-height>
    <!-- 搜索头部 -->
    <div class="mb-4 flex items-center gap-3 px-4 pt-3">
      <YdInput
        v-model="resourceKey"
        :placeholder="t('configVersion.resourceKeyPlaceholder')"
        class="w-80"
        @keyup.enter="handleQuery"
      />
        <YdButton :loading="loading" @click="handleQuery">{{ t('configVersion.queryHistory') }}</YdButton>
    </div>

    <Grid :table-title="t('configVersion.tableTitle')">
      <template #toolbar-tools>
        <YdButton @click="handleQuery">{{ t('refresh') }}</YdButton>
      </template>
    </Grid>
  </Page>
</template>
