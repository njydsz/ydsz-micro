<!--
 * 知识图谱 — 图视图组件
 *
 * 使用 AntV G6 渲染知识图谱子图（力导向布局），当 G6 不可用时回退到 SVG 自实现力导向布局。
 * 接收后端返回的节点和关系数据进行可视化渲染。
 *
 * @path apps/agent-web/src/views/knowledge-graph/graph-view.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 知识图谱图视图组件
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useI18n } from '@ydsz/common-ui';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { ElAlert, ElButton, ElIcon, ElMessage, ElSlider, ElTag } from 'element-plus';
import { Refresh, ZoomIn, ZoomOut } from '@element-plus/icons-vue';

const props = defineProps<{
  /** 节点列表 */
  nodes: GraphNode[];
  /** 关系列表 */
  relations: GraphRelation[];
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'node-click', node: GraphNode): void;
}>();

const { t } = useI18n();

// ===== 类型定义 =====

export interface GraphNode {
  entityId?: string;
  name?: string;
  type?: string | null;
  description?: string | null;
}

export interface GraphRelation {
  relationId?: string;
  sourceEntity?: string;
  targetEntity?: string;
  relationType?: string;
  weight?: number;
}

// ===== 节点类型颜色映射 =====

const NODE_TYPE_COLORS: Record<string, string> = {
  Person: '#3b82f6',
  Organization: '#8b5cf6',
  Location: '#10b981',
  Event: '#f59e0b',
  Product: '#ef4444',
  default: '#6b7280',
};

function getNodeColor(type?: string | null): string {
  if (!type) return NODE_TYPE_COLORS.default;
  return NODE_TYPE_COLORS[type] ?? NODE_TYPE_COLORS.default;
}

// ===== G6 状态 =====

const containerRef = ref<HTMLDivElement | null>(null);
const g6Available = shallowRef<boolean>(false);
const g6Lib = shallowRef<{ Graph: new (opts: unknown) => { setData: (d: unknown) => void; render: () => void; destroy: () => void; getCanvas: () => { get: (k: string) => number }; zoomTo: (ratio: number) => void; fitView: () => void } } | null>(null);

// SVG 回退方案状态
const svgNodes = ref<Array<{ id: string; x: number; y: number; vx: number; vy: number; name: string; type: string | null; color: string; radius: number }>>([]);
const svgEdges = ref<Array<{ source: string; target: string; label: string }>>([]);
const svgZoom = ref<number>(1);
const svgPan = ref<{ x: number; y: number }>({ x: 0, y: 0 });

/**
 * 尝试动态导入 G6
 */
async function tryLoadG6(): Promise<void> {
  try {
    const mod = await import('@antv/g6');
    g6Lib.value = { Graph: mod.Graph };
    g6Available.value = true;
  } catch {
    g6Available.value = false;
    g6Lib.value = null;
  }
}

/**
 * 初始化 G6 图
 */
async function initG6Graph(): Promise<void> {
  if (!containerRef.value || !g6Lib.value) return;

  const g6Nodes = props.nodes.map((n) => ({
    id: n.entityId ?? '',
    label: n.name ?? n.entityId ?? '',
    style: {
      fill: getNodeColor(n.type),
      stroke: '#fff',
      lineWidth: 2,
      radius: 20,
    },
    data: { ...n },
  }));

  const g6Edges = props.relations
    .filter((r) => r.sourceEntity && r.targetEntity)
    .map((r) => ({
      source: r.sourceEntity ?? '',
      target: r.targetEntity ?? '',
      label: r.relationType ?? '',
      style: {
        stroke: '#94a3b8',
        lineWidth: 1.5,
        endArrow: true,
      },
    }));

  const graph = new g6Lib.value.Graph({
    container: containerRef.value,
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight || 500,
    data: { nodes: g6Nodes, edges: g6Edges },
    layout: {
      type: 'force',
      preventOverlap: true,
      nodeSize: 40,
      linkDistance: 150,
      nodeStrength: -300,
      edgeStrength: 0.2,
      collide: {
        radius: 40,
        strength: 0.8,
      },
    },
    behaviors: ['zoom-canvas', 'drag-canvas', 'drag-element'],
    node: {
      style: {
        labelText: (d: { data?: { name?: string } }) => d?.data?.name ?? '',
        labelFill: '#1f2937',
        labelFontSize: 11,
        labelPlacement: 'bottom',
      },
    },
    edge: {
      style: {
        labelText: (d: { label?: string }) => d?.label ?? '',
        labelFill: '#6b7280',
        labelFontSize: 10,
        labelBackground: true,
        labelBackgroundFill: '#f9fafb',
        labelBackgroundRadius: 4,
      },
    },
  });

  graph.render();
}

