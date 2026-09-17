/**
 * 任务诊断（按 jobKey 诊断健康状态）
 *
 * @path apps\cronjob-web\src\views\job-diagnosis\index.vue
 * @author ydsz-team
 * @since 1.0.0
 */

<script lang="ts" setup>
import { Page } from '@ydsz/common-ui';

import { YdButtonBase, YdCard, YdCardContent, YdCardHeader, YdCardTitle, YdInput } from '@ydsz-core/ydsz-ui';
// TODO: ElProgress/ElStatistic/ElTimeline/ElTimelineItem/ElEmpty 暂无 shadcn 对应;保留 element-plus SKIP
import { YdEmptyState, YdProgress, YdCountToAnimator, YdTimeline, YdTimelineItem } from '@ydsz-core/ydsz-ui';
import { createLogger } from '@ydsz-core/shared/utils';
import { computed, ref } from 'vue';

import { diagnose } from '#/api/jobDiagnosis';

defineOptions({ name: 'CronjobJobDiagnosis' });

const logger = createLogger('cronjob-diagnosis');

// ==================== 状态 ====================

const jobKey = ref('');
const loading = ref(false);

/** 诊断结果原始数据 */
interface DiagnosisResult {
  score?: number;
  status?: string;
  lastExecStatus?: string;
  lastExecTime?: string;
  lastDurationMs?: number;
  lastError?: string;
  failReason?: string;
  suggestion?: string;
  totalRuns?: number;
  successRate?: string;
}

const diagnosisResult = ref<DiagnosisResult>({});

/** 历史诊断记录 */
interface DiagnosisRecord {
  id: string;
  time: string;
  score: number;
  status: string;
  jobKey: string;
}

const historyRecords = ref<DiagnosisRecord[]>([]);

// ==================== 计算属性 ====================

const scorePercentage = computed(() => Math.round(diagnosisResult.value.score ?? 0));

const scoreColor = computed(() => {
  const s = scorePercentage.value;
  if (s >= 80) return '#22c55e';
  if (s >= 50) return '#eab308';
  return '#ef4444';
});

const lastExecTagType = computed(() => {
  const status = diagnosisResult.value.lastExecStatus?.toUpperCase();
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'RUNNING') return 'warning';
  return 'info';
});

// ==================== 方法 ====================

async function handleDiagnose() {
  if (!jobKey.value.trim()) return;
  loading.value = true;
  try {
    const result = await diagnose({ jobKey: jobKey.value.trim() }) as Record<string, unknown>;
    diagnosisResult.value = {
      score: (result?.score as number) ?? 0,
      status: (result?.status as string) ?? 'UNKNOWN',
      lastExecStatus: (result?.lastExecStatus as string) ?? '-',
      lastExecTime: (result?.lastExecTime as string) ?? '-',
      lastDurationMs: (result?.lastDurationMs as number) ?? 0,
      lastError: (result?.lastError as string) ?? '',
      failReason: (result?.failReason as string) ?? '',
      suggestion: (result?.suggestion as string) ?? '',
      totalRuns: (result?.totalRuns as number) ?? 0,
      successRate: (result?.successRate as string) ?? '-',
    };

    // 追加历史记录
    historyRecords.value.unshift({
      id: `${Date.now()}`,
      time: new Date().toLocaleString('zh-CN'),
      score: diagnosisResult.value.score ?? 0,
      status: diagnosisResult.value.status ?? 'UNKNOWN',
      jobKey: jobKey.value.trim(),
    });
    // 最多保留 20 条
    if (historyRecords.value.length > 20) {
      historyRecords.value = historyRecords.value.slice(0, 20);
    }
  } catch (e) {
    logger.warn('诊断请求失败', e);
  } finally {
    loading.value = false;
  }
}

function recordScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

function recordStatusType(status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const s = status?.toUpperCase();
  if (s === 'HEALTHY' || s === 'SUCCESS') return 'success';
  if (s === 'WARNING' || s === 'RUNNING') return 'warning';
  if (s === 'CRITICAL' || s === 'FAILED' || s === 'ERROR') return 'danger';
  return 'info';
}
</script>

