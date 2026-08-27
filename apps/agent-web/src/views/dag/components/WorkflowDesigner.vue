<!--
 * Agent 可视化工作流编排组件
 *
 * <p>提供 Agent 工作流的可视化编排能力，支持节点拖拽、连线、缩放、节点配置等。
 *
 * @path apps/agent-web\src\views\dag\components\WorkflowDesigner.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Agent 可视化工作流编排
 * <p>支持 LLM、工具、条件分支、并行执行、人工审批等节点类型的可视化编排。
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
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSlider,
  ElTabPane,
  ElTabs,
  ElTooltip,
} from 'element-plus';
import { computed, nextTick, ref } from 'vue';

/** 工作流节点 */
interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config: Record<string, unknown>;
}

/** 工作流连线 */
interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

/** 弹窗可见性 */
const visible = ref(false);

/** 画布容器引用 */
const canvasRef = ref<HTMLDivElement | null>(null);

/** 工作流名称 */
const workflowName = ref('');

/** 工作流描述 */
const workflowDescription = ref('');

/** 节点列表 */
const nodes = ref<WorkflowNode[]>([]);

/** 连线列表 */
const edges = ref<WorkflowEdge[]>([]);

/** 选中的节点 */
const selectedNode = ref<WorkflowNode | null>(null);

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

/** 当前激活的标签页 */
const activeTab = ref('designer');

/** 节点类型选项 */
const nodeTypeOptions = [
  { label: '开始节点', value: 'START', color: '#67c23a', icon: '▶' },
  { label: 'LLM 节点', value: 'LLM', color: '#409eff', icon: '🤖' },
  { label: '工具调用', value: 'TOOL', color: '#e6a23c', icon: '🔧' },
  { label: '条件分支', value: 'CONDITION', color: '#909399', icon: '◆' },
  { label: '并行执行', value: 'PARALLEL', color: '#8e7cc3', icon: '⫴' },
  { label: '人工审批', value: 'APPROVAL', color: '#f56c6c', icon: '👤' },
  { label: '知识检索', value: 'RAG', color: '#00b894', icon: '📚' },
  { label: '结束节点', value: 'END', color: '#303133', icon: '⏹' },
];

/** 计算画布样式 */
const canvasStyle = computed(() => ({
  transform: `scale(${zoom.value / 100})`,
  transformOrigin: 'center center',
}));

/** 获取节点类型配置 */
function getNodeConfig(type: string) {
  return nodeTypeOptions.find((opt) => opt.value === type) ?? nodeTypeOptions[0];
}

/** 打开弹窗 */
async function open(): Promise<void> {
  visible.value = true;
  await nextTick();
  if (nodes.value.length === 0) {
    initDefaultWorkflow();
  }
}

/** 关闭弹窗 */
function close(): void {
  visible.value = false;
  resetState();
}

/** 重置状态 */
function resetState(): void {
  nodes.value = [];
  edges.value = [];
  selectedNode.value = null;
  workflowName.value = '';
  workflowDescription.value = '';
  zoom.value = 100;
  isDragging.value = false;
  isConnecting.value = false;
  connectStart.value = null;
}

/** 初始化默认工作流 */
function initDefaultWorkflow(): void {
  const startNode: WorkflowNode = {
    id: 'node_start',
    type: 'START',
    label: '开始',
    x: 100,
    y: 100,
    width: 120,
    height: 50,
    config: {},
  };
  const endNode: WorkflowNode = {
    id: 'node_end',
    type: 'END',
    label: '结束',
    x: 400,
    y: 100,
    width: 120,
    height: 50,
    config: {},
  };
  nodes.value = [startNode, endNode];
  edges.value = [
    { id: 'edge_1', source: 'node_start', target: 'node_end' },
  ];
}

/** 添加节点 */
function addNode(nodeType: string): void {
  const config = getNodeConfig(nodeType);
  const newNode: WorkflowNode = {
    id: `node_${Date.now()}`,
    type: nodeType,
    label: config.label,
    x: 200 + nodes.value.length * 20,
    y: 150 + nodes.value.length * 20,
    width: 140,
    height: 60,
    config: {},
  };
  nodes.value.push(newNode);
}

/** 删除节点 */
function deleteNode(nodeId: string): void {
  nodes.value = nodes.value.filter((n) => n.id !== nodeId);
  edges.value = edges.value.filter((e) => e.source !== nodeId && e.target !== nodeId);
  if (selectedNode.value?.id === nodeId) {
    selectedNode.value = null;
  }
}

/** 选择节点 */
function selectNode(node: WorkflowNode): void {
  selectedNode.value = node;
};

/** 节点拖拽开始 */
function handleNodeMouseDown(event: MouseEvent, node: WorkflowNode): void {
  event.preventDefault();
  event.stopPropagation();
  isDragging.value = true;
  selectNode(node);
  dragOffset.value = {
    x: event.clientX / (zoom.value / 100) - node.x,
    y: event.clientY / (zoom.value / 100) - node.y,
  };
}