/**
 * SVG 力导向布局回退
 * 简单的弹簧模型：节点间有排斥力，边有弹簧力
 */
function initSvgForceLayout(): void {
  const width = containerRef.value?.clientWidth ?? 800;
  const height = containerRef.value?.clientHeight || 500;
  const cx = width / 2;
  const cy = height / 2;

  // 初始化节点位置（圆周分布）
  const nodeCount = props.nodes.length || 1;
  svgNodes.value = props.nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodeCount;
    const r = Math.min(width, height) * 0.3;
    return {
      id: n.entityId ?? String(i),
      x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 20,
      y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
      name: n.name ?? n.entityId ?? '',
      type: n.type ?? null,
      color: getNodeColor(n.type),
      radius: 20,
    };
  });

  // 初始化边
  svgEdges.value = props.relations
    .filter((r) => r.sourceEntity && r.targetEntity)
    .map((r) => ({
      source: r.sourceEntity ?? '',
      target: r.targetEntity ?? '',
      label: r.relationType ?? '',
    }));

  // 运行迭代使布局收敛
  runForceIterations(120);
}

/**
 * 简单的力导向迭代
*/
function runForceIterations(iterations: number): void {
  const nodeMap = new Map<string, (typeof svgNodes.value)[number]>();
  svgNodes.value.forEach((n) => nodeMap.set(n.id, n));

  const k = 0.01; // 弹簧劲度
  const repulsive = 800; // 排斥力
  const damping = 0.85;

  for (let i = 0; i < iterations; i++) {
    // 节点间排斥
    for (let a = 0; a < svgNodes.value.length; a++) {
      for (let b = a + 1; b < svgNodes.value.length; b++) {
        const na = svgNodes.value[a];
        const nb = svgNodes.value[b];
        const dx = nb.x - na.x;
        const dy = nb.y - na.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsive / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        na.vx -= fx;
        na.vy -= fy;
        nb.vx += fx;
        nb.vy += fy;
      }
    }

    // 边弹簧力
    for (const edge of svgEdges.value) {
      const ns = nodeMap.get(edge.source);
      const nt = nodeMap.get(edge.target);
      if (!ns || !nt) continue;
      const dx = nt.x - ns.x;
      const dy = nt.y - ns.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = k * (dist - 120);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      ns.vx += fx;
      ns.vy += fy;
      nt.vx -= fx;
      nt.vy -= fy;
    }

    // 积分
    for (const node of svgNodes.value) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      // 边界约束
      const width = containerRef.value?.clientWidth ?? 800;
      const height = containerRef.value?.clientHeight || 500;
      node.x = Math.max(40, Math.min(width - 40, node.x));
      node.y = Math.max(40, Math.min(height - 40, node.y));
    }
  }
}

/**
 * 渲染（自组件挂载时）
 */
async function renderGraph(): Promise<void> {
  if (props.nodes.length === 0) return;

  await tryLoadG6();

  await nextTick();

  if (g6Available.value) {
    try {
      await initG6Graph();
    } catch {
      // G6 初始化失败，回退 SVG
      g6Available.value = false;
      void renderGraph();
    }
  } else {
    initSvgForceLayout();
  }
}

// ===== 交互操作 =====

function handleZoomIn(): void {
  if (g6Available.value) {
    // G6 不在回退路径使用
    return;
  }
  svgZoom.value = Math.min(svgZoom.value * 1.3, 5);
}

function handleZoomOut(): void {
  if (g6Available.value) {
    return;
  }
  svgZoom.value = Math.max(svgZoom.value / 1.3, 0.2);
}

function handleResetZoom(): void {
  if (g6Available.value) {
    return;
  }
  svgZoom.value = 1;
  svgPan.value = { x: 0, y: 0 };
}

/**
 * 点击节点（SVG 模式）
 */
function handleSvgNodeClick(node: (typeof svgNodes.value)[number]): void {
  const originalNode = props.nodes.find((n) => n.entityId === node.id);
  if (originalNode) {
    emit('node-click', originalNode);
  }
}

// ===== 计算属性 =====

const graphSummary = computed(() => ({
  nodeCount: props.nodes.length,
  edgeCount: props.relations.length,
  g6Mode: g6Available.value,
}));

// ===== 生命周期 =====

onMounted(() => {
  if (props.nodes.length > 0) {
    void renderGraph();
  }
});

onBeforeUnmount(() => {
  // G6 cleanup
  g6Lib.value = null;
  svgNodes.value = [];
  svgEdges.value = [];
});

