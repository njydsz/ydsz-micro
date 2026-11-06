<!--
 * Agent 可观测性/Trace 界面
 *
 * <p>提供 Agent 执行的可观测性数据，包括 Trace 追踪、模型使用统计、性能监控等。
 *
 * @path apps/agent-web/src/views/observability/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Agent 可观测性
 * <p>消费后端契约 ObservabilityController（apps/agent-web/src/api/observability.ts）：
 * getOverview() 获取概览数据，getModelUsage() 获取模型使用统计。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import {
  YdEmptyState,
  YdTable,
  YdTableColumn,
  YdBadge,
  YdButton,
  YdCard,
  YdCardContent,
  YdDialog,
  YdDialogContent,
  YdDialogFooter,
  YdDialogHeader,
  YdDialogTitle,
  YdInput,
  YdSelectBase,
  YdSelectContentBase,
  YdSelectItemBase,
  YdSelectTriggerBase,
  YdSelectValueBase,
  YdTextarea,
} from '@ydsz-core/ydsz-ui';
import { createLogger } from '@ydsz/utils';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const logger = createLogger('agent-observability');
import { getModelUsage, getOverview } from '#/api/observability';

defineOptions({ name: 'ObservabilityManagement' });

const { t } = useI18n();

/** 当前激活的标签页 */
const activeTab = ref('trace');

/** 概览数据 */
const overviewData = ref<Record<string, unknown>>({});

/** 模型使用数据 */
const modelUsageData = ref<Record<string, unknown>[]>([]);

/** 加载状态 */
const loading = ref(false);

/** Trace 搜索 */
const traceSearchQuery = ref('');
const selectedTrace = ref<Record<string, unknown> | null>(null);

/** Trace 列表 */
const traceList = ref<Record<string, unknown>[]>([
  {
    traceId: 'trace_001',
    agentName: '客服Agent',
    startTime: '2024-01-15 10:30:00',
    duration: 2500,
    status: 'SUCCESS',
    input: '我想查询订单状态',
    output: '请提供您的订单号',
    tokens: 150,
    model: 'gpt-4',
  },
  {
    traceId: 'trace_002',
    agentName: '销售Agent',
    startTime: '2024-01-15 10:32:00',
    duration: 4200,
    status: 'SUCCESS',
    input: '推荐一款笔记本电脑',
    output: '根据您的需求，我推荐...',
    tokens: 320,
    model: 'gpt-4',
  },
  {
    traceId: 'trace_003',
    agentName: '客服Agent',
    startTime: '2024-01-15 10:35:00',
    duration: 8000,
    status: 'FAILED',
    input: '退款申请',
    output: null,
    tokens: 0,
    model: 'gpt-4',
    error: '请求超时',
  },
]);

/** 状态标签类型 */
function getStatusTagType(status: string): 'success' | 'danger' | 'warning' | 'info' {
  switch ((status ?? '').toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
    case 'ERROR':
      return 'danger';
    case 'RUNNING':
    case 'PENDING':
      return 'warning';
    default:
      return 'info';
  }
}

/** 加载概览数据 */
async function loadOverview(): Promise<void> {
  loading.value = true;
  try {
    overviewData.value = (await getOverview()) as Record<string, unknown>;
  } catch (error) {
    logger.warn('加载可观测性概览数据失败: {}', error);
  } finally {
    loading.value = false;
  }
}

/** 加载模型使用数据 */
async function loadModelUsage(): Promise<void> {
  try {
    modelUsageData.value = await getModelUsage({ days: 7 });
  } catch (error) {
    logger.warn('加载模型使用数据失败: {}', error);
  }
}

/** 查看 Trace 详情 */
function viewTraceDetail(trace: Record<string, unknown>): void {
  selectedTrace.value = trace;
}