<template>
  <Page auto-content-height>
    <YdCard class="mb-3">
      <YdCardHeader>
        <YdCardTitle>任务诊断</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
        <div class="flex items-center gap-3">
          <YdInput
            v-model="jobKey"
            placeholder="请输入 jobKey"
            class="!w-96"
            @keyup.enter="handleDiagnose"
          />
          <YdButtonBase :loading="loading" @click="handleDiagnose">诊断</YdButtonBase>
        </div>
      </YdCardContent>
    </YdCard>

    <!-- 诊断结果区 -->
    <div v-if="diagnosisResult.score !== undefined" class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <!-- 健康评分圆环 -->
      <YdCard class="flex flex-col items-center justify-center">
        <YdCardHeader>
          <YdCardTitle>健康评分</YdCardTitle>
        </YdCardHeader>
        <YdCardContent class="flex flex-col items-center justify-center">
          <YdProgress
            type="dashboard"
            :percentage="scorePercentage"
            :color="scoreColor"
            :stroke-width="12"
            class="my-4"
          />
          <span class="text-2xl font-semibold" :style="{ color: scoreColor }">{{ scorePercentage }}</span>
        </YdCardContent>
      </YdCard>

      <!-- 最近执行状态 -->
      <YdCard>
        <YdCardHeader>
          <YdCardTitle>最近执行</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div class="flex flex-col gap-3">
          <YdCountToAnimator title="状态" :value="diagnosisResult.lastExecStatus ?? '-'">
            <template #suffix>
              <span
                class="ml-1 inline-block rounded px-1.5 py-0.5 text-xs text-white"
                :class="{
                  'bg-green-500': lastExecTagType === 'success',
                  'bg-red-500': lastExecTagType === 'danger',
                  'bg-yellow-500': lastExecTagType === 'warning',
                  'bg-blue-400': lastExecTagType === 'info',
                }"
              >
                {{ diagnosisResult.lastExecStatus ?? '-' }}
              </span>
            </template>
          </YdCountToAnimator>
          <YdCountToAnimator title="执行时间" :value="diagnosisResult.lastExecTime ?? '-'" />
          <YdCountToAnimator title="耗时" :value="`${diagnosisResult.lastDurationMs ?? 0} ms`" />
          <YdCountToAnimator title="总执行" :value="`${diagnosisResult.totalRuns ?? 0} 次`" />
            <YdCountToAnimator title="成功率" :value="diagnosisResult.successRate ?? '-'" />
          </div>
        </YdCardContent>
      </YdCard>

      <!-- 失败原因 + 建议 -->
      <YdCard>
        <YdCardHeader>
          <YdCardTitle>分析建议</YdCardTitle>
        </YdCardHeader>
        <YdCardContent>
          <div v-if="diagnosisResult.failReason" class="mb-3">
          <div class="text-xs font-medium text-red-500">失败原因</div>
          <div class="mt-1 text-sm text-gray-600">{{ diagnosisResult.failReason }}</div>
        </div>
        <div v-if="diagnosisResult.lastError" class="mb-3">
          <div class="text-xs font-medium text-orange-500">最近错误</div>
          <div class="mt-1 text-sm text-gray-600">{{ diagnosisResult.lastError }}</div>
        </div>
        <div v-if="diagnosisResult.suggestion">
          <div class="text-xs font-medium text-blue-500">建议操作</div>
          <div class="mt-1 text-sm text-gray-600">{{ diagnosisResult.suggestion }}</div>
        </div>
          <YdEmptyState v-else description="暂无建议" :image-size="60" />
        </YdCardContent>
      </YdCard>
    </div>

    <YdEmptyState v-else description="请输入 jobKey 后点击诊断" :image-size="100" class="mt-12" />

    <!-- 历史诊断 -->
    <YdCard v-if="historyRecords.length" class="mt-3">
      <YdCardHeader>
        <YdCardTitle>诊断历史</YdCardTitle>
      </YdCardHeader>
      <YdCardContent>
        <YdTimeline>
        <YdTimelineItem
          v-for="record in historyRecords"
          :key="record.id"
          :timestamp="record.time"
          :type="recordStatusType(record.status)"
          placement="top"
        >
          <div class="flex items-center gap-3 text-sm">
            <span class="text-gray-500">{{ record.jobKey }}</span>
            <span class="font-medium" :style="{ color: recordScoreColor(record.score) }">
              评分 {{ record.score }}
            </span>
            <span>{{ record.status }}</span>
          </div>
        </YdTimelineItem>
        </YdTimeline>
      </YdCardContent>
    </YdCard>
  </Page>
</template>