watch(
  () => [props.nodes, props.relations],
  () => {
    if (props.nodes.length > 0) {
      void renderGraph();
    }
  },
  { deep: true },
);
</script>

<template>
  <div class="space-y-4">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <ElTag size="small" type="info">
          {{ graphSummary.nodeCount }} {{ t('knowledgeGraph.graph.nodeCount') || '节点' }}
        </ElTag>
        <ElTag size="small" type="info">
          {{ graphSummary.edgeCount }} {{ t('knowledgeGraph.graph.edgeCount') || '关系' }}
        </ElTag>
        <ElTag size="small" :type="graphSummary.g6Mode ? 'success' : 'warning'">
          {{ graphSummary.g6Mode ? 'G6' : t('knowledgeGraph.graph.svgMode') || 'SVG' }} {{ t('knowledgeGraph.graph.engine') || '引擎' }}
        </ElTag>
      </div>
      <div class="flex items-center gap-2">
        <ElButton
          v-if="!graphSummary.g6Mode"
          :icon="ZoomIn"
          size="small"
          @click="handleZoomIn"
        >
          {{ t('common.zoomIn') || '放大' }}
        </ElButton>
        <ElButton
          v-if="!graphSummary.g6Mode"
          :icon="ZoomOut"
          size="small"
          @click="handleZoomOut"
        >
          {{ t('common.zoomOut') || '缩小' }}
        </ElButton>
        <ElButton
          v-if="!graphSummary.g6Mode"
          size="small"
          @click="handleResetZoom"
        >
          {{ t('common.reset') || '重置' }}
        </ElButton>
        <ElButton
          :icon="Refresh"
          size="small"
          :loading="loading"
          @click="emit('refresh')"
        >
          {{ t('common.refresh') || '刷新' }}
        </ElButton>
      </div>
    </div>

    <!-- 错误提示 -->
    <ElAlert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
    />

    <!-- 图形容器 -->
    <div
      ref="containerRef"
      class="relative overflow-hidden rounded-lg border border-gray-200 bg-white"
      style="height: 500px;"
    >
      <!-- G6 模式下内容由库直接渲染到 containerRef -->
      <!-- SVG 回退模式 -->
      <svg
        v-if="!g6Available && svgNodes.length > 0"
        width="100%"
        height="500"
        class="absolute inset-0"
      >
        <g :transform="`translate(${svgPan.x},${svgPan.y}) scale(${svgZoom})`">
          <!-- 边 -->
          <g class="edges">
            <line
              v-for="(edge, idx) in svgEdges"
              :key="'e-' + idx"
              :x1="svgNodes.find(n => n.id === edge.source)?.x ?? 0"
              :y1="svgNodes.find(n => n.id === edge.source)?.y ?? 0"
              :x2="svgNodes.find(n => n.id === edge.target)?.x ?? 0"
              :y2="svgNodes.find(n => n.id === edge.target)?.y ?? 0"
              stroke="#94a3b8"
              stroke-width="1.5"
              :marker-end="'url(#arrowhead)'"
            />
          </g>
          <!-- 箭头标记 -->
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#94a3b8"
              />
            </marker>
          </defs>
          <!-- 节点 -->
          <g class="nodes">
            <g
              v-for="node in svgNodes"
              :key="node.id"
              class="cursor-pointer transition-opacity hover:opacity-80"
              @click="handleSvgNodeClick(node)"
            >
              <circle
                :cx="node.x"
                :cy="node.y"
                :r="node.radius"
                :fill="node.color"
                stroke="#fff"
                stroke-width="2"
              />
              <text
                :x="node.x"
                :y="node.y + node.radius + 14"
                text-anchor="middle"
                font-size="11"
                fill="#1f2937"
              >
                {{ node.name.length > 10 ? node.name.slice(0, 10) + '...' : node.name }}
              </text>
            </g>
          </g>
        </g>
      </svg>

      <!-- 空态 -->
      <div
        v-if="!loading && nodes.length === 0 && !error"
        class="flex h-full items-center justify-center text-gray-400"
      >
        {{ t('knowledgeGraph.graph.noData') || '暂无图谱数据，请先搜索实体' }}
      </div>
    </div>

    <!-- 节点类型图例 -->
    <div class="flex flex-wrap gap-3">
      <div
        v-for="(color, type) in NODE_TYPE_COLORS"
        :key="type"
        class="flex items-center gap-1.5 text-xs text-gray-600"
      >
        <span
          class="inline-block h-3 w-3 rounded-full"
          :style="{ backgroundColor: color }"
        />
        {{ type === 'default' ? (t('knowledgeGraph.graph.otherType') || '其他') : type }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
