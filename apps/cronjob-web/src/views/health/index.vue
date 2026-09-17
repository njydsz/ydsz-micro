<!--
 * 健康仪表盘（系统健康状态展示）
 *
 * @path apps\cronjob-web\src\views\health\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 健康仪表盘（P1-运维监控）
 * <p>消费后端契约 HealthDashboardController（apps/cronjob-web/src/api/healthDashboard.ts，auto-generated）：
 * getHealth 系统健康状态。
 * 布局：顶部整体健康状态 + 各子系统健康详情卡片（调度器、数据库、队列、执行器等）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';

import { YdBadge, YdCard, YdCardContent, YdCardHeader, YdCardTitle } from '@ydsz-core/ydsz-ui';
// TODO: ElDescriptions/ElDescriptionsItem/ElEmpty 暂无 shadcn 对应;保留 element-plus SKIP
import { YdEmptyState } from '@ydsz-core/ydsz-ui';
import { ElDescriptions, ElDescriptionsItem } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

import { getHealth } from '#/api/healthDashboard';

defineOptions({ name: 'HealthDashboard' });

// ==================== 数据 ====================

/** 健康检查原始数据 { component: { status, message, ... } } */
const healthData = ref<Record<string, Record<string, unknown>>>({});
const isLoading = ref(false);

// ==================== 计算属性 ====================

/** 整体健康状态 */
const overallStatus = computed(() => {
  const components = Object.values(healthData.value);
  if (components.length === 0) return { isOk: false, label: '未知', type: 'info' as const };
  const allOk = components.every((c) => {
    const s = String(c.status ?? c.health ?? '').toLowerCase();
    return s === 'ok' || s === 'up' || s === 'true' || s === 'healthy';
  });
  return {
    isOk: allOk,
    label: allOk ? '系统正常' : '存在异常',
    type: allOk ? 'success' as const : 'danger' as const,
  };
});

interface HealthComponent {
  name: string;
  status: string;
  isOk: boolean;
  details: Record<string, unknown>;
}

/** 各子系统健康详情卡片列表 */
const componentCards = computed<HealthComponent[]>(() => {
  return Object.entries(healthData.value).map(([name, details]) => {
    const detailObj = (details ?? {}) as Record<string, unknown>;
    const status = String(detailObj.status ?? detailObj.health ?? 'UNKNOWN');
    const isOk = status.toLowerCase() === 'ok' || status.toLowerCase() === 'up' || status.toLowerCase() === 'healthy';
    return {
      name,
      status: status.toUpperCase(),
      isOk,
      details: detailObj,
    };
  });
});

/** 状态对应的 tag 类型 */
function statusTagType(isOk: boolean): 'success' | 'danger' | 'info' {
  return isOk ? 'success' : 'danger';
}

// ==================== 方法 ====================

async function loadHealth() {
  isLoading.value = true;
  try {
    const data = await getHealth();
    healthData.value = data ?? {};
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadHealth);
</script>

<template>
  <Page auto-content-height>
    <!-- 整体健康状态 -->
    <YdCard class="mb-3">
      <YdCardHeader>
        <div class="flex items-center justify-between">
          <YdCardTitle>系统健康状态</YdCardTitle>
          <YdBadge :variant="overallStatus.type" size="lg">
            {{ isLoading ? '检查中...' : overallStatus.label }}
          </YdBadge>
        </div>
      </YdCardHeader>
      <YdCardContent>
        <div class="flex items-center gap-3">
        <span
          class="inline-block h-4 w-4 rounded-full"
          :class="overallStatus.isOk ? 'bg-green-500' : 'bg-red-500'"
        />
        <span class="text-sm text-gray-500">
          共 {{ componentCards.length }} 个子系统
          · <span class="text-green-600">{{ componentCards.filter((c) => c.isOk).length }} 正常</span>
           · <span class="text-red-600">{{ componentCards.filter((c) => !c.isOk).length }} 异常</span>
          </span>
        </div>
      </YdCardContent>
    </YdCard>

    <!-- 子系统详情 -->
    <div v-loading="isLoading" class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <YdCard
        v-for="card in componentCards"
        :key="card.name"
        :style="{ borderTop: `4px solid ${card.isOk ? '#22c55e' : '#ef4444'}` }"
      >
        <YdCardHeader>
          <div class="flex items-center justify-between">
            <YdCardTitle class="text-sm text-gray-700">{{ card.name }}</YdCardTitle>
            <YdBadge :variant="statusTagType(card.isOk) === 'success' ? 'default' : 'destructive'" size="sm">
              {{ card.status }}
            </YdBadge>
          </div>
        </YdCardHeader>
        <YdCardContent>
          <ElDescriptions v-if="Object.keys(card.details).length" :column="1" size="small">
            <ElDescriptionsItem v-for="(val, key) in card.details" :key="key" :label="key">
              {{ String(val) }}
            </ElDescriptionsItem>
          </ElDescriptions>
          <YdEmptyState v-else description="暂无详情" :image-size="40" />
        </YdCardContent>
      </YdCard>
    </div>

    <YdEmptyState
      v-if="!isLoading && componentCards.length === 0"
      description="暂无健康数据"
      :image-size="80"
    />
  </Page>
</template>
