<!--
 * 流程图高亮查看器
 *
 * <p>在流程实例详情中展示流程图，高亮显示当前节点和已完成的节点。
 * 支持：节点状态标识、路径高亮、节点详情悬浮提示。
 *
 * <p>数据来源：
 * - 后端 GET /workflow/engine/instance/{instanceId}/diagram 返回 FlowDiagramVO
 * - 当 svgContent 非空时使用 v-html 渲染 SVG
 * - 当仅含 nodes 列表时渲染为节点状态列表
 *
 * @path apps\workflow-web\src\views\instance\components\FlowDiagramViewer.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
defineOptions({
  name: 'FlowDiagramViewer',
});
/**
 * 流程图高亮查看器
 * <p>展示流程图并高亮当前执行节点和已完成路径。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { YdBadge, YdButton } from '@ydsz-core/ydsz-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { showToast } from '@ydsz/notification';
import { diagram } from '#/api/flowInstance';
import type { FlowDiagramVO, FlowInstanceVO } from '#/api/models';

const { t } = useI18n();

/** 后端实际返回的 DiagramNodeVO 含 FlowNodeVO 全部字段（id/nodeCode/nodeName 等），此处显式扩展 */
interface RichDiagramNodeVO {
  id?: string;
  nodeCode?: string;
  nodeName?: string;
  nodeState?: string;
  isActive?: boolean;
}

/** 后端 diagram 接口另返回 svgContent（生成契约未覆盖该字段），视图侧显式补类型 */
interface RichFlowDiagramVO extends FlowDiagramVO {
  svgContent?: string;
  nodes?: RichDiagramNodeVO[];
}

interface Props {
  /** 流程实例信息（向后兼容） */
  instance?: FlowInstanceVO | null;
  /** 流程实例 ID（优先使用） */
  instanceId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  instance: null,
  instanceId: '',
});

/** 流程图数据 */
const diagramData = ref<RichFlowDiagramVO | null>(null);
const loading = ref(false);
const error = ref(false);

/** 解析后的 instanceId（优先取 instanceId 其次取 instance.id） */
const resolvedInstanceId = computed(() => props.instanceId || props.instance?.id || '');

/** 是否包含 SVG 内容 */
const hasSvg = computed(() => {
  const content = diagramData.value?.svgContent;
  return typeof content === 'string' && content.trim().length > 0;
});

/** SVG 渲染内容 */
const svgContent = computed(() => diagramData.value?.svgContent ?? '');

/** 节点列表 */
const nodeList = computed<RichDiagramNodeVO[]>(() => {
  const raw = diagramData.value?.nodes;
  if (!raw) return [];
  return raw.map((n) => ({
    id: n?.id ?? n?.nodeCode,
    nodeCode: n?.nodeCode,
    nodeName: n?.nodeName ?? n?.nodeCode,
    nodeState: n?.nodeState,
    isActive: n?.isActive,
  }));
});

/** 流程图中有无可渲染数据 */
const hasDiagram = computed(() => hasSvg.value || nodeList.value.length > 0);

/** 节点状态映射 */
const NODE_STATUS_MAP: Record<
  string,
  { labelKey: string; color: string; bgColor: string; animate?: boolean }
> = {
  COMPLETED: {
    labelKey: 'wf.flowDiagram.nodeCompleted',
    color: '#67c23a',
    bgColor: '#f0f9eb',
  },
  RUNNING: {
    labelKey: 'wf.flowDiagram.nodeCurrent',
    color: '#409eff',
    bgColor: '#ecf5ff',
    animate: true,
  },
  CURRENT: {
    labelKey: 'wf.flowDiagram.nodeCurrent',
    color: '#409eff',
    bgColor: '#ecf5ff',
    animate: true,
  },
  PENDING: {
    labelKey: 'wf.flowDiagram.nodePending',
    color: '#909399',
    bgColor: '#f4f4f5',
  },
  REJECTED: {
    labelKey: 'wf.flowDiagram.nodeRejected',
    color: '#f56c6c',
    bgColor: '#fef0f0',
  },
  SKIPPED: {
    labelKey: 'wf.flowDiagram.nodeSkipped',
    color: '#e6a23c',
    bgColor: '#fdf6ec',
  },
  FINISHED: {
    labelKey: 'wf.flowDiagram.nodeCompleted',
    color: '#67c23a',
    bgColor: '#f0f9eb',
  },
  ACTIVE: {
    labelKey: 'wf.flowDiagram.nodeCurrent',
    color: '#409eff',
    bgColor: '#ecf5ff',
    animate: true,
  },
};