onMounted(() => {
  loadOverview();
  loadModelUsage();
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4 p-5">
      <!-- 概览卡片 -->
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <YdCard class="transition-shadow hover:shadow-md">
          <YdCardContent class="flex items-center justify-between pt-6">
            <div>
              <p class="text-muted-foreground text-sm">{{ t('business.observability.overview.totalRequests') }}</p>
              <p class="text-primary mt-1 text-2xl font-bold">
                {{ (overviewData.totalRequests as number) ?? 0 }}
              </p>
            </div>
            <div class="bg-primary/10 rounded-full p-3">
              <span class="text-primary text-2xl">📊</span>
            </div>
          </YdCardContent>
        </YdCard>

        <YdCard class="transition-shadow hover:shadow-md">
          <YdCardContent class="flex items-center justify-between pt-6">
            <div>
              <p class="text-muted-foreground text-sm">{{ t('business.observability.overview.successRate') }}</p>
              <p class="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {{ ((overviewData.successRate as number) ?? 0).toFixed(1) }}%
              </p>
            </div>
            <div class="rounded-full bg-green-500/10 p-3">
              <span class="text-2xl text-green-600 dark:text-green-400">✅</span>
            </div>
          </YdCardContent>
        </YdCard>

        <YdCard class="transition-shadow hover:shadow-md">
          <YdCardContent class="flex items-center justify-between pt-6">
            <div>
              <p class="text-muted-foreground text-sm">{{ t('business.observability.overview.avgLatency') }}</p>
              <p class="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {{ ((overviewData.avgLatency as number) ?? 0).toFixed(0) }}ms
              </p>
            </div>
            <div class="rounded-full bg-purple-500/10 p-3">
              <span class="text-2xl text-purple-600 dark:text-purple-400">⚡</span>
            </div>
          </YdCardContent>
        </YdCard>

        <YdCard class="transition-shadow hover:shadow-md">
          <YdCardContent class="flex items-center justify-between pt-6">
            <div>
              <p class="text-muted-foreground text-sm">{{ t('business.observability.overview.tokenUsage') }}</p>
              <p class="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
                {{ ((overviewData.totalTokens as number) ?? 0).toLocaleString() }}
              </p>
            </div>
            <div class="rounded-full bg-orange-500/10 p-3">
              <span class="text-2xl text-orange-600 dark:text-orange-400">🪙</span>
            </div>
          </YdCardContent>
        </YdCard>
      </div>

      <!-- 标签页 -->
      <YdCard>
        <YdCardContent class="pt-6">
          <div class="mb-4 flex gap-2">
            <YdButton
              :variant="activeTab === 'trace' ? 'default' : 'secondary'"
              size="sm"
              @click="activeTab = 'trace'"
            >
              {{ t('business.observability.tabs.trace') }}
            </YdButton>
            <YdButton
              :variant="activeTab === 'model' ? 'default' : 'secondary'"
              size="sm"
              @click="activeTab = 'model'"
            >
              {{ t('business.observability.tabs.model') }}
            </YdButton>
            <YdButton
              :variant="activeTab === 'performance' ? 'default' : 'secondary'"
              size="sm"
              @click="activeTab = 'performance'"
            >
              {{ t('business.observability.tabs.performance') }}
            </YdButton>
          </div>

          <!-- Trace 追踪 -->
          <div v-if="activeTab === 'trace'" class="space-y-4">
            <div class="flex items-center gap-5">
              <YdInput
                v-model="traceSearchQuery"
                :placeholder="t('business.observability.trace.searchPlaceholder')"
                class="max-w-md"
              />
              <YdSelectBase>
                <YdSelectTriggerBase class="w-32">
                  <YdSelectValueBase :placeholder="t('business.observability.trace.statusFilter')" />
                </YdSelectTriggerBase>
                <YdSelectContentBase>
                  <YdSelectItemBase value="SUCCESS">{{ t('business.observability.status.success') }}</YdSelectItemBase>
                  <YdSelectItemBase value="FAILED">{{ t('business.observability.status.failed') }}</YdSelectItemBase>
                  <YdSelectItemBase value="RUNNING">{{ t('business.observability.status.running') }}</YdSelectItemBase>
                </YdSelectContentBase>
              </YdSelectBase>
            </div>

            <YdTable :data="traceList" border max-height="400">
              <YdTableColumn prop="traceId" :label="t('business.observability.trace.traceId')" width="120" />
              <YdTableColumn prop="agentName" :label="t('business.observability.trace.agent')" width="120" />
              <YdTableColumn prop="startTime" :label="t('business.observability.trace.startTime')" width="170" />
              <YdTableColumn prop="duration" :label="t('business.observability.trace.duration')" width="100" />
              <YdTableColumn prop="model" :label="t('business.observability.trace.model')" width="100" />
              <YdTableColumn prop="tokens" :label="t('business.observability.trace.tokens')" width="80" />
              <YdTableColumn :label="t('business.observability.trace.status')" width="100">
                <template #default="{ row }">
                  <YdBadge :variant="getStatusTagType(row.status as string)">
                    {{ row.status }}
                  </YdBadge>
                </template>
              </YdTableColumn>
              <YdTableColumn :label="t('business.observability.trace.actions')" width="100" fixed="right">
                <template #default="{ row }">
                  <YdButton size="sm" variant="link" @click="viewTraceDetail(row)">
                    {{ t('business.observability.trace.detail') }}
                  </YdButton>
                </template>
              </YdTableColumn>
            </YdTable>
          </div>

          <!-- 模型使用 -->
          <div v-if="activeTab === 'model'" class="space-y-4">
            <YdTable :data="modelUsageData" border>
              <YdTableColumn prop="model" :label="t('business.observability.model.model')" width="150" />
              <YdTableColumn prop="requestCount" :label="t('business.observability.model.requestCount')" width="120" />
              <YdTableColumn prop="tokenCount" :label="t('business.observability.model.tokenCount')" width="120" />
              <YdTableColumn prop="avgLatency" :label="t('business.observability.model.avgLatency')" width="140" />
              <YdTableColumn prop="cost" :label="t('business.observability.model.cost')" width="100" />
            </YdTable>
            <YdEmptyState v-if="modelUsageData.length === 0" :description="t('business.observability.model.noData')" />
          </div>

          <!-- 性能监控 -->
          <div v-if="activeTab === 'performance'" class="space-y-4">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div class="border-border rounded border p-5 text-center">
                <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">99.5%</p>
                <p class="text-muted-foreground mt-1 text-sm">{{ t('business.observability.performance.availability') }}</p>
              </div>
              <div class="border-border rounded border p-5 text-center">
                <p class="text-3xl font-bold text-green-600 dark:text-green-400">1.2s</p>
                <p class="text-muted-foreground mt-1 text-sm">{{ t('business.observability.performance.p99Latency') }}</p>
              </div>
              <div class="border-border rounded border p-5 text-center">
                <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">150</p>
                <p class="text-muted-foreground mt-1 text-sm">{{ t('business.observability.performance.qps') }}</p>
              </div>
            </div>
          </div>
        </YdCardContent>
      </YdCard>
    </div>

    <!-- Trace 详情弹窗 -->
    <YdDialog :open="selectedTrace !== null" @update:open="selectedTrace = null">
      <YdDialogContent class="sm:max-w-[700px]">
        <YdDialogHeader>
          <YdDialogTitle>{{ t('business.observability.traceDetail.title') }}</YdDialogTitle>
        </YdDialogHeader>
        <div v-if="selectedTrace" class="space-y-4">
          <div class="grid grid-cols-2 gap-5">
            <div>
              <span class="text-muted-foreground text-sm">{{ t('business.observability.traceDetail.traceId') }}：</span>
              <span class="text-sm font-medium">{{ selectedTrace.traceId }}</span>
            </div>
            <div>
              <span class="text-muted-foreground text-sm">{{ t('business.observability.traceDetail.agent') }}：</span>
              <span class="text-sm font-medium">{{ selectedTrace.agentName }}</span>
            </div>
            <div>
              <span class="text-muted-foreground text-sm">{{ t('business.observability.traceDetail.startTime') }}：</span>
              <span class="text-sm font-medium">{{ selectedTrace.startTime }}</span>
            </div>
            <div>
              <span class="text-muted-foreground text-sm">{{ t('business.observability.traceDetail.duration') }}：</span>
              <span class="text-sm font-medium">{{ selectedTrace.duration }}ms</span>
            </div>
            <div>
              <span class="text-muted-foreground text-sm">{{ t('business.observability.traceDetail.model') }}：</span>
              <span class="text-sm font-medium">{{ selectedTrace.model }}</span>
            </div>
            <div>
              <span class="text-muted-foreground text-sm">{{ t('business.observability.traceDetail.tokens') }}：</span>
              <span class="text-sm font-medium">{{ selectedTrace.tokens }}</span>
            </div>
          </div>
          <div>
            <span class="text-muted-foreground text-sm">{{ t('business.observability.traceDetail.input') }}：</span>
            <div class="border-border bg-muted mt-1 rounded border p-3 text-sm">
              {{ selectedTrace.input }}
            </div>
          </div>
          <div>
            <span class="text-muted-foreground text-sm">{{ t('business.observability.traceDetail.output') }}：</span>
            <div class="border-border bg-muted mt-1 rounded border p-3 text-sm">
              {{ selectedTrace.output ?? selectedTrace.error ?? '-' }}
            </div>
          </div>
        </div>
        <YdDialogFooter>
          <YdButton variant="outline" @click="selectedTrace = null">{{
            t('business.observability.traceDetail.close')
          }}</YdButton>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
  </Page>
</template>
