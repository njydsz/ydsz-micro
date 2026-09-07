/**
 * 拓扑可视化（全局 DAG 依赖 + DAG 实例拓扑）
 *
 * @path apps\cronjob-web\src\views\topology\index.vue
 * @author ydsz-team
 * @since 1.0.0
 */

import { Page } from '@ydsz/common-ui';

import { ElCard, ElEmpty, ElInput, ElTabPane, ElTabs } from 'element-plus';
import { createLogger } from '@ydsz-core/shared/utils';
import { onMounted, ref } from 'vue';

import { getDagInstanceTopology, getGlobalTopology } from '#/api/topology';

defineOptions({ name: 'CronjobTopology' });

const logger = createLogger('cronjob-topology');

// ==================== 状态 ====================

type TabName = 'global' | 'instance';
const activeTab = ref<TabName>('global');

/** 全局拓扑原始数据 */
const globalData = ref<Record<string, Record<string, unknown>>>({});
const globalLoading = ref(false);

/** DAG 实例查询 */
const dagInstanceId = ref('');
const instanceLoading = ref(false);
const instanceTopology = ref<Record<string, Record<string, unknown>>>({});

/** 全局拓扑搜索关键词 */
const searchKeyword = ref('');

// ==================== 计算属性 ====================

/** 节点卡片列表（从全局拓扑数据中推导 DAG 节点） */
interface TopologyCard {
  id: string;
  dagKey: string;
  dagName: string;
  status: string;
}

function extractGlobalCards(
  data: Record<string, Record<string, unknown>>,
): TopologyCard[] {
  const nodes = (data?.nodes ?? data?.dags ?? []) as Record<string, unknown>[];
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return Object.entries(data)
      .filter(([key]) => key !== 'edges' && key !== 'meta')
      .map(([key, val]) => {
        const obj = (val ?? {}) as Record<string, unknown>;
        return {
          id: (obj.id as string) ?? key,
          dagKey: (obj.dagKey as string) ?? key,
          dagName: (obj.dagName as string) ?? (obj.name as string) ?? key,
          status: (obj.status as string) ?? (obj.dagStatus as string) ?? 'UNKNOWN',
        } satisfies TopologyCard;
      });
  }
  return nodes.map((n) => ({
    id: (n.id as string) ?? (n.dagKey as string) ?? '',
    dagKey: (n.dagKey as string) ?? (n.id as string) ?? '',
    dagName: (n.dagName as string) ?? (n.name as string) ?? '',
    status: (n.status as string) ?? (n.dagStatus as string) ?? 'UNKNOWN',
  }));
}

const globalCards = ref<TopologyCard[]>([]);

const filteredGlobalCards = ref<TopologyCard[]>([]);

/** 节点状态 -> 颜色映射 */
const STATUS_COLORS: Record<string, string> = {
  SUCCESS: '#22c55e',
  NORMAL: '#22c55e',
  RUNNING: '#eab308',
  FAILED: '#ef4444',
  ERROR: '#ef4444',
  PENDING: '#9ca3af',
  PAUSED: '#f97316',
};

function statusColor(status: string): string {
  return STATUS_COLORS[status?.toUpperCase()] ?? '#9ca3af';
}

function statusLabelColor(status: string): string {
  const s = status?.toUpperCase();
  if (s === 'SUCCESS' || s === 'NORMAL') return 'text-green-600';
  if (s === 'RUNNING') return 'text-yellow-600';
  if (s === 'FAILED' || s === 'ERROR') return 'text-red-600';
  if (s === 'PAUSED') return 'text-orange-500';
  return 'text-gray-400';
}

// ==================== DAG 实例节点 ====================

interface InstanceNode {
  id: string;
  jobKey: string;
  label: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  x?: number;
  y?: number;
}

const instanceNodes = ref<InstanceNode[]>([]);

// ==================== 方法 ====================

async function loadGlobalTopology() {
  globalLoading.value = true;
  try {
    const data = await getGlobalTopology();
    globalData.value = data ?? {};
    globalCards.value = extractGlobalCards(data ?? {});
    filterGlobalCards();
  } catch (e) {
    logger.warn('全局拓扑加载失败', e);
  } finally {
    globalLoading.value = false;
  }
}

function filterGlobalCards() {
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) {
    filteredGlobalCards.value = globalCards.value;
    return;
  }
  filteredGlobalCards.value = globalCards.value.filter(
    (c) =>
      c.dagKey.toLowerCase().includes(kw) ||
      c.dagName.toLowerCase().includes(kw),
  );
}