/** 节点状态文案（模板与脚本共用，统一从词典取） */
function nodeStatusLabel(state: string | undefined): string {
  const config = NODE_STATUS_MAP[state ?? ''];
  return config ? t(config.labelKey) : t('wf.flowDiagram.unknownStatus');
}

/** 当前选中的节点（点击） */
const selectedNodeId = ref<string | null>(null);

/** 加载流程图数据 */
async function loadDiagram(): Promise<void> {
  if (!resolvedInstanceId.value) return;
  loading.value = true;
  error.value = false;
  try {
    const data = await diagram({ id: resolvedInstanceId.value });
    // 契约类型未覆盖 svgContent，在唯一的接口出口处收敛为视图侧类型
    diagramData.value = (data ?? null) as RichFlowDiagramVO | null;
  } catch {
    error.value = true;
    diagramData.value = null;
    showToast.error(t('wf.flowDiagram.loadFailed'));
  } finally {
    loading.value = false;
  }
}

/** 节点点击 */
function handleNodeClick(nodeId: string) {
  selectedNodeId.value = selectedNodeId.value === nodeId ? null : nodeId;
}

watch(
  () => resolvedInstanceId.value,
  (val) => {
    if (val) {
      loadDiagram();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (resolvedInstanceId.value) {
    loadDiagram();
  }
});
</script>

<template>
  <div class="flow-diagram-viewer">
    <!-- 图例 -->
    <div class="diagram-legend mb-3 flex items-center gap-5">
      <span class="text-xs text-gray-500">{{ t('wf.flowDiagram.legend') }}</span>
      <div v-for="(config, key) in NODE_STATUS_MAP" :key="key" class="flex items-center gap-1">
        <span
          class="legend-dot"
          :class="{ 'dot-animate': config.animate }"
          :style="{ backgroundColor: config.color }"
        />
        <span class="text-xs text-gray-600">{{ t(config.labelKey) }}</span>
      </div>
    </div>

    <!-- 流程图容器 -->
    <div class="diagram-container rounded border bg-white p-5">
      <!-- 加载中 -->
      <div v-if="loading" class="flex h-64 items-center justify-center text-gray-400">
        <div class="flex flex-col items-center gap-2">
          <div
            class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
          />
          <span class="text-sm">{{ t('wf.flowDiagram.loading') }}</span>
        </div>
      </div>

      <!-- 错误态 -->
      <div v-else-if="error" class="flex h-64 flex-col items-center justify-center text-red-400">
        <p class="mb-2">{{ t('wf.flowDiagram.loadFailed') }}</p>
        <YdButton size="sm" variant="secondary" @click="loadDiagram">
          {{ t('wf.flowDiagram.retry') }}
        </YdButton>
      </div>

      <!-- SVG 渲染 -->
      <div v-else-if="hasSvg" class="diagram-content" v-safe-html="svgContent" />

      <!-- 节点列表渲染 -->
      <div v-else-if="nodeList.length > 0" class="node-list-view">
        <div class="flex flex-wrap gap-3">
          <div
            v-for="(node, idx) in nodeList"
            :key="node.id ?? idx"
            class="flex cursor-pointer items-center gap-2 rounded border px-4 py-2 transition-all hover:shadow-md"
            :class="{ 'ring-2 ring-blue-400': selectedNodeId === node.id }"
            :style="{
              borderColor: NODE_STATUS_MAP[node.nodeState ?? '']?.color ?? '#dcdfe6',
              backgroundColor: NODE_STATUS_MAP[node.nodeState ?? '']?.bgColor ?? '#ffffff',
            }"
            @click="handleNodeClick(node.id ?? '')"
          >
            <span
              class="node-dot"
              :class="{ 'dot-animate': NODE_STATUS_MAP[node.nodeState ?? '']?.animate }"
              :style="{
                backgroundColor: NODE_STATUS_MAP[node.nodeState ?? '']?.color ?? '#909399',
              }"
            />
            <span class="text-sm font-medium">
              {{
                node.nodeName ?? node.nodeCode ?? t('wf.flowDiagram.unknownNode')
              }}
            </span>
            <span
              class="rounded px-1.5 py-0.5 text-xs"
              :style="{
                color: NODE_STATUS_MAP[node.nodeState ?? '']?.color ?? '#909399',
                backgroundColor:
                  (NODE_STATUS_MAP[node.nodeState ?? '']?.bgColor ?? '#f4f4f5') + '99',
              }"
            >
              {{ nodeStatusLabel(node.nodeState) }}
            </span>
          </div>
        </div>

        <!-- 连线装饰 -->
        <svg class="node-list-arrows" width="100%" height="20" preserveAspectRatio="none">
          <line
            x1="10%"
            y1="10"
            x2="90%"
            y2="10"
            stroke="#dcdfe6"
            stroke-width="2"
            stroke-dasharray="4 4"
          />
        </svg>
      </div>

      <!-- 空态 -->
      <div v-else class="flex h-64 flex-col items-center justify-center text-gray-400">
        <svg
          class="mb-2 h-12 w-12 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p>{{ t('wf.flowDiagram.empty') }}</p>
        <YdButton size="sm" variant="secondary" class="mt-2" @click="loadDiagram">
          {{ t('wf.flowDiagram.reload') }}
        </YdButton>
      </div>
    </div>

    <!-- 节点状态列表（仅当有节点数据时显示） -->
    <div v-if="nodeList.length > 0" class="node-status-list mt-4">
      <h4 class="mb-2 text-sm font-medium text-gray-700">
        {{ t('wf.flowDiagram.nodeStatusList') }}
      </h4>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(node, idx) in nodeList"
          :key="node.id ?? idx"
          class="flex cursor-pointer items-center gap-2 rounded border px-3 py-1.5 transition-all hover:shadow-sm"
          :class="{ 'ring-1 ring-blue-300': selectedNodeId === node.id }"
          :style="{
            borderColor: NODE_STATUS_MAP[node.nodeState ?? '']?.color ?? '#dcdfe6',
            backgroundColor: NODE_STATUS_MAP[node.nodeState ?? '']?.bgColor ?? '#f4f4f5',
          }"
          @click="handleNodeClick(node.id ?? '')"
        >
          <span
            class="node-dot"
            :class="{ 'dot-animate': NODE_STATUS_MAP[node.nodeState ?? '']?.animate }"
            :style="{ backgroundColor: NODE_STATUS_MAP[node.nodeState ?? '']?.color ?? '#909399' }"
          />
          <span class="text-sm">
            {{ node.nodeName ?? node.nodeCode ?? t('wf.flowDiagram.unknownNode') }}
          </span>
          <YdBadge
            :variant="NODE_STATUS_MAP[node.nodeState ?? '']?.animate ? 'default' : 'secondary'"
            size="sm"
          >
            {{ nodeStatusLabel(node.nodeState) }}
          </YdBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flow-diagram-viewer {
  padding: 16px;
}

.diagram-legend {
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 4px;
}

.diagram-container {
  min-height: 300px;
  overflow: auto;
}

.diagram-content {
  display: flex;
  justify-content: center;
}

.diagram-content :deep(svg) {
  max-width: 100%;
  height: auto;
}

.node-list-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.node-list-arrows {
  width: 100%;
  margin: 4px 0;
}

.node-status-list {
  padding: 12px;
  background: #f9fafb;
  border-radius: 4px;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.node-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 当前节点闪烁动画 */
.dot-animate {
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgb(64 158 255 / 60%);
  }

  70% {
    box-shadow: 0 0 0 8px rgb(64 158 255 / 0%);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(64 158 255 / 0%);
  }
}
</style>
