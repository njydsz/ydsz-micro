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
import { Loader2 } from '@ydsz/icons';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';
import { showToast } from '@ydsz/notification';
import { YdConfirm } from '@ydsz-core/popup-ui';

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
    await YdConfirm(t('ldap.triggerConfirm'), t('ldap.triggerTitle'), {
      type: 'warning',
    });
  } catch {
    return;
  }
  isSyncing.value = true;
  try {
    await triggerSync();
    showToast.success(t('ldap.triggerSuccess'));
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

/** 状态文本映射（后端枚举值 → 词典 key） */
const STATUS_TEXT_KEYS: Record<string, string> = {
  COMPLETED: 'ldap.status.completed',
  ERROR: 'ldap.status.error',
  FAILED: 'ldap.status.failed',
  IDLE: 'ldap.status.idle',
  PENDING: 'ldap.status.pending',
  RUNNING: 'ldap.status.running',
  SUCCESS: 'ldap.status.success',
  SYNCING: 'ldap.status.syncing',
};

/** 状态文本映射 */
function getStatusText(status?: string): string {
  const upper = (status ?? '').toUpperCase();
  const key = STATUS_TEXT_KEYS[upper];
  if (key) return t(key);
  return status || t('ldap.status.unknown');
}

onMounted(() => {
  loadAll();
});
</script>

<template>
  <Page v-loading="isLoading" auto-content-height>
    <!-- 操作面板：触发同步 -->
    <YdCard class="mb-4">
      <YdCardHeader>
        <YdCardTitle>{{ t('ldap.ldapSyncTitle') }}</YdCardTitle>
      </YdCardHeader>
      <YdCardContent class="flex items-center gap-5">
        <YdButton
          variant="default"
          :disabled="isSyncing"
          @click="handleTriggerSync"
        >
          <Loader2 v-if="isSyncing" class="mr-2 h-4 w-4 animate-spin" />
          {{ isSyncing ? t('ldap.syncing') : t('ldap.triggerSync') }}
        </YdButton>
        <YdButton variant="outline" @click="loadAll">
          {{ t('ldap.refreshStatus') }}
        </YdButton>
        <span class="text-sm text-muted-foreground">
          {{ t('ldap.lastSyncTime', { time: syncStatus.lastSyncTime ?? '-' }) }}
        </span>
      </YdCardContent>
    </YdCard>

    <!-- 同步状态 -->
    <YdCard class="mb-4">
      <YdCardHeader class="flex flex-row items-center justify-between pb-2">
        <YdCardTitle>{{ t('ldap.syncStatus') }}</YdCardTitle>
        <YdBadge :variant="getStatusTagType(syncStatus.status) === 'success' ? 'default' : getStatusTagType(syncStatus.status) === 'danger' ? 'destructive' : getStatusTagType(syncStatus.status) === 'warning' ? 'outline' : 'secondary'" :class="getStatusTagType(syncStatus.status) === 'success' ? 'bg-green-500 text-white hover:bg-green-600' : getStatusTagType(syncStatus.status) === 'warning' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-xs'">
          {{ getStatusText(syncStatus.status) }}
        </YdBadge>
      </YdCardHeader>
      <YdCardContent>
      <YdDescriptions :column="3" border>
        <YdDescriptionsItem :label="t('ldap.currentStatus')">
          <YdBadge :variant="getStatusTagType(syncStatus.status) === 'success' ? 'default' : getStatusTagType(syncStatus.status) === 'danger' ? 'destructive' : getStatusTagType(syncStatus.status) === 'warning' ? 'outline' : 'secondary'" :class="getStatusTagType(syncStatus.status) === 'success' ? 'bg-green-500 text-white hover:bg-green-600' : getStatusTagType(syncStatus.status) === 'warning' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-xs'">
            {{ getStatusText(syncStatus.status) }}
          </YdBadge>
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('ldap.lastSyncTimeLabel')">
          {{ syncStatus.lastSyncTime ?? '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('ldap.nextSyncTime')">
          {{ syncStatus.nextSyncTime ?? '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('ldap.totalSynced')">
          {{ syncStatus.totalSynced ?? 0 }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('ldap.successCount')">
          <span class="text-green-600">{{ syncStatus.successCount ?? 0 }}</span>
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('ldap.failCount')">
          <span class="text-red-600">{{ syncStatus.failCount ?? 0 }}</span>
        </YdDescriptionsItem>
        <YdDescriptionsItem v-if="syncStatus.errorMessage" :label="t('ldap.errorMessage')" :span="3">
          <span class="text-red-600">{{ syncStatus.errorMessage }}</span>
        </YdDescriptionsItem>
      </YdDescriptions>
      </YdCardContent>
    </YdCard>

    <!-- 同步日志 -->
    <YdCard>
      <YdCardHeader>
        <YdCardTitle>{{ t('ldap.syncLogs') }}</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
      <YdTable :data="syncLogs" border max-height="400">
        <YdTableColumn type="index" :label="t('page.rowIndex')" width="60" />
        <YdTableColumn prop="syncTime" :label="t('ldap.syncTime')" width="170" />
        <YdTableColumn :label="t('page.status')" width="100">
          <template #default="{ row }">
            <YdBadge :variant="getStatusTagType(row.status) === 'success' ? 'default' : getStatusTagType(row.status) === 'danger' ? 'destructive' : getStatusTagType(row.status) === 'warning' ? 'outline' : 'secondary'" :class="getStatusTagType(row.status) === 'success' ? 'bg-green-500 text-white hover:bg-green-600' : getStatusTagType(row.status) === 'warning' ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' : 'text-xs'">
              {{ getStatusText(row.status) }}
            </YdBadge>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="totalCount" :label="t('ldap.total')" width="80" />
        <YdTableColumn prop="successCount" :label="t('security.success')" width="80">
          <template #default="{ row }">
            <span class="text-green-600">{{ row.successCount ?? 0 }}</span>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="failCount" :label="t('security.fail')" width="80">
          <template #default="{ row }">
            <span class="text-red-600">{{ row.failCount ?? 0 }}</span>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="duration" :label="t('ldap.duration')" width="100" />
        <YdTableColumn prop="operator" :label="t('ldap.operator')" width="120" />
        <YdTableColumn prop="errorMessage" :label="t('ldap.errorMessage')" minWidth="150" show-overflow-tooltip />
      </YdTable>
      <YdEmptyState v-if="syncLogs.length === 0" :description="t('ldap.noLogs')" :image-size="60" />
      </YdCardContent>
    </YdCard>
  </Page>
</template>
