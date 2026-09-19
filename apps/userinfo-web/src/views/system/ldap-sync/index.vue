<!--
 * LDAP 同步管理页面
 *
 * <p>提供手动触发 LDAP 同步、查看同步状态、查看同步日志的操作面板。
 *
 * @path apps\userinfo-web\src\views\system\ldap-sync\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts">
/** LDAP 同步状态视图模型（对应后端 LdapSyncStatusVO） */
export interface LdapSyncStatusVo {
  status?: string;
  lastSyncTime?: string;
  nextSyncTime?: string;
  totalSynced?: number;
  successCount?: number;
  failCount?: number;
  errorMessage?: string;
}

/** 类型守卫：判定 unknown 是否为 LdapSyncStatusVo */
export function isLdapSyncStatusVo(value: unknown): value is LdapSyncStatusVo {
  return typeof value === 'object' && value !== null;
}

/** LDAP 同步日志视图模型（对应后端 LdapSyncLogVO） */
export interface LdapSyncLogVo {
  id?: string;
  syncTime?: string;
  status?: string;
  totalCount?: number;
  successCount?: number;
  failCount?: number;
  duration?: number;
  operator?: string;
  errorMessage?: string;
}

/** 类型守卫：判定 unknown 是否为 LdapSyncLogVo */
export function isLdapSyncLogVo(value: unknown): value is LdapSyncLogVo {
  return typeof value === 'object' && value !== null;
}
</script>

<script lang="ts" setup>
/**
 * LDAP 同步管理操作面板
 * <p>消费后端契约 LdapSyncController（apps/userinfo-web/src/api/ldapSync.ts）：
 * triggerSync() 触发同步，getStatus() 同步状态，getLogs() 同步日志。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { Page } from '@ydsz/common-ui';
import { YdBadge, YdButton, YdCard, YdCardContent, YdCardHeader, YdCardTitle, YdTable, YdTableColumn, YdEmptyState, YdDescriptions, YdDescriptionsItem } from '@ydsz-core/ydsz-ui';
import { Loader2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';

import { getLogs, getStatus, triggerSync } from '#/api/ldapSync';

defineOptions({ name: 'LdapSyncManagement' });

const logger = createLogger('userinfo-ldap-sync');
const { t } = useI18n();

/** 同步状态数据 */
const syncStatus = ref<LdapSyncStatusVo>({});

/** 同步日志列表 */
const syncLogs = ref<LdapSyncLogVo[]>([]);

/** 加载状态 */
const isLoading = ref(false);

/** 同步中状态 */
const isSyncing = ref(false);

/** 加载同步状态 */
async function loadStatus(): Promise<void> {
  try {
    const result = await getStatus();
    if (isLdapSyncStatusVo(result)) {
      syncStatus.value = result;
    }
  } catch (error) {
    logger.warn('加载同步状态失败: {}', error);
  }
}

/** 加载同步日志 */
async function loadLogs(): Promise<void> {
  try {
    const result = await getLogs();
    syncLogs.value = result.filter(isLdapSyncLogVo);
  } catch (error) {
    logger.warn('加载同步日志失败: {}', error);
  }
}

/** 加载全部数据 */
async function loadAll(): Promise<void> {
  isLoading.value = true;
  try {
    await Promise.all([loadStatus(), loadLogs()]);
  } finally {
    isLoading.value = false;
  }
}

/** 触发同步 */
async function handleTriggerSync(): Promise<void> {
  try {
    await YdConfirm(
      '确认触发 LDAP 立即同步？同步过程可能需要几分钟，请耐心等待。',
      '触发同步',
      { type: 'warning' },
    );
  } catch {
    return;
  }
  isSyncing.value = true;
  try {
    await triggerSync();
    showToast.success('同步任务已触发');
    // 延迟刷新状态（给后端一些时间启动同步）
    window.setTimeout(() => {
      loadAll();
    }, 2000);
  } catch (error) {
    logger.warn('触发同步失败: {}', error);
    isSyncing.value = false;
  }
}

/** 同步状态标签类型 */
function getStatusTagType(status?: string): 'success' | 'danger' | 'warning' | 'info' {
  const upper = (status ?? '').toUpperCase();
  if (upper === 'SUCCESS' || upper === 'COMPLETED') return 'success';
  if (upper === 'FAILED' || upper === 'ERROR') return 'danger';
  if (upper === 'RUNNING' || upper === 'SYNCING') return 'warning';
  return 'info';
}

/** 状态文本映射 */
function getStatusText(status?: string): string {
  const upper = (status ?? '').toUpperCase();
  const statusMap: Record<string, string> = {
    SUCCESS: '同步成功',
    COMPLETED: '已完成',
    FAILED: '同步失败',
    ERROR: '错误',
    RUNNING: '同步中',
    SYNCING: '同步中',
    IDLE: '空闲',
    PENDING: '等待中',
  };
  return statusMap[upper] ?? status ?? '未知';
}

onMounted(() => {
  loadAll();
});
</script>

