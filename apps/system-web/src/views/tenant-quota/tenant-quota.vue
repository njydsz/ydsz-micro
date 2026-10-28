<!--
 * 租户配额管理页面 —— 展示租户资源配额使用情况
 *
 * <p>展示知识库数、智能体数、存储空间、月 API 调用量四项配额的使用率进度条，
 * 在 ≥80% 显示 warning 样式，≥100% 显示 danger 样式。
 *
 * @path apps\system-web\src\views\tenant-quota\tenant-quota.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { YdButton, YdCard } from '@ydsz-core/ydsz-ui';
import { useI18n } from 'vue-i18n';

import { showToast } from '@ydsz/notification';

import { requestClient } from '#/api/request';

defineOptions({ name: 'TenantQuota' });

const { t } = useI18n();

/** 配额项数据模型 */
interface QuotaItem {
  /** 配额项 key */
  key: string;
  /** 配额标签 i18n key */
  labelKey: string;
  /** 当前使用量 */
  used: number;
  /** 配额上限（-1 表示无限制） */
  limit: number;
  /** 单位 i18n key 或空字符串 */
  unitKey: string;
}

/** 配额数据 */
const quotas = ref<QuotaItem[]>([]);
/** 加载状态 */
const loading = ref(false);

/**
 * 从后端加载配额数据。
 */
async function fetchQuotas(): Promise<void> {
  loading.value = true;
  try {
    const data = await requestClient.get<QuotaItem[]>(
      '/tenant/quota',
    );
    quotas.value = data;
  } catch {
    showToast.warning(t('tenantQuota.loadFailed'));
  } finally {
    loading.value = false;
  }
}

/**
 * 计算百分比（0-100）。
 *
 * @param used - 已使用量
 * @param limit - 上限（-1 表示无限制）
 * @returns 百分比整数
 */
function calcPercent(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }
  return Math.min(Math.round((used / limit) * 100), 100);
}

/**
 * 根据使用率返回进度条状态色。
 *
 * @param percent - 使用率百分比
 * @returns 'warning' | 'danger' | 'success'
 */
function progressStatus(percent: number): 'warning' | 'danger' | 'success' {
  if (percent >= 100) {
    return 'danger';
  }
  if (percent >= 80) {
    return 'warning';
  }
  return 'success';
}

/**
 * 跳转申请提升流程（声明式占位，实际由运维工单系统承接）。
 */
function handleApplyUpgrade(): void {
  showToast.warning(t('tenantQuota.applyUpgradeDesc'));
}

onMounted(() => {
  void fetchQuotas();
});
</script>

<template>
  <div class="tenant-quota-page">
    <YdCard shadow="never" class="quota-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">{{ t('tenantQuota.title') }}</span>
          <span class="card-desc">{{ t('tenantQuota.desc') }}</span>
        </div>
      </template>

      <el-empty v-if="!loading && quotas.length === 0" :description="t('business.noData')" />

      <div
        v-for="item in quotas"
        :key="item.key"
        class="quota-item"
      >
        <div class="quota-item-header">
          <span class="quota-item-label">{{ t(item.labelKey) }}</span>
          <span class="quota-item-value">
            <template v-if="item.limit < 0">
              {{ item.used }}{{ t(item.unitKey) }} / {{ t('tenantQuota.unlimited') }}
            </template>
            <template v-else>
              {{ item.used }}{{ t(item.unitKey) }} / {{ item.limit }}{{ t(item.unitKey) }}
            </template>
          </span>
        </div>

        <el-progress
          v-if="item.limit > 0"
          :percentage="calcPercent(item.used, item.limit)"
          :status="progressStatus(calcPercent(item.used, item.limit))"
          :stroke-width="14"
          striped
        />
        <el-progress
          v-else
          :percentage="0"
          :stroke-width="14"
        />

        <div v-if="calcPercent(item.used, item.limit) >= 80 && item.limit > 0" class="quota-warning-text">
          <el-icon class="warning-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </el-icon>
          {{ t('tenantQuota.applyUpgradeDesc') }}
        </div>
      </div>
    </YdCard>

    <!-- 申请提升 -->
    <div class="action-bar">
      <YdButton
        :loading="loading"
        plain
        @click="fetchQuotas"
      >
        {{ t('common.buttons.refresh') }}
      </YdButton>
      <YdButton type="primary" @click="handleApplyUpgrade">
        {{ t('tenantQuota.applyUpgrade') }}
      </YdButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tenant-quota-page {
  max-width: 800px;
  padding: 16px;
  margin: 0 auto;
}

.quota-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-desc {
  font-size: 12px;
  color: hsl(var(--txt-disabled));
}

.quota-item {
  padding: 16px 0;
  border-bottom: 1px solid hsl(var(--border-light));

  &:last-child {
    border-bottom: none;
  }
}

.quota-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.quota-item-label {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--txt-secondary));
}

.quota-item-value {
  font-size: 13px;
  color: hsl(var(--txt-tertiary));
}

.quota-warning-text {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: hsl(var(--warning-500));
}

.warning-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.action-bar {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 0;
}
</style>
