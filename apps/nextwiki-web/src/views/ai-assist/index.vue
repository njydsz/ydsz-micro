<!--
 * AI 助手（智能摘要 + 服务状态）
 *
 * @path apps\nextwiki-web\src\views\ai-assist\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * AI 助手（P1-AI 闭环）
 * <p>消费后端契约 AiController（apps/nextwiki-web/src/api/ai.ts，auto-generated）：
 * generateSummary 生成智能摘要、getStatus AI 服务状态。
 * 布局：左侧服务区（状态 + 摘要生成输入）+ 右侧摘要历史/结果展示。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';

import { YdCard, YdEmptyState, YdInput, YdBadge, YdTimeline, YdTimelineItem } from '@ydsz-core/ydsz-ui';
import { ElDescriptions, ElDescriptionsItem } from 'element-plus';
import { createLogger } from '@ydsz-core/shared/utils';
import { computed, onMounted, ref } from 'vue';

import { generateSummary, getStatus } from '#/api/ai';
import type { SummaryResult } from '#/api/models';

defineOptions({ name: 'AiAssist' });

const logger = createLogger('nextwiki-ai-assist');

// ==================== 数据 ====================

/** AI 服务状态 */
const aiStatus = ref<Record<string, unknown>>({});
const isStatusLoading = ref(false);

/** 摘要生成输入 */
const summaryInput = ref('');
const summaryType = ref('');
const isGenerating = ref(false);

/** 摘要历史列表 */
const summaryHistory = ref<SummaryResult[]>([]);

/** 最新摘要结果 */
const latestSummary = ref<SummaryResult | null>(null);

// ==================== 计算属性 ====================

/** 服务状态标签 */
const statusTag = computed(() => {
  const status = (aiStatus.value.status as string) ?? (aiStatus.value.available as string) ?? '';
  const isOk = status.toLowerCase() === 'ok' || status === 'true' || aiStatus.value.available === true;
  return {
    isOk,
    label: isOk ? '服务正常' : '服务异常',
    color: isOk ? 'text-green-500' : 'text-red-500',
  };
});

// ==================== 方法 ====================

async function loadStatus() {
  isStatusLoading.value = true;
  try {
    const data = await getStatus();
    aiStatus.value = (data ?? {}) as Record<string, unknown>;
  } catch (e) {
    logger.warn('获取 AI 状态失败', e);
  } finally {
    isStatusLoading.value = false;
  }
}

async function handleGenerate() {
  if (!summaryInput.value.trim()) return;
  isGenerating.value = true;
  try {
    const params: Record<string, unknown> = {
      content: summaryInput.value.trim(),
    };
    if (summaryType.value.trim()) {
      params.summaryType = summaryType.value.trim();
    }
    const result = await generateSummary(params);
    latestSummary.value = result;
    summaryHistory.value = [result, ...summaryHistory.value].slice(0, 20);
  } catch (e) {
    logger.warn('生成摘要失败', e);
  } finally {
    isGenerating.value = false;
  }
}

onMounted(() => {
  loadStatus();
});
</script>

<template>
  <Page auto-content-height>
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <!-- 左侧：服务状态 + 摘要生成 -->
      <div class="space-y-3 lg:col-span-1">
        <!-- AI 服务状态 -->
        <YdCard shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">AI 服务状态</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="statusTag.color"
                :title="JSON.stringify(aiStatus)"
              >
                {{ isStatusLoading ? '检查中...' : statusTag.label }}
              </span>
            </div>
          </template>
          <ElDescriptions v-if="Object.keys(aiStatus).length" :column="1" border size="small">
            <ElDescriptionsItem v-for="(val, key) in aiStatus" :key="key" :label="key">
              {{ String(val) }}
            </ElDescriptionsItem>
          </ElDescriptions>
          <YdEmptyState v-else description="暂无状态数据" :image-size="60" />
        </YdCard>

        <!-- 摘要生成 -->
        <YdCard shadow="never">
          <template #header>
            <span class="font-medium">生成智能摘要</span>
          </template>
          <YdInput
            v-model="summaryInput"
            type="textarea"
            :rows="6"
            placeholder="输入文档内容..."
          />
          <div class="mt-2">
            <YdInput
              v-model="summaryType"
              placeholder="摘要类型（可选，如：brief/detail/technical）"
              clearable
            />
          </div>
          <div class="mt-3 flex justify-end">
            <button
              class="rounded bg-purple-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isGenerating || !summaryInput.trim()"
              @click="handleGenerate"
            >
              {{ isGenerating ? '生成中...' : '生成摘要' }}
            </button>
          </div>
        </YdCard>
      </div>

      <!-- 右侧：最新摘要 + 历史 -->
      <div class="space-y-3 lg:col-span-2">
        <!-- 最新摘要结果 -->
        <YdCard shadow="never">
          <template #header>
            <span class="font-medium">最新摘要</span>
          </template>
          <div v-if="latestSummary">
            <ElDescriptions :column="2" border size="small" class="mb-3">
              <ElDescriptionsItem label="文件节点ID">{{ latestSummary.fileNodeId ?? '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="摘要类型">
                <YdBadge v-if="latestSummary.summaryType" size="small">{{ latestSummary.summaryType }}</YdBadge>
                <span v-else>-</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="字数">{{ latestSummary.wordCount ?? '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="生成时间">{{ latestSummary.generatedAt ?? '-' }}</ElDescriptionsItem>
            </ElDescriptions>
            <div class="rounded bg-gray-50 p-3">
              <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ latestSummary.summary ?? '-' }}</p>
            </div>
          </div>
          <YdEmptyState v-else description="尚未生成摘要" :image-size="80" />
        </YdCard>

        <!-- 摘要历史 -->
        <YdCard shadow="never">
          <template #header>
            <span class="font-medium">历史记录</span>
          </template>
          <YdTimeline v-if="summaryHistory.length">
            <YdTimelineItem
              v-for="(item, idx) in summaryHistory"
              :key="idx"
              :timestamp="item.generatedAt ?? ''"
              placement="top"
            >
              <div class="text-xs text-gray-500">
                {{ item.summaryType ?? '摘要' }} · {{ item.wordCount ?? 0 }} 字
              </div>
              <p class="mt-1 whitespace-pre-wrap text-sm">{{ (item.summary ?? '').slice(0, 200) }}{{ (item.summary ?? '').length > 200 ? '...' : '' }}</p>
            </YdTimelineItem>
          </YdTimeline>
          <YdEmptyState v-else description="暂无历史记录" :image-size="60" />
        </YdCard>
      </div>
    </div>
  </Page>
</template>