async function queryInstanceTopology() {
  if (!dagInstanceId.value.trim()) return;
  instanceLoading.value = true;
  try {
    const data = await getDagInstanceTopology({ dagInstanceId: dagInstanceId.value.trim() });
    instanceTopology.value = data ?? {};
    const rawNodes = (data?.nodeInstances ?? data?.nodes ?? []) as Record<string, unknown>[];
    instanceNodes.value = rawNodes.map((n) => ({
      id: (n.id as string) ?? (n.jobKey as string) ?? '',
      jobKey: (n.jobKey as string) ?? '',
      label: (n.label as string) ?? (n.jobKey as string) ?? '',
      status: (n.nodeStatus as string) ?? (n.status as string) ?? 'PENDING',
      startedAt: n.startedAt as string,
      finishedAt: n.finishedAt as string,
      durationMs: (n.durationMs as number) ?? 0,
      x: (n.x as number) ?? 0,
      y: (n.y as number) ?? 0,
    }));
  } catch (e) {
    logger.warn('DAG 实例拓扑加载失败', e);
  } finally {
    instanceLoading.value = false;
  }
}

function handleTabChange(name: TabName) {
  logger.debug('切换到 Tab:', name);
  if (name === 'global' && globalCards.value.length === 0) {
    loadGlobalTopology();
  }
}

onMounted(() => {
  loadGlobalTopology();
});
</script>

<template>
  <Page auto-content-height>
    <ElTabs v-model="activeTab" class="topology-tabs" @tab-change="handleTabChange">
      <!-- ========== 全局拓扑 Tab ========== -->
      <ElTabPane label="全局拓扑" name="global">
        <div class="mb-4">
          <ElInput
            v-model="searchKeyword"
            placeholder="按 dagId / dagKey 筛选"
            clearable
            class="!w-80"
            @input="filterGlobalCards"
          />
        </div>

        <div v-loading="globalLoading">
          <!-- 卡片网格 -->
          <div v-if="filteredGlobalCards.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <ElCard
              v-for="card in filteredGlobalCards"
              :key="card.id"
              class="topology-card cursor-pointer transition-shadow hover:shadow-md"
              shadow="hover"
              :style="{ borderTop: `4px solid ${statusColor(card.status)}` }"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">{{ card.dagName }}</span>
                <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusLabelColor(card.status)">
                  {{ card.status }}
                </span>
              </div>
              <div class="mt-2 truncate text-xs text-gray-400" :title="card.dagKey">
                {{ card.dagKey }}
              </div>
            </ElCard>
          </div>

          <ElEmpty v-else description="暂无拓扑数据" :image-size="80" />
        </div>
      </ElTabPane>

      <!-- ========== DAG 实例拓扑 Tab ========== -->
      <ElTabPane label="DAG 实例拓扑" name="instance">
        <div class="mb-4 flex items-center gap-3">
          <ElInput
            v-model="dagInstanceId"
            placeholder="输入 dagInstanceId"
            clearable
            class="!w-80"
            @keyup.enter="queryInstanceTopology"
          />
          <button
            class="rounded bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            @click="queryInstanceTopology"
          >
            查询
          </button>
        </div>

        <div v-loading="instanceLoading">
          <!-- DAG 实例节点网格 -->
          <div v-if="instanceNodes.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="node in instanceNodes"
              :key="node.id"
              class="rounded-lg border-2 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              :style="{ borderColor: statusColor(node.status) }"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">{{ node.label || node.jobKey }}</span>
                <span
                  class="inline-block h-3 w-3 rounded-full"
                  :style="{ backgroundColor: statusColor(node.status) }"
                />
              </div>
              <div class="mt-2 truncate text-xs text-gray-400" :title="node.jobKey">
                {{ node.jobKey }}
              </div>
              <div class="mt-2 flex items-center justify-between text-xs">
                <span :class="statusLabelColor(node.status)" class="font-medium">
                  {{ node.status }}
                </span>
                <span v-if="node.durationMs" class="text-gray-400">
                  {{ node.durationMs }}ms
                </span>
              </div>
              <div v-if="node.startedAt" class="mt-1 text-[10px] text-gray-300">
                开始: {{ node.startedAt }}
              </div>
              <div v-if="node.finishedAt" class="text-[10px] text-gray-300">
                结束: {{ node.finishedAt }}
              </div>
            </div>
          </div>

          <ElEmpty
            v-else
            :description="dagInstanceId ? '暂无节点数据' : '请输入 dagInstanceId 后查询'"
            :image-size="80"
          />
        </div>
      </ElTabPane>
    </ElTabs>
  </Page>
</template>

<style scoped>
.topology-tabs {
  margin-top: -8px;
}

.topology-card {
  transition: transform 0.2s ease;
}

.topology-card:hover {
  transform: translateY(-2px);
}
</style>
