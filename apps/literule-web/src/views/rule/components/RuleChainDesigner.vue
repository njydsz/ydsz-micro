<!--
 * 规则链可视化编排组件
 *
 * <p>提供规则链的可视化编排能力，支持节点拖拽、连线、缩放、节点配置等。
 *
 * @path apps\literule-web\src\views\rule\components\RuleChainDesigner.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 规则链可视化编排
 * <p>消费后端契约 RuleGraphController（apps/literule-web/src/api/ruleGraph.ts）：
 * getChainGraph() 获取规则链图，saveChainGraph() 保存规则链图，
 * validateChainGraph() 验证规则链，dryRunGraph() 试运行。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSlider,
  ElTooltip,
} from 'element-plus';
import { computed, nextTick, ref, watch } from 'vue';
import { type ChainEdgeDTO, type ChainNodeDTO, type RuleChainGraph } from '#/api/models';
import { dryRunGraph, getChainGraph, saveChainGraph, validateChainGraph } from '#/api/ruleGraph';

interface Props {
  /** 规则编码 */
  ruleCode?: string;
}

const props = withDefaults(defineProps<Props>(), {
  ruleCode: '',
});

const emit = defineEmits<{
  success: [];
  close: [];
}>();

/** 弹窗可见性 */
const visible = ref(false);

/** 画布容器引用 */
const canvasRef = ref<HTMLDivElement | null>(null);

/** 规则链图数据 */
const graphData = ref<RuleChainGraph>({});

/** 节点列表 */
const nodes = ref<ChainNodeDTO[]>([]);

/** 边列表 */
const edges = ref<ChainEdgeDTO[]>([]);

/** 选中的节点 */
const selectedNode = ref<ChainNodeDTO | null>(null);

/** 缩放比例 */
const zoom = ref(100);

/** 拖拽状态 */
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

/** 连线状态 */
const isConnecting = ref(false);
const connectStart = ref<string | null>(null);

/** 加载状态 */
const loading = ref(false);

/** 保存状态 */
const saving = ref(false);

/** 节点类型选项 */
const nodeTypeOptions = [
  { label: '开始节点', value: 'START' },
  { label: '规则节点', value: 'RULE' },
  { label: '条件节点', value: 'CONDITION' },
  { label: '并行节点', value: 'PARALLEL' },
  { label: '聚合节点', value: 'AGGREGATION' },
  { label: '结束节点', value: 'END' },
];

/** 节点类型颜色映射 */
const nodeTypeColors: Record<string, string> = {
  START: '#67c23a',
  RULE: '#409eff',
  CONDITION: '#e6a23c',
  PARALLEL: '#909399',
  AGGREGATION: '#8e7cc3',
  END: '#f56c6c',
};

/** 节点类型标签映射 */
const nodeTypeLabels: Record<string, string> = {
  START: '开始',
  RULE: '规则',
  CONDITION: '条件',
  PARALLEL: '并行',
  AGGREGATION: '聚合',
  END: '结束',
};

/** 试运行结果弹窗 */
const dryRunResultVisible = ref(false);
const dryRunResults = ref<Record<string, unknown>[]>([]);
const dryRunning = ref(false);

/** 计算画布样式 */
const canvasStyle = computed(() => ({
  transform: `scale(${zoom.value / 100})`,
  transformOrigin: 'center center',
}));

/** 打开弹窗 */
async function openEditor(): Promise<void> {
  visible.value = true;
  await nextTick();
  await loadGraph();
}

/** 关闭弹窗 */
function close(): void {
  visible.value = false;
  resetState();
  emit('close');
}

/** 重置状态 */
function resetState(): void {
  nodes.value = [];
  edges.value = [];
  selectedNode.value = null;
  graphData.value = {};
  zoom.value = 100;
  isDragging.value = false;
  isConnecting.value = false;
  connectStart.value = null;
}

