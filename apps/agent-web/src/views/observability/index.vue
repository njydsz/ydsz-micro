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
import { ElCard, ElEmpty, ElInput, ElOption, ElSelect, ElTable, ElTableColumn, ElTag } from 'element-plus';
import { onMounted, ref } from 'vue';
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
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 加载模型使用数据 */
async function loadModelUsage(): Promise<void> {
  try {
    modelUsageData.value = await getModelUsage({ days: 7 });
  } catch {
    // 错误提示由请求拦截器统一处理
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
        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">总请求数</p>
              <p class="mt-1 text-2xl font-bold">{{ (overviewData.totalRequests as number) ?? 0 }}</p>
            </div>
            <div class="rounded-full bg-blue-50 p-3">
              <span class="text-2xl text-blue-500">📊</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">成功率</p>
              <p class="mt-1 text-2xl font-bold text-green-600">
                {{ ((overviewData.successRate as number) ?? 0).toFixed(1) }}%
              </p>
            </div>
            <div class="rounded-full bg-green-50 p-3">
              <span class="text-2xl text-green-500">✅</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">平均延迟</p>
              <p class="mt-1 text-2xl font-bold text-purple-600">
                {{ ((overviewData.avgLatency as number) ?? 0).toFixed(0) }}ms
              </p>
            </div>
            <div class="rounded-full bg-purple-50 p-3">
              <span class="text-2xl text-purple-500">⚡</span>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Token 消耗</p>
              <p class="mt-1 text-2xl font-bold text-orange-600">
                {{ ((overviewData.totalTokens as number) ?? 0).toLocaleString() }}
              </p>
            </div>
            <div class="rounded-full bg-orange-50 p-3">
              <span class="text-2xl text-orange-500">🪙</span>
            </div>
          </div>
        </ElCard>
      </div>

      <!-- 标签页 -->
      <ElCard>
        <div class="mb-4 flex gap-2">
          <ElButton :type="activeTab === 'trace' ? 'primary' : 'default'" size="small" @click="activeTab = 'trace'">
            Trace 追踪
          </ElButton>
          <ElButton :type="activeTab === 'model' ? 'primary' : 'default'" size="small" @click="activeTab = 'model'">
            模型使用
          </ElButton>
          <ElButton :type="activeTab === 'performance' ? 'primary' : 'default'" size="small" @click="activeTab = 'performance'">
            性能监控
          </ElButton>
        </div>

        <!-- Trace 追踪 -->
        <div v-if="activeTab === 'trace'" class="space-y-4">
          <div class="flex items-center gap-4">
            <ElInput
              v-model="traceSearchQuery"
              placeholder="搜索 Trace ID、Agent 名称或输入内容..."
              class="max-w-md"
              clearable
            />
            <ElSelect placeholder="状态筛选" clearable class="w-32">
              <ElOption label="成功" value="SUCCESS" />
              <ElOption label="失败" value="FAILED" />
              <ElOption label="运行中" value="RUNNING" />
            </ElSelect>
          </div>

          <ElTable :data="traceList" border max-height="400">
            <ElTableColumn prop="traceId" label="Trace ID" width="120" />
            <ElTableColumn prop="agentName" label="Agent" width="120" />
            <ElTableColumn prop="startTime" label="开始时间" width="170" />
            <ElTableColumn prop="duration" label="耗时(ms)" width="100" />
            <ElTableColumn prop="model" label="模型" width="100" />
            <ElTableColumn prop="tokens" label="Token" width="80" />
            <ElTableColumn label="状态" width="100">
              <template #default="{ row }">
                <ElTag :type="getStatusTagType(row.status as string)">
                  {{ row.status }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <ElButton size="small" link type="primary" @click="viewTraceDetail(row)">
                  详情
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>

        <!-- 模型使用 -->
        <div v-if="activeTab === 'model'" class="space-y-4">
          <ElTable :data="modelUsageData" border>
            <ElTableColumn prop="model" label="模型" width="150" />
            <ElTableColumn prop="requestCount" label="请求数" width="120" />
            <ElTableColumn prop="tokenCount" label="Token 数" width="120" />
            <ElTableColumn prop="avgLatency" label="平均延迟(ms)" width="140" />
            <ElTableColumn prop="cost" label="费用" width="100" />
          </ElTable>
          <ElEmpty v-if="modelUsageData.length === 0" description="暂无模型使用数据" />
        </div>

        <!-- 性能监控 -->
        <div v-if="activeTab === 'performance'" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="rounded border p-4 text-center">
              <p class="text-3xl font-bold text-blue-600">99.5%</p>
              <p class="mt-1 text-sm text-gray-500">可用性</p>
            </div>
            <div class="rounded border p-4 text-center">
              <p class="text-3xl font-bold text-green-600">1.2s</p>
              <p class="mt-1 text-sm text-gray-500">P99 延迟</p>
            </div>
            <div class="rounded border p-4 text-center">
              <p class="text-3xl font-bold text-purple-600">150</p>
              <p class="mt-1 text-sm text-gray-500">QPS</p>
            </div>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- Trace 详情弹窗 -->
    <ElDialog
      v-model="selectedTrace !== null"
      title="Trace 详情"
      width="700px"
      @close="selectedTrace = null"
    >
      <div v-if="selectedTrace" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-500">Trace ID：</span>
            <span class="text-sm font-medium">{{ selectedTrace.traceId }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Agent：</span>
            <span class="text-sm font-medium">{{ selectedTrace.agentName }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">开始时间：</span>
            <span class="text-sm font-medium">{{ selectedTrace.startTime }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">耗时：</span>
            <span class="text-sm font-medium">{{ selectedTrace.duration }}ms</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">模型：</span>
            <span class="text-sm font-medium">{{ selectedTrace.model }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Token：</span>
            <span class="text-sm font-medium">{{ selectedTrace.tokens }}</span>
          </div>
        </div>
        <div>
          <span class="text-sm text-gray-500">输入：</span>
          <div class="mt-1 rounded border bg-gray-50 p-3 text-sm">{{ selectedTrace.input }}</div>
        </div>
        <div>
          <span class="text-sm text-gray-500">输出：</span>
          <div class="mt-1 rounded border bg-gray-50 p-3 text-sm">
            {{ selectedTrace.output ?? selectedTrace.error ?? '-' }}
          </div>
        </div>
      </div>
      <template #footer>
        <ElButton @click="selectedTrace = null">关闭</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
