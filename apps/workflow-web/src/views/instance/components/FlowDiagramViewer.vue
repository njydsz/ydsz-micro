<!--
 * 流程图高亮查看器
 *
 * <p>在流程实例详情中展示流程图，高亮显示当前节点和已完成的节点。
 * 支持：节点状态标识、路径高亮、节点详情悬浮提示。
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
import { ElMessage, ElTag } from 'element-plus';
import { computed, onMounted, ref, watch } from 'vue';
import { diagram } from '#/api/flowInstance';
import type { FlowDiagramVO, FlowInstanceVO } from '#/api/models';

interface Props {
  /** 流程实例信息 */
  instance: FlowInstanceVO | null;
}

const props = withDefaults(defineProps<Props>(), {
  instance: null,
});

/** 流程图数据 */
const diagramData = ref<FlowDiagramVO | null>(null);
const loading = ref(false);

/** 节点状态映射 */
const NODE_STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  COMPLETED: { label: '已完成', color: '#67c23a', bgColor: '#f0f9eb' },
  CURRENT: { label: '当前节点', color: '#409eff', bgColor: '#ecf5ff' },
  PENDING: { label: '待处理', color: '#909399', bgColor: '#f4f4f5' },
  REJECTED: { label: '已驳回', color: '#f56c6c', bgColor: '#fef0f0' },
  SKIPPED: { label: '已跳过', color: '#e6a23c', bgColor: '#fdf6ec' },
};

/** 当前节点ID */
const currentNodeId = computed(() => props.instance?.currentNodeId ?? '');

/** 流程图SVG内容（模拟） */
const diagramSvg = computed(() => {
  if (!diagramData.value) return '';
  // 实际项目中这里会解析后端返回的BPMN/JSON数据生成SVG
  // 这里提供一个简化的SVG占位
  return generateSimpleDiagram();
});

/**
 * 生成简化的流程图（实际项目中应使用 LogicFlow 或 BPMN.js 渲染）
 */
function generateSimpleDiagram(): string {
  // 简化的流程图SVG，实际项目中应替换为真实的流程图渲染
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" class="flow-diagram-svg">
      <!-- 开始节点 -->
      <rect x="50" y="150" width="80" height="40" rx="20" fill="#67c23a" stroke="#67c23a" stroke-width="2"/>
      <text x="90" y="175" text-anchor="middle" fill="#fff" font-size="12">开始</text>

      <!-- 连线 -->
      <line x1="130" y1="170" x2="200" y2="170" stroke="#67c23a" stroke-width="2" marker-end="url(#arrowhead)"/>

      <!-- 审批节点1 -->
      <rect x="200" y="150" width="100" height="40" rx="4" fill="#67c23a" stroke="#67c23a" stroke-width="2"/>
      <text x="250" y="175" text-anchor="middle" fill="#fff" font-size="12">部门审批</text>

      <!-- 连线 -->
      <line x1="300" y1="170" x2="380" y2="170" stroke="#67c23a" stroke-width="2" marker-end="url(#arrowhead)"/>

      <!-- 条件节点 -->
      <rect x="380" y="150" width="100" height="40" rx="4" fill="#409eff" stroke="#409eff" stroke-width="2"/>
      <text x="430" y="175" text-anchor="middle" fill="#fff" font-size="12">条件判断</text>

      <!-- 连线 -->
      <line x1="480" y1="170" x2="560" y2="170" stroke="#909399" stroke-width="2" marker-end="url(#arrowhead)"/>

      <!-- 审批节点2 -->
      <rect x="560" y="150" width="100" height="40" rx="4" fill="#909399" stroke="#909399" stroke-width="2"/>
      <text x="610" y="175" text-anchor="middle" fill="#fff" font-size="12">领导审批</text>

      <!-- 连线 -->
      <line x1="660" y1="170" x2="720" y2="170" stroke="#909399" stroke-width="2" marker-end="url(#arrowhead)"/>

      <!-- 结束节点 -->
      <rect x="720" y="150" width="60" height="40" rx="20" fill="#909399" stroke="#909399" stroke-width="2"/>
      <text x="750" y="175" text-anchor="middle" fill="#fff" font-size="12">结束</text>

      <!-- 箭头标记 -->
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#909399"/>
        </marker>
      </defs>
    </svg>
  `;
}

/** 节点列表（模拟数据，实际应从后端获取） */
const nodeList = computed(() => [
  { id: 'start', name: '开始', status: 'COMPLETED' },
  { id: 'dept_approval', name: '部门审批', status: 'COMPLETED' },
  { id: 'condition', name: '条件判断', status: 'CURRENT' },
  { id: 'leader_approval', name: '领导审批', status: 'PENDING' },
  { id: 'end', name: '结束', status: 'PENDING' },
]);

/** 加载流程图数据 */
async function loadDiagram(): Promise<void> {
  if (!props.instance?.id) return;
  loading.value = true;
  try {
    const data = await diagram({ id: props.instance.id });
    diagramData.value = data ?? null;
  } catch {
    ElMessage.error('加载流程图失败');
  } finally {
    loading.value = false;
  }
}

watch(() => props.instance, (val) => {
  if (val) {
    loadDiagram();
  }
}, { immediate: true });

onMounted(() => {
  if (props.instance) {
    loadDiagram();
  }
});
</script>

<template>
  <div class="flow-diagram-viewer">
    <!-- 图例 -->
    <div class="diagram-legend mb-3 flex items-center gap-4">
      <span class="text-xs text-gray-500">节点状态：</span>
      <div v-for="(config, key) in NODE_STATUS_MAP" :key="key" class="flex items-center gap-1">
        <span class="legend-dot" :style="{ backgroundColor: config.color }" />
        <span class="text-xs text-gray-600">{{ config.label }}</span>
      </div>
    </div>

    <!-- 流程图容器 -->
    <div class="diagram-container rounded border bg-white p-4">
      <div v-if="loading" class="flex h-64 items-center justify-center text-gray-400">
        正在加载流程图...
      </div>
      <div v-else-if="diagramSvg && diagramData" class="diagram-content" v-html="diagramSvg" />
      <div v-else class="flex h-64 flex-col items-center justify-center text-gray-400">
        <p>暂无流程图数据</p>
        <ElButton size="small" class="mt-2" @click="loadDiagram">重新加载</ElButton>
      </div>
    </div>

    <!-- 节点状态列表 -->
    <div class="node-status-list mt-4">
      <h4 class="mb-2 text-sm font-medium text-gray-700">节点执行状态</h4>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="node in nodeList"
          :key="node.id"
          class="flex items-center gap-2 rounded border px-3 py-1.5"
          :style="{
            borderColor: NODE_STATUS_MAP[node.status]?.color ?? '#909399',
            backgroundColor: NODE_STATUS_MAP[node.status]?.bgColor ?? '#f4f4f5',
          }"
        >
          <span
            class="node-dot"
            :style="{ backgroundColor: NODE_STATUS_MAP[node.status]?.color ?? '#909399' }"
          />
          <span class="text-sm">{{ node.name }}</span>
          <ElTag size="small" :type="node.status === 'CURRENT' ? 'primary' : 'info'">
            {{ NODE_STATUS_MAP[node.status]?.label ?? node.status }}
          </ElTag>
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

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
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

.node-status-list {
  padding: 12px;
  background: #f9fafb;
  border-radius: 4px;
}

.node-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
