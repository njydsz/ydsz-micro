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
/**
 * 流程图高亮查看器
 * <p>展示流程图并高亮当前执行节点和已完成路径。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { YdBadge, YdButton } from '@ydsz-core/ydsz-ui';
import { computed, onMounted, ref, watch } from 'vue';
import { diagram } from '#/api/flowInstance';
import type { FlowDiagramVO, FlowInstanceVO } from '#/api/models';

/** 后端实际返回的 DiagramNodeVO 含 FlowNodeVO 全部字段（id/nodeCode/nodeName 等），此处显式扩展 */
interface RichDiagramNodeVO {
  id?: string;
  nodeCode?: string;
  nodeName?: string;
  nodeState?: string;
  isActive?: boolean;
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
const diagramData = ref<FlowDiagramVO | null>(null);
const loading = ref(false);
const error = ref(false);

/** 解析后的 instanceId（优先取 instanceId 其次取 instance.id） */
const resolvedInstanceId = computed(() => props.instanceId || props.instance?.id || '');

/** 是否包含 SVG 内容 */
const hasSvg = computed(() => {
  const content = (diagramData.value as any)?.svgContent;
  return typeof content === 'string' && content.trim().length > 0;
});

/** SVG 渲染内容 */
const svgContent = computed(() => ((diagramData.value as any)?.svgContent as string) || '');

/** 节点列表 */
const nodeList = computed<RichDiagramNodeVO[]>(() => {
  const raw = diagramData.value?.nodes;
  if (!raw) return [];
  return raw.map((n: any) => ({
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
const NODE_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string; animate?: boolean }> = {
  COMPLETED: { label: '已完成', color: '#67c23a', bgColor: '#f0f9eb' },
  RUNNING: { label: '当前节点', color: '#409eff', bgColor: '#ecf5ff', animate: true },
  CURRENT: { label: '当前节点', color: '#409eff', bgColor: '#ecf5ff', animate: true },
  PENDING: { label: '待处理', color: '#909399', bgColor: '#f4f4f5' },
  REJECTED: { label: '已驳回', color: '#f56c6c', bgColor: '#fef0f0' },
  SKIPPED: { label: '已跳过', color: '#e6a23c', bgColor: '#fdf6ec' },
  FINISHED: { label: '已完成', color: '#67c23a', bgColor: '#f0f9eb' },
  ACTIVE: { label: '当前节点', color: '#409eff', bgColor: '#ecf5ff', animate: true },
};

/** 当前选中的节点（点击） */
const selectedNodeId = ref<string | null>(null);

/** 加载流程图数据 */
async function loadDiagram(): Promise<void> {
  if (!resolvedInstanceId.value) return;
  loading.value = true;
  error.value = false;
  try {
    const data = await diagram({ id: resolvedInstanceId.value });
    diagramData.value = data ?? null;
  } catch {
    error.value = true;
    diagramData.value = null;
    showToast.error('加载流程图失败');
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
      <span class="text-xs text-gray-500">节点状态：</span>
      <div v-for="(config, key) in NODE_STATUS_MAP" :key="key" class="flex items-center gap-1">
        <span class="legend-dot" :class="{ 'dot-animate': config.animate }" :style="{ backgroundColor: config.color }" />
        <span class="text-xs text-gray-600">{{ config.label }}</span>
      </div>
    </div>

    <!-- 流程图容器 -->
    <div class="diagram-container rounded border bg-white p-5">
      <!-- 加载中 -->
      <div v-if="loading" class="flex h-64 items-center justify-center text-gray-400">
        <div class="flex flex-col items-center gap-2">
          <div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          <span class="text-sm">正在加载流程图...</span>
        </div>
      </div>

      <!-- 错误态 -->
      <div v-else-if="error" class="flex h-64 flex-col items-center justify-center text-red-400">
        <p class="mb-2">加载流程图失败</p>
        <YdButton size="sm" variant="secondary" @click="loadDiagram">重试</YdButton>
      </div>

      <!-- SVG 渲染 -->
      <div v-else-if="hasSvg" class="diagram-content" v-safe-html="svgContent" />

      <!-- 节点列表渲染 -->
      <div v-else-if="nodeList.length > 0" class="node-list-view">
        <div class="flex flex-wrap gap-3">
          <div
            v-for="(node, idx) in nodeList"
            :key="node.id ?? idx"
            class="flex items-center gap-2 rounded border px-4 py-2 transition-all hover:shadow-md cursor-pointer"
            :class="{ 'ring-2 ring-blue-400': selectedNodeId === node.id, }"
            :style="{
              borderColor: NODE_STATUS_MAP[node.nodeState ?? '']?.color ?? '#dcdfe6',
              backgroundColor: NODE_STATUS_MAP[node.nodeState ?? '']?.bgColor ?? '#ffffff',
            }"
            @click="handleNodeClick(node.id ?? '')"
          >
            <span
              class="node-dot"
              :class="{ 'dot-animate': NODE_STATUS_MAP[node.nodeState ?? '']?.animate }"
              :style="{ backgroundColor: NODE_STATUS_MAP[node.nodeState ?? '']?.color ?? '#909399' }"
            />
            <span class="text-sm font-medium">{{ node.nodeName ?? node.nodeCode ?? '未知节点' }}</span>
            <span
              class="text-xs rounded px-1.5 py-0.5"
              :style="{
                color: NODE_STATUS_MAP[node.nodeState ?? '']?.color ?? '#909399',
                backgroundColor: (NODE_STATUS_MAP[node.nodeState ?? '']?.bgColor ?? '#f4f4f5') + '99',
              }"
            >
              {{ NODE_STATUS_MAP[node.nodeState ?? '']?.label ?? node.nodeState ?? '未知' }}
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
        <svg class="mb-2 h-12 w-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>暂无流程图数据</p>
        <YdButton size="sm" variant="secondary" class="mt-2" @click="loadDiagram">重新加载</YdButton>
      </div>
    </div>

    <!-- 节点状态列表（仅当有节点数据时显示） -->
    <div v-if="nodeList.length > 0" class="node-status-list mt-4">
      <h4 class="mb-2 text-sm font-medium text-gray-700">节点执行状态</h4>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(node, idx) in nodeList"
          :key="node.id ?? idx"
          class="flex items-center gap-2 rounded border px-3 py-1.5 transition-all hover:shadow-sm cursor-pointer"
          :class="{ 'ring-1 ring-blue-300': selectedNodeId === node.id, }"
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
          <span class="text-sm">{{ node.nodeName ?? node.nodeCode ?? '未知节点' }}</span>
          <YdBadge :variant="NODE_STATUS_MAP[node.nodeState ?? '']?.animate ? 'default' : 'secondary'" size="sm">
            {{ NODE_STATUS_MAP[node.nodeState ?? '']?.label ?? node.nodeState ?? '未知' }}
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
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.6);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}
</style>