/** 加载规则链图 */
async function loadGraph(): Promise<void> {
  if (!props.ruleCode) return;
  loading.value = true;
  try {
    const result = await getChainGraph({ ruleCode: props.ruleCode });
    graphData.value = result;
    nodes.value = result.nodes ?? [];
    edges.value = result.edges ?? [];
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 保存规则链图 */
async function handleSave(): Promise<void> {
  if (!props.ruleCode) return;
  saving.value = true;
  try {
    await saveChainGraph(
      { ruleCode: props.ruleCode },
      {
        ...graphData.value,
        nodes: nodes.value,
        edges: edges.value,
      },
    );
    ElMessage.success('保存成功');
    emit('success');
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    saving.value = false;
  }
}

/** 验证规则链 */
async function handleValidate(): Promise<void> {
  if (!props.ruleCode) return;
  try {
    const result = await validateChainGraph(
      { ruleCode: props.ruleCode },
      {
        ...graphData.value,
        nodes: nodes.value,
        edges: edges.value,
      },
    );
    if (result.length === 0) {
      ElMessage.success('规则链验证通过');
    } else {
      ElMessage.warning(`验证发现 ${result.length} 个问题`);
    }
  } catch {
    // 错误提示由请求拦截器统一处理
  }
}

/** 试运行规则链 */
async function handleDryRun(): Promise<void> {
  if (!props.ruleCode) return;
  dryRunning.value = true;
  dryRunResultVisible.value = true;
  try {
    const result = await dryRunGraph(
      { ruleCode: props.ruleCode },
      {
        nodes: nodes.value,
        edges: edges.value,
      },
    );
    dryRunResults.value = Array.isArray(result) ? result : [result];
  } catch {
    dryRunResults.value = [];
  } finally {
    dryRunning.value = false;
  }
}

/** 添加节点 */
function addNode(nodeType: string): void {
  const newNode: ChainNodeDTO = {
    nodeId: `node_${Date.now()}`,
    nodeType,
    label: nodeTypeLabels[nodeType] ?? nodeType,
    x: 100 + nodes.value.length * 30,
    y: 100 + nodes.value.length * 30,
    width: 140,
    height: 60,
  };
  nodes.value.push(newNode);
}

/** 删除节点 */
function deleteNode(nodeId: string): void {
  nodes.value = nodes.value.filter((n) => n.nodeId !== nodeId);
  edges.value = edges.value.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId);
  if (selectedNode.value?.nodeId === nodeId) {
    selectedNode.value = null;
  }
}

/** 选择节点 */
function selectNode(node: ChainNodeDTO): void {
  selectedNode.value = node;
}

/** 节点拖拽开始 */
function handleNodeMouseDown(event: MouseEvent, node: ChainNodeDTO): void {
  event.preventDefault();
  event.stopPropagation();
  isDragging.value = true;
  selectNode(node);
  const rect = canvasRef.value?.getBoundingClientRect();
  if (rect) {
    dragOffset.value = {
      x: event.clientX / (zoom.value / 100) - (node.x ?? 0),
      y: event.clientY / (zoom.value / 100) - (node.y ?? 0),
    };
  }
}

/** 节点拖拽移动 */
function handleCanvasMouseMove(event: MouseEvent): void {
  if (!isDragging.value || !selectedNode.value) return;
  const rect = canvasRef.value?.getBoundingClientRect();
  if (rect) {
    selectedNode.value.x = event.clientX / (zoom.value / 100) - dragOffset.value.x;
    selectedNode.value.y = event.clientY / (zoom.value / 100) - dragOffset.value.y;
  }
}

/** 节点拖拽结束 */
function handleCanvasMouseUp(): void {
  isDragging.value = false;
}

/** 开始连线 */
function startConnect(nodeId: string): void {
  isConnecting.value = true;
  connectStart.value = nodeId;
}

/** 完成连线 */
function finishConnect(targetNodeId: string): void {
  if (!connectStart.value || connectStart.value === targetNodeId) {
    isConnecting.value = false;
    connectStart.value = null;
    return;
  }
  // 检查是否已存在相同连线
  const exists = edges.value.some(
    (e) => e.sourceNodeId === connectStart.value && e.targetNodeId === targetNodeId,
  );
  if (!exists) {
    edges.value.push({
      sourceNodeId: connectStart.value,
      targetNodeId,
    });
  }
  isConnecting.value = false;
  connectStart.value = null;
}

/** 删除连线 */
function deleteEdge(edge: ChainEdgeDTO): void {
  edges.value = edges.value.filter((e) => e !== edge);
}

/** 获取节点中心点位置 */
function getNodeCenter(node: ChainNodeDTO): { x: number; y: number } {
  return {
    x: (node.x ?? 0) + (node.width ?? 140) / 2,
    y: (node.y ?? 0) + (node.height ?? 60) / 2,
  };
}

/** 获取连线 SVG 路径字符串 */
function getEdgePath(edge: ChainEdgeDTO): string {
  const sourceNode = nodes.value.find((n) => n.nodeId === edge.sourceNodeId);
  const targetNode = nodes.value.find((n) => n.nodeId === edge.targetNodeId);
  if (!sourceNode || !targetNode) return '';
  const source = getNodeCenter(sourceNode);
  const target = getNodeCenter(targetNode);
  const midX = (source.x + target.x) / 2;
  return `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;
}

watch(visible, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      loadGraph();
    });
  }
});

defineExpose({
  openEditor,
});
</script>

<template>
  <ElDialog
    v-model="visible"
    title="规则链可视化编排"
    width="1200px"
    :close-on-click-modal="false"
    :show-close="true"
    @close="close"
  >
    <div v-loading="loading" class="designer-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <ElButton size="small" type="primary" @click="handleSave" :loading="saving"
            >保存</ElButton
          >
          <ElButton size="small" @click="handleValidate">验证</ElButton>
          <ElButton size="small" type="success" @click="handleDryRun" :loading="dryRunning"
            >试运行</ElButton
          >
        </div>
        <div class="toolbar-center">
          <span class="text-xs text-gray-500">添加节点：</span>
          <ElButton
            v-for="opt in nodeTypeOptions"
            :key="opt.value"
            size="small"
            :style="{ borderColor: nodeTypeColors[opt.value], color: nodeTypeColors[opt.value] }"
            @click="addNode(opt.value)"
          >
            {{ opt.label }}
          </ElButton>
        </div>
        <div class="toolbar-right">
          <ElSlider v-model="zoom" :min="50" :max="200" :step="10" show-input class="w-32" />
        </div>
      </div>

      <!-- 主体区域 -->
      <div class="designer-body">
        <!-- 画布区域 -->
        <div
          ref="canvasRef"
          class="canvas"
          :style="canvasStyle"
          @mousemove="handleCanvasMouseMove"
          @mouseup="handleCanvasMouseUp"
          @mouseleave="handleCanvasMouseUp"
        >
          <!-- 连线 SVG -->
          <svg class="edges-layer">
            <path
              v-for="edge in edges"
              :key="edge.id ?? `${edge.from}-${edge.to}`"
              :d="getEdgePath(edge)"
              stroke="#909399"
              stroke-width="2"
              fill="none"
              marker-end="url(#arrowhead)"
              class="edge-path"
              @click="deleteEdge(edge)"
            />
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#909399" />
              </marker>
            </defs>
          </svg>

          <!-- 节点 -->
          <div
            v-for="node in nodes"
            :key="node.nodeId"
            class="chain-node"
            :class="{
              selected: selectedNode?.nodeId === node.nodeId,
              'connecting-target': isConnecting && connectStart !== node.nodeId,
            }"
            :style="{
              left: `${node.x ?? 0}px`,
              top: `${node.y ?? 0}px`,
              width: `${node.width ?? 140}px`,
              height: `${node.height ?? 60}px`,
              borderColor: nodeTypeColors[node.nodeType ?? 'RULE'] ?? '#409eff',
            }"
            @mousedown="handleNodeMouseDown($event, node)"
            @click.stop="finishConnect(node.nodeId ?? '')"
          >
            <div
              class="node-header"
              :style="{ backgroundColor: nodeTypeColors[node.nodeType ?? 'RULE'] }"
            >
              <span class="node-label">{{ node.label ?? node.nodeType }}</span>
            </div>
            <div class="node-body">
              <span class="text-xs text-gray-600">{{ node.ruleCode ?? '未关联规则' }}</span>
            </div>
            <!-- 节点操作按钮 -->
            <div class="node-actions">
              <ElTooltip content="连线" placement="top">
                <ElButton size="small" circle @click.stop="startConnect(node.nodeId ?? '')">
                  <span class="text-xs">→</span>
                </ElButton>
              </ElTooltip>
              <ElTooltip content="删除" placement="top">
                <ElButton
                  size="small"
                  circle
                  type="danger"
                  @click.stop="deleteNode(node.nodeId ?? '')"
                >
                  <span class="text-xs">×</span>
                </ElButton>
              </ElTooltip>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="nodes.length === 0" class="empty-state">
            <p class="text-gray-400">从工具栏拖拽或点击添加节点开始编排规则链</p>
          </div>
        </div>

        <!-- 属性面板 -->
        <div class="property-panel">
          <div class="panel-header">节点属性</div>
          <div v-if="selectedNode" class="panel-content">
            <ElForm label-width="60px" size="small">
              <ElFormItem label="名称">
                <ElInput v-model="selectedNode.label" placeholder="节点名称" />
              </ElFormItem>
              <ElFormItem label="类型">
                <ElSelect v-model="selectedNode.nodeType" placeholder="节点类型">
                  <ElOption
                    v-for="opt in nodeTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="规则">
                <ElInput v-model="selectedNode.ruleCode" placeholder="关联规则编码" />
              </ElFormItem>
              <ElFormItem label="X坐标">
                <ElInputNumber v-model="selectedNode.x" :step="10" />
              </ElFormItem>
              <ElFormItem label="Y坐标">
                <ElInputNumber v-model="selectedNode.y" :step="10" />
              </ElFormItem>
            </ElForm>
          </div>
          <div v-else class="panel-empty">
            <p class="text-xs text-gray-400">请选择一个节点</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 试运行结果弹窗 -->
    <ElDialog v-model="dryRunResultVisible" title="试运行结果" width="600px">
      <div v-loading="dryRunning">
        <div v-if="dryRunResults.length === 0" class="py-4 text-center text-gray-400">
          暂无试运行结果
        </div>
        <div v-else class="max-h-96 overflow-auto">
          <div
            v-for="(result, index) in dryRunResults"
            :key="result.ruleId ?? result.nodeId ?? index"
            class="mb-2 rounded border p-3"
          >
            <pre class="whitespace-pre-wrap text-xs">{{ JSON.stringify(result, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </ElDialog>
  </ElDialog>
</template>

<style scoped>
.designer-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color);
  background: #fafafa;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.designer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas {
  position: relative;
  flex: 1;
  background: #f5f7fa;
  background-image: radial-gradient(circle, #dcdfe6 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: auto;
}

.edges-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.edge-path {
  pointer-events: stroke;
  cursor: pointer;
}

.edge-path:hover {
  stroke: #f56c6c;
  stroke-width: 3;
}

.chain-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  border: 2px solid;
  border-radius: 6px;
  background: white;
  cursor: move;
  transition: box-shadow 0.2s;
}

.chain-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chain-node.selected {
  box-shadow:
    0 0 0 2px #409eff,
    0 4px 12px rgba(0, 0, 0, 0.15);
}

.chain-node.connecting-target {
  border-style: dashed;
}

.node-header {
  padding: 4px 8px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
}

.node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-body {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.node-actions {
  position: absolute;
  top: -12px;
  right: -8px;
  display: none;
  gap: 4px;
}

.chain-node:hover .node-actions {
  display: flex;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.property-panel {
  width: 240px;
  border-left: 1px solid var(--el-border-color);
  background: white;
}

.panel-header {
  padding: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--el-border-color);
}

.panel-content {
  padding: 12px;
}

.panel-empty {
  padding: 24px 12px;
  text-align: center;
}
</style>
