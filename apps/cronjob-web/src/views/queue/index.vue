<!--
 * 执行队列（队列状态实时监控）
 *
 * @path apps\cronjob-web\src\views\queue\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 执行队列（P1-运维监控）
 * <p>消费后端契约 JobQueueController（apps/cronjob-web/src/api/jobQueue.ts，auto-generated）：
 * getQueueStatus 队列状态。
 * 布局：顶部队列统计卡片 + 队列详情（入队/出队/积压/超时等指标）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';

import { ElCard, ElDescriptions, ElDescriptionsItem, ElEmpty, ElProgress } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

import { getQueueStatus } from '#/api/jobQueue';

defineOptions({ name: 'JobQueueStatus' });

// ==================== 数据 ====================

/** 队列状态原始数据 */
const queueData = ref<Record<string, Record<string, unknown>>>({});
const isLoading = ref(false);

// ==================== 计算属性 ====================

interface QueueStat {
  label: string;
  key: string;
  color: string;
}

const stats = [
  { label: '队列深度', key: 'queueSize', color: 'text-blue-500' },
  { label: '待处理', key: 'pending', color: 'text-orange-500' },
  { label: '处理中', key: 'processing', color: 'text-yellow-500' },
  { label: '最大容量', key: 'maxCapacity', color: 'text-purple-500' },
] as QueueStat[];

const statCards = computed(() => {
  return stats.map((s) => {
    // 尝试从嵌套结构中查找匹配的值
    const val = findValue(queueData.value, s.key);
    return {
      label: s.label,
      value: Number(val) || 0,
      color: s.color,
    };
  });
});

/** 使用率（队列深度 / 最大容量） */
const usagePercent = computed(() => {
  const size = Number(findValue(queueData.value, 'queueSize')) || 0;
  const cap = Number(findValue(queueData.value, 'maxCapacity')) || 0;
  if (!cap || cap <= 0) return 0;
  return Math.min(100, Math.round((size / cap) * 100));
});

// ==================== 方法 ====================

/** 从嵌套 flat 数据中查找 key 对应的值（支持大小写不敏感） */
function findValue(data: Record<string, Record<string, unknown>>, key: string): unknown {
  // 1. 直接在顶层各 component 的 sub-obj 中查找
  for (const comp of Object.values(data)) {
    const subObj = comp ?? {};
    if (key in subObj) return subObj[key];
    // 大小写不敏感匹配
    const lowerKey = key.toLowerCase();
    for (const [k, v] of Object.entries(subObj)) {
      if (k.toLowerCase() === lowerKey) return v;
    }
  }
  return undefined;
}

async function loadQueue() {
  isLoading.value = true;
  try {
    const data = await getQueueStatus();
    queueData.value = data ?? {};
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadQueue);
</script>

<template>
  <Page auto-content-height>
    <!-- 队列统计卡片 -->
    <ElCard shadow="never" class="mb-3">
      <template #header>
        <span class="font-medium">队列概览</span>
      </template>
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div v-for="card in statCards" :key="card.label">
          <div class="text-sm text-gray-500">{{ card.label }}</div>
          <div class="mt-1 text-2xl font-semibold" :class="card.color">{{ card.value }}</div>
        </div>
      </div>
      <div class="mt-4">
        <div class="mb-1 text-sm text-gray-600">队列使用率</div>
        <ElProgress :percentage="usagePercent" :stroke-width="14" />
      </div>
    </ElCard>

    <!-- 各子系统队列详情 -->
    <div v-loading="isLoading" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ElCard v-for="(details, name) in queueData" :key="name" shadow="never">
        <template #header>
          <span class="font-medium">{{ String(name) }}</span>
        </template>
        <ElDescriptions v-if="Object.keys(details ?? {}).length" :column="2" size="small" border>
          <ElDescriptionsItem v-for="(val, key) in (details ?? {})" :key="key" :label="String(key)">
            {{ String(val) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <ElEmpty v-else description="暂无数据" :image-size="60" />
      </ElCard>
    </div>

    <ElEmpty
      v-if="!isLoading && Object.keys(queueData).length === 0"
      description="暂无队列数据"
      :image-size="80"
    />
  </Page>
</template>