/** 节点拖拽移动 */
function handleCanvasMouseMove(event: MouseEvent): void {
  if (!isDragging.value || !selectedNode.value) return;
  selectedNode.value.x = event.clientX / (zoom.value / 100) - dragOffset.value.x;
  selectedNode.value.y = event.clientY / (zoom.value / 100) - dragOffset.value.y;
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
function finishConnect(targetId: string): void {
  if (!connectStart.value || connectStart.value === targetId) {
    isConnecting.value = false;
    connectStart.value = null;
    return;
  }
  const exists = edges.value.some((e) => e.source === connectStart.value && e.target === targetId);
  if (!exists) {
    edges.value.push({
      id: `edge_${Date.now()}`,
      source: connectStart.value,
      target: targetId,
    });
  }
  isConnecting.value = false;
  connectStart.value = null;
}

/** 删除连线 */
function deleteEdge(edge: WorkflowEdge): void {
  edges.value = edges.value.filter((e) => e !== edge);
}

/** 获取节点中心点位置 */
function getNodeCenter(node: WorkflowNode): { x: number; y: number } {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}

/** 获取连线 SVG 路径字符串 */
function getEdgePath(edge: WorkflowEdge): string {
  const sourceNode = nodes.value.find((n) => n.id === edge.source);
  const targetNode = nodes.value.find((n) => n.id === edge.target);
  if (!sourceNode || !targetNode) return '';
  const source = getNodeCenter(sourceNode);
  const target = getNodeCenter(targetNode);
  const midX = (source.x + target.x) / 2;
  return `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;
}

/** 生成 DSL */
function generateDsl(): string {
  let dsl = `workflow "${workflowName.value || '未命名工作流'}"\n`;
  dsl += `  description: "${workflowDescription.value}"\n\n`;
  
  nodes.value.forEach((node) => {
    const config = getNodeConfig(node.type);
    dsl += `  node ${node.id} {\n`;
    dsl += `    type: ${node.type}\n`;
    dsl += `    label: "${node.label}"\n`;
    if (node.type === 'LLM') {
      dsl += `    model: "${(node.config.model as string) ?? 'gpt-4'}"\n`;
      dsl += `    prompt: "${(node.config.prompt as string) ?? ''}"\n`;
    } else if (node.type === 'TOOL') {
      dsl += `    tool: "${(node.config.tool as string) ?? ''}"\n`;
    } else if (node.type === 'CONDITION') {
      dsl += `    condition: "${(node.config.condition as string) ?? ''}"\n`;
    }
    dsl += `  }\n\n`;
  });
  
  edges.value.forEach((edge) => {
    dsl += `  edge ${edge.source} -> ${edge.target}`;
    if (edge.condition) {
      dsl += ` when ${edge.condition}`;
    }
    dsl += `\n`;
  });
  
  dsl += `end`;
  return dsl;
}

/** 保存工作流 */
async function handleSave(): Promise<void> {
  if (!workflowName.value.trim()) {
    ElMessage.warning('请输入工作流名称');
    return;
  }
  saving.value = true;
  try {
    // TODO: 调用后端 API 保存工作流
    ElMessage.success('保存成功');
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    saving.value = false;
  }
}

/** 导出 DSL */
function handleExportDsl(): void {
  const dsl = generateDsl();
  navigator.clipboard.writeText(dsl).then(() => {
    ElMessage.success('DSL 已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
}

defineExpose({ open, close });
</script>

<template>
  <ElDialog
    v-model="visible"
    title="Agent 可视化工作流编排"
    width="1200px"
    :close-on-click-modal="false"
    :show-close="true"
    @close="close"
  >
    <div v-loading="loading" class="designer-container">
      <ElTabs v-model="activeTab">
        <!-- 设计器标签页 -->
        <ElTabPane label="设计器" name="designer">
          <!-- 工具栏 -->
          <div class="toolbar">
            <div class="toolbar-left">
              <ElButton size="small" type="primary" @click="handleSave" :loading="saving">保存</ElButton>
              <ElButton size="small" @click="handleExportDsl">导出DSL</ElButton>
            </div>
            <div class="toolbar-center">
              <span class="text-xs text-gray-500">添加节点：</span>
              <ElButton
                v-for="opt in nodeTypeOptions"
                :key="opt.value"
                size="small"
                :style="{ borderColor: opt.color, color: opt.color }"
                @click="addNode(opt.value)"
              >
                {{ opt.icon }} {{ opt.label }}
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
                  :key="edge.id"
                  :d="getEdgePath(edge)"
                  stroke="#909399"
                  stroke-width="2"
                  fill="none"
                  marker-end="url(#arrowhead)"
                  class="edge-path"
                  @click="deleteEdge(edge)"
                />
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#909399" />
                  </marker>
                </defs>
              </svg>

              <!-- 节点 -->
              <div
                v-for="node in nodes"
                :key="node.id"
                class="workflow-node"
                :class="{
                  'selected': selectedNode?.id === node.id,
                  'connecting-target': isConnecting && connectStart !== node.id,
                }"
                :style="{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`,
                  borderColor: getNodeConfig(node.type).color,
                }"
                @mousedown="handleNodeMouseDown($event, node)"
                @click.stop="finishConnect(node.id)"
              >
                <div class="node-header" :style="{ backgroundColor: getNodeConfig(node.type).color }">
                  <span class="node-icon">{{ getNodeConfig(node.type).icon }}</span>
                  <span class="node-label">{{ node.label }}</span>
                </div>
                <div class="node-body">
                  <span class="text-xs text-gray-600">{{ node.type }}</span>
                </div>
                <!-- 节点操作按钮 -->
                <div class="node-actions">
                  <ElTooltip content="连线" placement="top">
                    <ElButton size="small" circle @click.stop="startConnect(node.id)">
                      <span class="text-xs">→</span>
                    </ElButton>
                  </ElTooltip>
                  <ElTooltip content="删除" placement="top">
                    <ElButton size="small" circle type="danger" @click.stop="deleteNode(node.id)">
                      <span class="text-xs">×</span>
                    </ElButton>
                  </ElTooltip>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-if="nodes.length === 0" class="empty-state">
                <p class="text-gray-400">从工具栏点击添加节点开始编排工作流</p>
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
                    <ElSelect v-model="selectedNode.type" placeholder="节点类型" @change="selectedNode.label = getNodeConfig(selectedNode.type).label">
                      <ElOption
                        v-for="opt in nodeTypeOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </ElSelect>
                  </ElFormItem>
                  <!-- LLM 节点配置 -->
                  <template v-if="selectedNode.type === 'LLM'">
                    <ElFormItem label="模型">
                      <ElSelect v-model="selectedNode.config.model" placeholder="选择模型">
                        <ElOption label="GPT-4" value="gpt-4" />
                        <ElOption label="GPT-3.5" value="gpt-3.5-turbo" />
                        <ElOption label="Claude" value="claude-3" />
                        <ElOption label="Gemini" value="gemini-pro" />
                      </ElSelect>
                    </ElFormItem>
                    <ElFormItem label="提示词">
                      <ElInput v-model="selectedNode.config.prompt" type="textarea" :rows="3" placeholder="输入提示词" />
                    </ElFormItem>
                    <ElFormItem label="温度">
                      <ElInputNumber v-model="selectedNode.config.temperature" :min="0" :max="2" :step="0.1" />
                    </ElFormItem>
                  </template>
                  <!-- 工具节点配置 -->
                  <template v-if="selectedNode.type === 'TOOL'">
                    <ElFormItem label="工具">
                      <ElInput v-model="selectedNode.config.tool" placeholder="工具名称" />
                    </ElFormItem>
                    <ElFormItem label="参数">
                      <ElInput v-model="selectedNode.config.params" type="textarea" :rows="2" placeholder="JSON格式参数" />
                    </ElFormItem>
                  </template>
                  <!-- 条件节点配置 -->
                  <template v-if="selectedNode.type === 'CONDITION'">
                    <ElFormItem label="条件">
                      <ElInput v-model="selectedNode.config.condition" type="textarea" :rows="2" placeholder="输入条件表达式" />
                    </ElFormItem>
                  </template>
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
        </ElTabPane>

        <!-- DSL 预览标签页 -->
        <ElTabPane label="DSL 预览" name="dsl">
          <div class="mt-3">
            <ElForm label-width="80px" class="mb-4">
              <ElFormItem label="工作流名称">
                <ElInput v-model="workflowName" placeholder="请输入工作流名称" />
              </ElFormItem>
              <ElFormItem label="描述">
                <ElInput v-model="workflowDescription" type="textarea" :rows="2" placeholder="请输入工作流描述" />
              </ElFormItem>
            </ElForm>
            <pre class="max-h-96 overflow-auto rounded border bg-gray-50 p-4 text-xs">{{ generateDsl() }}</pre>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>
  </ElDialog>
</template>

<style scoped>
.designer-container {
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
  height: calc(100% - 50px);
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

.workflow-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  border: 2px solid;
  border-radius: 6px;
  background: white;
  cursor: move;
  transition: box-shadow 0.2s;
}

.workflow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.workflow-node.selected {
  box-shadow: 0 0 0 2px #409eff, 0 4px 12px rgba(0, 0, 0, 0.15);
}

.workflow-node.connecting-target {
  border-style: dashed;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
}

.node-icon {
  font-size: 14px;
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

.workflow-node:hover .node-actions {
  display: flex;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.property-panel {
  width: 260px;
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
  max-height: 500px;
  overflow-y: auto;
}

.panel-empty {
  padding: 24px 12px;
  text-align: center;
}
</style>
