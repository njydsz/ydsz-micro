<!--
 * 审计详情抽屉 — 展示单条审计记录的完整字段
 *
 * @path apps\system-web\src\views\audit\audit-detail-drawer.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 审计详情抽屉
 * <p>暴露方法 open(row: AuditLog) 用于父组件打开抽屉查看单条审计记录的全部信息。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { YdBadge, YdDescriptions, YdDescriptionsItem, YdDrawer, YdEmptyState } from '@ydsz-core/ydsz-ui';

import type { AuditLog } from '#/api/models';

defineOptions({ name: 'AuditDetailDrawer' });

const { t } = useI18n();

/** 抽屉可见性 */
const visible = ref(false);

/** 当前审计记录 */
const record = ref<AuditLog | null>(null);

/** 抽屉标题 */
const drawerTitle = computed(() => {
  const id = record.value?.id ?? '';
  return `${t('audit.detail.title')} - ${id}`;
});

/** 操作类型标签配置 */
const actionTagConfig = computed(() => {
  const action = record.value?.action ?? 0;
  const map: Record<number, { i18nKey: string; variant: string }> = {
    1: { i18nKey: 'audit.action.create', variant: 'success' },
    2: { i18nKey: 'audit.action.update', variant: 'primary' },
    3: { i18nKey: 'audit.action.delete', variant: 'danger' },
    4: { i18nKey: 'audit.action.query', variant: 'info' },
    5: { i18nKey: 'audit.action.export', variant: 'warning' },
    6: { i18nKey: 'audit.action.login', variant: 'success' },
    7: { i18nKey: 'audit.action.logout', variant: 'info' },
  };
  return map[action] ?? { i18nKey: 'audit.action.query', variant: 'info' };
});

/** 状态标签配置 */
const statusTagConfig = computed(() => {
  const isSuccess = record.value?.status === 1;
  return {
    label: isSuccess ? t('audit.status.success') : t('audit.status.failed'),
    variant: isSuccess ? 'success' : 'danger',
  };
});

/**
 * 打开抽屉
 * @param row 审计记录
 */
function open(row: AuditLog): void {
  record.value = row;
  visible.value = true;
}

/** 关闭抽屉 */
function close(): void {
  visible.value = false;
}

/** 抽屉关闭后清理记录 */
watch(visible, (val) => {
  if (!val) record.value = null;
});

defineExpose({ open });
</script>

<template>
  <YdDrawer :visible="visible" :title="drawerTitle" direction="right" size="lg" @close="close">
    <div v-if="record" class="space-y-6">
      <!-- 基本信息 -->
      <YdDescriptions :column="2" bordered>
        <YdDescriptionsItem :label="t('audit.columns.id')">
          {{ record.id }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.module')">
          {{ record.module || '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.action')">
          <YdBadge :variant="actionTagConfig.variant" size="small">
            {{ t(actionTagConfig.i18nKey) }}
          </YdBadge>
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.status')">
          <YdBadge :variant="statusTagConfig.variant" size="small">
            {{ statusTagConfig.label }}
          </YdBadge>
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.operator')">
          {{ record.operatorName || '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.operatorId')">
          {{ record.operatorId || '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.time')">
          {{ record.operationTime || record.createdAt || '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.ip')">
          {{ record.ipAddress || '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.traceId')">
          {{ record.traceId || '-' }}
        </YdDescriptionsItem>
        <YdDescriptionsItem :label="t('audit.columns.businessNo')">
          {{ record.businessNo || '-' }}
        </YdDescriptionsItem>
      </YdDescriptions>

      <!-- 操作内容 -->
      <div>
        <h3 class="mb-2 text-sm font-medium text-muted-foreground">{{ t('audit.columns.content') }}</h3>
        <p class="text-sm">{{ record.content || '-' }}</p>
      </div>

      <!-- 错误信息（仅失败时显示） -->
      <div v-if="record.errorMessage && record.status !== 1">
        <h3 class="mb-2 text-sm font-medium text-muted-foreground">{{ t('audit.status.failed') }}</h3>
        <p class="text-sm text-destructive">{{ record.errorMessage }}</p>
      </div>
    </div>

    <!-- 空状态 -->
    <YdEmptyState v-else :description="t('common.noData')" />
  </YdDrawer>
</template>