<template>
  <Page loading="isLoading" auto-content-height>
    <!-- 操作面板：触发同步 -->
    <YdCard class="mb-4">
      <YdCardHeader>
        <YdCardTitle>LDAP 同步操作</YdCardTitle>
      </YdCardHeader>
      <YdCardContent class="flex items-center gap-4">
        <YdButton
          variant="default"
          :disabled="isSyncing"
          @click="handleTriggerSync"
        >
          <Loader2 v-if="isSyncing" class="mr-2 h-4 w-4 animate-spin" />
          {{ isSyncing ? '同步进行中...' : '立即触发同步' }}
        </YdButton>
        <YdButton variant="outline" @click="loadAll">
          刷新状态
        </YdButton>
        <span class="text-sm text-muted-foreground">
          上次同步时间：{{ syncStatus.lastSyncTime ?? '-' }}
        </span>
      </YdCardContent>
    </YdCard>

    <!-- 同步状态 -->
    <YdCard class="mb-4">
      <YdCardHeader class="flex flex-row items-center justify-between pb-2">
        <YdCardTitle>同步状态</YdCardTitle>
        <YdBadge :variant="getStatusTagType(syncStatus.status) === 'success' ? 'default' : getStatusTagType(syncStatus.status) === 'danger' ? 'destructive' : getStatusTagType(syncStatus.status) === 'warning' ? 'outline' : 'secondary'" :class="getStatusTagType(syncStatus.status) === 'success' ? 'bg-green-500 text-white hover:bg-green-600' : getStatusTagType(syncStatus.status) === 'warning' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-xs'">
          {{ getStatusText(syncStatus.status) }}
        </YdBadge>
      </YdCardHeader>
      <YdCardContent>
      <YdDescriptions :column="3" border>
        <YdDescriptionsItem label="当前状态">
          <YdBadge :variant="getStatusTagType(syncStatus.status) === 'success' ? 'default' : getStatusTagType(syncStatus.status) === 'danger' ? 'destructive' : getStatusTagType(syncStatus.status) === 'warning' ? 'outline' : 'secondary'" :class="getStatusTagType(syncStatus.status) === 'success' ? 'bg-green-500 text-white hover:bg-green-600' : getStatusTagType(syncStatus.status) === 'warning' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-xs'">
            {{ getStatusText(syncStatus.status) }}
          </YdBadge>
        </YdDescriptionsItem>
        <YdDescriptionsItem label="上次同步时间">
          {{ syncStatus.lastSyncTime ?? '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem label="下次同步时间">
          {{ syncStatus.nextSyncTime ?? '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem label="累计同步用户">
          {{ syncStatus.totalSynced ?? 0 }}
        </YdDescriptionsItem>
        <YdDescriptionsItem label="成功数量">
          <span class="text-green-600">{{ syncStatus.successCount ?? 0 }}</span>
        </YdDescriptionsItem>
        <YdDescriptionsItem label="失败数量">
          <span class="text-red-600">{{ syncStatus.failCount ?? 0 }}</span>
        </YdDescriptionsItem>
        <YdDescriptionsItem v-if="syncStatus.errorMessage" label="错误信息" :span="3">
          <span class="text-red-600">{{ syncStatus.errorMessage }}</span>
        </YdDescriptionsItem>
      </YdDescriptions>
      </YdCardContent>
    </YdCard>

    <!-- 同步日志 -->
    <YdCard>
      <YdCardHeader>
        <YdCardTitle>同步日志</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
      <YdTable :data="syncLogs" border max-height="400">
        <YdTableColumn type="index" label="序号" width="60" />
        <YdTableColumn prop="syncTime" label="同步时间" width="170" />
        <YdTableColumn label="状态" width="100">
          <template #default="{ row }">
            <YdBadge :variant="getStatusTagType(row.status) === 'success' ? 'default' : getStatusTagType(row.status) === 'danger' ? 'destructive' : getStatusTagType(row.status) === 'warning' ? 'outline' : 'secondary'" :class="getStatusTagType(row.status) === 'success' ? 'bg-green-500 text-white hover:bg-green-600' : getStatusTagType(row.status) === 'warning' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-xs'">
              {{ getStatusText(row.status) }}
            </YdBadge>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="totalCount" label="总数" width="80" />
        <YdTableColumn prop="successCount" label="成功" width="80">
          <template #default="{ row }">
            <span class="text-green-600">{{ row.successCount ?? 0 }}</span>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="failCount" label="失败" width="80">
          <template #default="{ row }">
            <span class="text-red-600">{{ row.failCount ?? 0 }}</span>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="duration" label="耗时(ms)" width="100" />
        <YdTableColumn prop="operator" label="操作人" width="120" />
        <YdTableColumn prop="errorMessage" label="错误信息" minWidth="150" show-overflow-tooltip />
      </YdTable>
      <YdEmptyState v-if="syncLogs.length === 0" description="暂无同步日志" :image-size="60" />
      </YdCardContent>
    </YdCard>
  </Page>
</template>
