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
// TODO: ElEmpty/ElTable/ElTableColumn 表格+复杂布局+选择器,保留 element-plus SKIP
import { YdEmptyState } from '@ydsz-core/ydsz-ui';
import { YdTable } from '@ydsz-core/ydsz-ui';
import { ElTableColumn } from 'element-plus';
// TODO: ElAlert 无直接 shadcn 映射 SKIP
import { YdBadge, YdButtonBase, YdCard, YdCardContent, YdDialog, YdDialogContent, YdDialogFooter, YdDialogHeader, YdDialogTitle, YdInput, YdSelectBase, YdSelectContentBase, YdSelectItemBase, YdSelectTriggerBase, YdSelectValueBase, YdTextarea } from '@ydsz-core/ydsz-ui';
import { createLogger } from '@ydsz/utils';
import { onMounted, ref } from 'vue';

const logger = createLogger('agent-observability');
import { getModelUsage, getOverview } from '#/api/observability';

defineOptions({ name: 'ObservabilityManagement' });

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
    <div class="space-y-4 p-4">
      <!-- 概览卡片 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <YdCard class="hover:shadow-md transition-shadow">
          <YdCardContent class="flex items-center justify-between pt-6">
            <div>
              <p class="text-sm text-muted-foreground">总请求数</p>
              <p class="mt-1 text-2xl font-bold text-primary">{{ (overviewData.totalRequests as number) ?? 0 }}</p>
            </div>
            <div class="rounded-full bg-primary/10 p-3">
              <span class="text-2xl text-primary">📊</span>
            </div>
          </YdCardContent>
        </YdCard>

        <YdCard class="hover:shadow-md transition-shadow">
          <YdCardContent class="flex items-center justify-between pt-6">
            <div>
              <p class="text-sm text-muted-foreground">成功率</p>
              <p class="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {{ ((overviewData.successRate as number) ?? 0).toFixed(1) }}%
              </p>
            </div>
            <div class="rounded-full bg-green-500/10 p-3">
              <span class="text-2xl text-green-600 dark:text-green-400">✅</span>
            </div>
          </YdCardContent>
        </YdCard>

        <YdCard class="hover:shadow-md transition-shadow">
          <YdCardContent class="flex items-center justify-between pt-6">
            <div>
              <p class="text-sm text-muted-foreground">平均延迟</p>
              <p class="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {{ ((overviewData.avgLatency as number) ?? 0).toFixed(0) }}ms
              </p>
            </div>
            <div class="rounded-full bg-purple-500/10 p-3">
              <span class="text-2xl text-purple-600 dark:text-purple-400">⚡</span>
            </div>
          </YdCardContent>
        </YdCard>

        <YdCard class="hover:shadow-md transition-shadow">
          <YdCardContent class="flex items-center justify-between pt-6">
            <div>
              <p class="text-sm text-muted-foreground">Token 消耗</p>
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
            <YdButtonBase :variant="activeTab === 'trace' ? 'default' : 'secondary'" size="sm" @click="activeTab = 'trace'">
              Trace 追踪
            </YdButtonBase>
            <YdButtonBase :variant="activeTab === 'model' ? 'default' : 'secondary'" size="sm" @click="activeTab = 'model'">
              模型使用
            </YdButtonBase>
            <YdButtonBase :variant="activeTab === 'performance' ? 'default' : 'secondary'" size="sm" @click="activeTab = 'performance'">
              性能监控
            </YdButtonBase>
          </div>

          <!-- Trace 追踪 -->
          <div v-if="activeTab === 'trace'" class="space-y-4">
            <div class="flex items-center gap-4">
              <YdInput
                v-model="traceSearchQuery"
                placeholder="搜索 Trace ID、Agent 名称或输入内容..."
                class="max-w-md"
              />
              <YdSelectBase>
                <YdSelectTriggerBase class="w-32">
                  <YdSelectValueBase placeholder="状态筛选" />
                </YdSelectTriggerBase>
                <YdSelectContentBase>
                  <YdSelectItemBase value="SUCCESS">成功</YdSelectItemBase>
                  <YdSelectItemBase value="FAILED">失败</YdSelectItemBase>
                  <YdSelectItemBase value="RUNNING">运行中</YdSelectItemBase>
                </YdSelectContentBase>
              </YdSelectBase>
            </div>

            <YdTable :data="traceList" border max-height="400">
              <ElTableColumn prop="traceId" label="Trace ID" width="120" />
              <ElTableColumn prop="agentName" label="Agent" width="120" />
              <ElTableColumn prop="startTime" label="开始时间" width="170" />
              <ElTableColumn prop="duration" label="耗时(ms)" width="100" />
              <ElTableColumn prop="model" label="模型" width="100" />
              <ElTableColumn prop="tokens" label="Token" width="80" />
              <ElTableColumn label="状态" width="100">
                <template #default="{ row }">
                  <YdBadge :variant="getStatusTagType(row.status as string)">
                    {{ row.status }}
                  </YdBadge>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <YdButtonBase size="sm" variant="link" @click="viewTraceDetail(row)">
                    详情
                  </YdButtonBase>
                </template>
              </ElTableColumn>
            </YdTable>
          </div>

          <!-- 模型使用 -->
          <div v-if="activeTab === 'model'" class="space-y-4">
            <YdTable :data="modelUsageData" border>
              <ElTableColumn prop="model" label="模型" width="150" />
              <ElTableColumn prop="requestCount" label="请求数" width="120" />
              <ElTableColumn prop="tokenCount" label="Token 数" width="120" />
              <ElTableColumn prop="avgLatency" label="平均延迟(ms)" width="140" />
              <ElTableColumn prop="cost" label="费用" width="100" />
            </YdTable>
            <YdEmptyState v-if="modelUsageData.length === 0" description="暂无模型使用数据" />
          </div>

          <!-- 性能监控 -->
          <div v-if="activeTab === 'performance'" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="rounded border border-border p-4 text-center">
                <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">99.5%</p>
                <p class="mt-1 text-sm text-muted-foreground">可用性</p>
              </div>
              <div class="rounded border border-border p-4 text-center">
                <p class="text-3xl font-bold text-green-600 dark:text-green-400">1.2s</p>
                <p class="mt-1 text-sm text-muted-foreground">P99 延迟</p>
              </div>
              <div class="rounded border border-border p-4 text-center">
                <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">150</p>
                <p class="mt-1 text-sm text-muted-foreground">QPS</p>
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
          <YdDialogTitle>Trace 详情</YdDialogTitle>
        </YdDialogHeader>
        <div v-if="selectedTrace" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm text-muted-foreground">Trace ID：</span>
              <span class="text-sm font-medium">{{ selectedTrace.traceId }}</span>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">Agent：</span>
              <span class="text-sm font-medium">{{ selectedTrace.agentName }}</span>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">开始时间：</span>
              <span class="text-sm font-medium">{{ selectedTrace.startTime }}</span>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">耗时：</span>
              <span class="text-sm font-medium">{{ selectedTrace.duration }}ms</span>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">模型：</span>
              <span class="text-sm font-medium">{{ selectedTrace.model }}</span>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">Token：</span>
              <span class="text-sm font-medium">{{ selectedTrace.tokens }}</span>
            </div>
          </div>
          <div>
            <span class="text-sm text-muted-foreground">输入：</span>
            <div class="mt-1 rounded border border-border bg-muted p-3 text-sm">{{ selectedTrace.input }}</div>
          </div>
          <div>
            <span class="text-sm text-muted-foreground">输出：</span>
            <div class="mt-1 rounded border border-border bg-muted p-3 text-sm">
              {{ selectedTrace.output ?? selectedTrace.error ?? '-' }}
            </div>
          </div>
        </div>
        <YdDialogFooter>
          <YdButtonBase variant="outline" @click="selectedTrace = null">关闭</YdButtonBase>
        </YdDialogFooter>
      </YdDialogContent>
    </YdDialog>
  </Page>
</template>
