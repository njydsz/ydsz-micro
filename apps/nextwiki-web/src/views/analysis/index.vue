<!--
 * 存储分析（存储概览 + 按类型统计 + 大文件 TopN + AI 文档摘要）
 *
 * @path apps\nextwiki-web\src\views\analysis\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 存储分析（P1-存储闭环）
 * <p>消费后端契约 AnalysisController（apps/nextwiki-web/src/api/analysis.ts，auto-generated）：
 * getOverview 存储概览、statsByType 按类型统计、topLargeFiles 大文件 TopN、analyze AI 文档摘要。
 * 布局：顶部概览卡片 + 按类型统计详情 + 大文件 TopN 列表 + AI 摘要触发区。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';

import { YdCard, YdEmptyState, YdInput, YdNumberFieldInput } from '@ydsz-core/ydsz-ui';
import { YdDescriptions, YdDescriptionsItem } from '@ydsz-core/ydsz-ui';
import { ElTableColumn } from 'element-plus';
import { computed, onMounted, ref } from 'vue';

import { analyze, getOverview, statsByType, topLargeFiles } from '#/api/analysis';
import type { FileNodeVO } from '#/api/models';

defineOptions({ name: 'AnalysisOverview' });

// ==================== 数据 ====================

/** 存储概览原始数据 */
const overview = ref<Record<string, unknown>>({});
/** 按类型统计数据 { typeName: { count, size, ... } } */
const byType = ref<Record<string, Record<string, unknown>>>({});
/** 大文件 TopN */
const largeFiles = ref<FileNodeVO[]>([]);

/** 大文件查询 limit */
const topN = ref(10);

/** AI 摘要入参 */
const analyzeInput = ref('');
const analyzeResult = ref<Record<string, unknown>>({});
const isAnalyzing = ref(false);

// ==================== 计算属性 ====================

interface OverviewCard {
  label: string;
  value: string | number;
  color: string;
}

const overviewCards = computed<OverviewCard[]>(() => {
  const data = overview.value;
  return [
    { label: '文件总数', value: (data.totalFiles as number) ?? 0, color: 'text-blue-500' },
    { label: '总存储量', value: formatSize((data.totalSize as number) ?? 0), color: 'text-green-500' },
    { label: '文件夹数', value: (data.folderCount as number) ?? 0, color: 'text-purple-500' },
    { label: '平均文件大小', value: formatSize((data.avgFileSize as number) ?? 0), color: 'text-orange-500' },
  ];
});

/** 按类型统计表格数据 */
const typeStatsList = computed(() => {
  return Object.entries(byType.value).map(([type, stats]) => ({
    type,
    count: (stats?.count as number) ?? 0,
    size: (stats?.size as number) ?? 0,
    sizeLabel: formatSize((stats?.size as number) ?? 0),
  }));
});

// ==================== 方法 ====================

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(1)} ${units[idx]}`;
}

async function loadOverview() {
  try {
    const data = await getOverview();
    overview.value = (data ?? {}) as Record<string, unknown>;
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function loadByType() {
  try {
    const data = await statsByType();
    byType.value = data ?? {};
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function loadLargeFiles() {
  try {
    const data = await topLargeFiles({ limit: topN.value });
    largeFiles.value = data ?? [];
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

async function loadAll() {
  await Promise.all([loadOverview(), loadByType(), loadLargeFiles()]);
}

async function handleAnalyze() {
  if (!analyzeInput.value.trim()) return;
  isAnalyzing.value = true;
  try {
    const result = await analyze(analyzeInput.value.trim());
    analyzeResult.value = (result ?? {}) as Record<string, unknown>;
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    isAnalyzing.value = false;
  }
}

onMounted(loadAll);
</script>

<template>
  <Page auto-content-height>
    <!-- 存储概览卡片 -->
    <YdCard shadow="never" class="mb-3">
      <template #header>
        <span class="font-medium">存储概览</span>
      </template>
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div v-for="card in overviewCards" :key="card.label">
          <div class="text-sm text-gray-500">{{ card.label }}</div>
          <div class="mt-1 text-2xl font-semibold" :class="card.color">{{ card.value }}</div>
        </div>
      </div>
    </YdCard>

    <!-- 按类型统计 -->
    <YdCard shadow="never" class="mb-3">
      <template #header>
        <span class="font-medium">按类型统计</span>
      </template>
      <YdTable v-if="typeStatsList.length" :data="typeStatsList" border size="small">
        <ElTableColumn prop="type" label="文件类型" min-width="120" />
        <ElTableColumn prop="count" label="数量" width="120" />
        <ElTableColumn prop="sizeLabel" label="占用空间" width="140" />
      </YdTable>
      <YdEmptyState v-else description="暂无类型统计数据" :image-size="60" />
    </YdCard>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <!-- 大文件 TopN -->
      <YdCard shadow="never">
        <template #header>
          <div class="flex items-center gap-3">
            <span class="font-medium">大文件 Top{{ topN }}</span>
            <YdNumberFieldInput
              v-model="topN"
              :min="1"
              :max="100"
              size="small"
              class="!w-24"
              @change="loadLargeFiles"
            />
          </div>
        </template>
        <YdTable v-if="largeFiles.length" :data="largeFiles" border size="small" max-height="380">
          <ElTableColumn prop="name" label="文件名" min-width="160" show-overflow-tooltip />
          <ElTableColumn label="大小" width="100">
            <template #default="{ row }">
              {{ formatSize(row.size ?? 0) }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="suffix" label="扩展名" width="80" />
        </YdTable>
        <YdEmptyState v-else description="暂无大文件数据" :image-size="60" />
      </YdCard>

      <!-- AI 文档摘要 -->
      <YdCard shadow="never">
        <template #header>
          <span class="font-medium">AI 文档摘要</span>
        </template>
        <div class="mb-3">
          <YdInput
            v-model="analyzeInput"
            type="textarea"
            :rows="3"
            placeholder="输入文档内容或关键词，AI 将生成摘要"
          />
          <div class="mt-2 flex justify-end">
            <button
              class="rounded bg-purple-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isAnalyzing || !analyzeInput.trim()"
              @click="handleAnalyze"
            >
              {{ isAnalyzing ? '生成中...' : '生成摘要' }}
            </button>
          </div>
        </div>
        <YdDescriptions v-if="Object.keys(analyzeResult).length" :column="1" border size="small">
          <YdDescriptionsItem label="摘要内容">
            <p class="whitespace-pre-wrap text-sm">{{ (analyzeResult as Record<string, unknown>).summary ?? (analyzeResult as Record<string, unknown>).content ?? '--' }}</p>
          </YdDescriptionsItem>
        </YdDescriptions>
        <YdEmptyState v-else description="摘要尚未生成" :image-size="60" />
      </YdCard>
    </div>
  </Page>
</template>
