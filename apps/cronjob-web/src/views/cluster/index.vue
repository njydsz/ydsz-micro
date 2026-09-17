<!--
 * 集群迁移管理
 *
 * <p>提供定时任务的集群漂移配置与操作，支持查询可用目标集群、触发迁移、查看迁移开关状态。
 * <p>对应后端契约 ClusterMigrationController（apps/cronjob-web/src/api/clusterMigration.ts）。
 *
 * @path apps\cronjob-web\src\views\cluster\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 集群迁移管理
 * <p>消费后端契约 ClusterMigrationController（apps/cronjob-web/src/api/clusterMigration.ts）：
 * listClusters() 查询可用集群、enabled() 查询漂移开关状态、migrate() 触发迁移。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { Page } from '@ydsz/common-ui';
import { Badge, Button, Input } from '@ydsz-core/ui-kit/shadcn-ui';
// TODO: ElSwitch 暂无 shadcn 对应;保留 element-plus SKIP
import { ElSwitch } from 'element-plus';
import { h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { useYDSZVxeGrid } from '#/adapter/vxe-table';
import { enabled, listClusters, migrate } from '#/api/clusterMigration';
import { page as listJobs } from '#/api/job';
import type { JobVO } from '#/api/models';

import { createLogger } from '@ydsz-core/shared/utils';

const logger = createLogger('cronjob-cluster');

defineOptions({ name: 'ClusterMigration' });

const { t } = useI18n();

/** 可用目标集群列表 */
const clusterList = ref<string[]>([]);
const clusterLoading = ref(false);

/** 集群漂移开关状态 */
const migrationEnabled = ref(false);
const enabledLoading = ref(false);

/** 目标集群名称 */
const targetCluster = ref('');

/** 迁移执行中 */
const migrating = ref(false);

/** 任务行类型 */
type JobRow = JobVO & { status?: string };

/** 判断任务当前是否为「已暂停」 */
function isPaused(row: JobRow): boolean {
  const status = row.status;
  return status === 'PAUSED' || status === 'DISABLED' || status === '0';
}

const gridOptions: VxeTableGridOptions<JobRow> = {
  columns: [
    { type: 'checkbox', width: 50 },
    { type: 'seq', width: 50, title: t('common.seq') },
    { field: 'jobName', title: '任务名称', minWidth: 180 },
    { field: 'jobKey', title: '任务标识', width: 160 },
    { field: 'jobGroup', title: '分组', width: 100 },
    { field: 'cronExpression', title: 'Cron', width: 160 },
    {
      field: 'status',
      title: t('common.status'),
      width: 90,
      slots: {
        default: ({ row }) => {
          const job = row as JobRow;
          return h(ElTag, { type: isPaused(job) ? 'info' : 'success' }, () =>
            isPaused(job) ? '已暂停' : '运行中',
          );
        },
      },
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20, pageSizes: [10, 20, 50, 100] },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const res = await listJobs({ pageNum: page.currentPage, pageSize: page.pageSize, ...formValues });
        return { items: res.data ?? [], total: res.total ?? 0 };
      },
    },
  },
  toolbarConfig: { refresh: { code: 'query' }, zoom: true },
  formConfig: {
    enabled: true,
    items: [
      { field: 'jobName', title: '任务名称', itemRender: { name: 'Input', props: { placeholder: '请输入任务名称' } } },
    ],
  },
  checkboxConfig: { reserve: true, strict: false },
};

const [Grid, gridApi] = useYDSZVxeGrid({ gridOptions });

/** 加载可用集群列表 */
async function loadClusters(): Promise<void> {
  clusterLoading.value = true;
  try {
    clusterList.value = await listClusters();
  } catch (e) {
    logger.warn('加载集群列表失败', e);
  } finally {
    clusterLoading.value = false;
  }
}

/** 加载集群漂移开关状态 */
async function loadEnabledStatus(): Promise<void> {
  enabledLoading.value = true;
  try {
    migrationEnabled.value = await enabled();
  } catch (e) {
    logger.warn('加载集群漂移开关失败', e);
  } finally {
    enabledLoading.value = false;
  }
}

/** 触发集群迁移 */
async function handleMigrate(): Promise<void> {
  const selection = gridApi.grid?.getCheckboxRecords() ?? [];
  if (selection.length === 0) {
    showToast.warning('请先选择要迁移的任务');
    return;
  }
  if (!targetCluster.value) {
    showToast.warning('请选择目标集群');
    return;
  }
  const jobIds = selection.map((row) => row.id ?? '').filter(Boolean);
  try {
    await ydszConfirm(
      `确定将选中的 ${jobIds.length} 个任务迁移到集群「${targetCluster.value}」？`,
      '集群迁移确认',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  migrating.value = true;
  try {
    const result = await migrate({
      jobIds,
      targetCluster: targetCluster.value,
    });
    showToast.success(`迁移成功 ${result.successCount ?? 0} 个，失败 ${result.failCount ?? 0} 个`);
    gridApi.query();
  } catch (e) {
    logger.warn('集群迁移失败', e);
  } finally {
    migrating.value = false;
  }
}

onMounted(() => {
  loadClusters();
  loadEnabledStatus();
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="集群迁移管理">
      <template #toolbar-tools>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <ElSwitch
              v-model="migrationEnabled"
              :loading="enabledLoading"
              active-text="漂移已启用"
              inactive-text="漂移已禁用"
              disabled
            />
          </div>
          <Input
            v-model="targetCluster"
            placeholder="请输入目标集群名称"
            class="!w-48"
          />
          <Button
            :loading="migrating"
            :disabled="!targetCluster"
            @click="handleMigrate"
          >
            执行迁移
          </Button>
        </div>
      </template>
    </Grid>

    <!-- 可用集群列表 -->
    <div v-if="clusterList.length > 0" class="mt-4 rounded border bg-gray-50 p-3">
      <div class="mb-2 text-xs font-medium text-gray-600">可用目标集群：</div>
      <div class="flex flex-wrap gap-2">
        <Badge v-for="cluster in clusterList" :key="cluster" variant="secondary">{{ cluster }}</Badge>
      </div>
    </div>
  </Page>
</template>
