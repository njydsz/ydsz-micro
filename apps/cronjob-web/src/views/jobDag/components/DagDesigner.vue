<!--
 * 可视化 DAG 编排设计器
 *
 * <p>提供可视化的 DAG 任务编排能力，支持拖拽创建任务节点、配置任务依赖关系。
 *
 * @path apps\cronjob-web\src\views\jobDag\components\DagDesigner.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 可视化 DAG 编排设计器
 * <p>支持拖拽创建任务节点、连线建立依赖、节点配置。
 * <p>消费后端契约 JobDagController（apps/cronjob-web/src/api/jobDag.ts）。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYDSZModal } from '@ydsz/common-ui';
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElOption, ElSelect, ElSlider } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { createDag, updateDag, validateDag } from '#/api/jobDag';
import type { JobDagPostDTO } from '#/api/models';

interface Props {
  /** 编辑模式下的 DAG 数据 */
  record?: {
    id: string;
    dagName: string;
    dagKey: string;
    description: string;
    cronExpression: string;
    triggerType: string;
  } | null;
}

const props = withDefaults(defineProps<Props>(), {
  record: null});

const emit = defineEmits<{
  success: [];
}>();

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    if (props.record) {
      Object.assign(formData, {
        dagName: props.record.dagName ?? '',
        dagKey: props.record.dagKey ?? '',
        description: props.record.description ?? '',
        cronExpression: props.record.cronExpression ?? '',
        triggerType: props.record.triggerType ?? 'CRON',
      });
    } else {
      resetForm();
    }
    // 初始化节点列表
    if (nodeList.value.length === 0) {
      nodeList.value = [
        { id: 'start', name: '开始', type: 'START', x: 100, y: 100 },
      ];
    }
    selectedNodeId.value = '';
    edgeList.value = [];
  },
  onConfirm: async () => {
    if (!formData.dagName || !formData.dagKey) {
      ElMessage.warning('请填写DAG名称和标识');
      return;
    }
    modalApi.lock();
    try {
      await handleSave();
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

/** DAG 表单数据 */
const formData = reactive({
  dagName: '',
  dagKey: '',
  description: '',
  cronExpression: '',
  triggerType: 'CRON' as string,
});

/** 任务节点列表 */
const nodeList = ref<Array<{
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  jobId?: string;
  config?: Record<string, unknown>;
}>>([]);

/** 连线列表（依赖关系） */
const edgeList = ref<Array<{ from: string; to: string }>>([]);

/** 当前选中节点 */
const selectedNodeId = ref('');

/** 画布缩放 */
const zoomPercent = ref(100);

/** 触发类型选项 */
const triggerTypeOptions = [
  { label: 'Cron 定时', value: 'CRON' },
  { label: '手动触发', value: 'MANUAL' },
  { label: 'API 触发', value: 'API' },
  { label: '事件触发', value: 'EVENT' },
];

/** 节点类型选项 */
const nodeTypeOptions = [
  { label: '开始节点', value: 'START' },
  { label: '任务节点', value: 'TASK' },
  { label: '条件节点', value: 'CONDITION' },
  { label: '结束节点', value: 'END' },
];

/** 选中节点配置 */
const selectedNode = computed(() => nodeList.value.find((n) => n.id === selectedNodeId.value));

/** 重置表单 */
function resetForm(): void {
  formData.dagName = '';
  formData.dagKey = '';
  formData.description = '';
  formData.cronExpression = '';
  formData.triggerType = 'CRON';
}

/** 添加节点 */
function handleAddNode(type: string): void {
  const newNode = {
    id: `node_${Date.now()}`,
    name: `新${nodeTypeOptions.find((o) => o.value === type)?.label ?? '节点'}`,
    type,
    x: 200 + Math.random() * 200,
    y: 150 + Math.random() * 150,
  };
  nodeList.value.push(newNode);
}

/** 删除节点 */
function handleDeleteNode(nodeId: string): void {
  nodeList.value = nodeList.value.filter((n) => n.id !== nodeId);
  edgeList.value = edgeList.value.filter((e) => e.from !== nodeId && e.to !== nodeId);
  if (selectedNodeId.value === nodeId) {
    selectedNodeId.value = '';
  }
}

/** 添加连线 */
function handleAddEdge(from: string, to: string): void {
  // 检查是否已存在
  const exists = edgeList.value.some((e) => e.from === from && e.to === to);
  if (!exists) {
    edgeList.value.push({ from, to });
  }
}

/** 删除连线 */
function handleDeleteEdge(index: number): void {
  edgeList.value.splice(index, 1);
}

/** 保存 DAG */
async function handleSave(): Promise<void> {
  const dagData: JobDagPostDTO = {
    dagName: formData.dagName,
    dagKey: formData.dagKey,
    description: formData.description,
    cronExpression: formData.cronExpression,
    triggerType: formData.triggerType,
    nodes: nodeList.value.map((n) => ({
      nodeId: n.id,
      nodeName: n.name,
      nodeType: n.type,
      jobId: n.jobId,
      positionX: n.x,
      positionY: n.y,
    })),
    edges: edgeList.value.map((e) => ({
      sourceNodeId: e.from,
      targetNodeId: e.to,
    })),
  };

  // 验证 DAG
  const valid = await validateDag(JSON.stringify(dagData));
  if (!valid) {
    ElMessage.error('DAG 验证失败，请检查节点和连线配置');
    return;
  }

  if (props.record?.id) {
    await updateDag({ dagId: props.record.id }, dagData);
    ElMessage.success('更新成功');
  } else {
    await createDag(dagData);
    ElMessage.success('创建成功');
  }
}

/** 更新选中节点名称 */
function handleNodeNameChange(name: string): void {
  const node = nodeList.value.find((n) => n.id === selectedNodeId.value);
  if (node) {
    node.name = name;
  }
}
</script>

<template>
  <Modal title="DAG 编排设计器" width="1000px">
    <div class="dag-designer">
      <ElForm :model="formData" label-width="100px" class="dag-form">
        <ElFormItem label="DAG名称" required>
          <ElInput v-model="formData.dagName" placeholder="请输入DAG名称" />
        </ElFormItem>
        <ElFormItem label="DAG标识" required>
          <ElInput v-model="formData.dagKey" placeholder="请输入DAG标识（唯一）" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="formData.description" placeholder="请输入描述" type="textarea" :rows="2" />
        </ElFormItem>
        <ElFormItem label="Cron表达式">
          <ElInput v-model="formData.cronExpression" placeholder="请输入Cron表达式（如：0 0 * * *）" />
        </ElFormItem>
        <ElFormItem label="触发类型">
          <ElSelect v-model="formData.triggerType" placeholder="选择触发类型">
            <ElOption v-for="opt in triggerTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <!-- 设计器工具 -->
      <div class="designer-toolbar mb-3 flex items-center gap-2">
        <span class="text-sm text-gray-600">添加节点：</span>
        <ElButton
          v-for="opt in nodeTypeOptions"
          :key="opt.value"
          size="small"
          @click="handleAddNode(opt.value)"
        >
          {{ opt.label }}
        </ElButton>
        <div class="mx-2 h-5 w-px bg-gray-300" />
        <span class="text-sm text-gray-600">缩放：</span>
        <ElSlider v-model="zoomPercent" :min="50" :max="150" :step="10" class="w-32" />
        <span class="text-xs text-gray-500">{{ zoomPercent }}%</span>
      </div>

      <!-- 设计器画布 -->
      <div class="designer-canvas rounded border bg-gray-50" :style="{ height: '400px', overflow: 'auto' }">
        <div class="canvas-inner" :style="{ transform: `scale(${zoomPercent / 100})`, transformOrigin: 'top left' }">
          <!-- 节点 -->
          <div
            v-for="node in nodeList"
            :key="node.id"
            class="dag-node"
            :class="{ selected: selectedNodeId === node.id }"
            :style="{ left: `${node.x}px`, top: `${node.y}px` }"
            @click="selectedNodeId = node.id"
          >
            <div class="node-header">{{ node.name }}</div>
            <div class="node-type text-xs text-gray-500">{{ node.type }}</div>
            <ElButton
              class="node-delete"
              size="small"
              type="danger"
              link
              @click.stop="handleDeleteNode(node.id)"
            >
              ×
            </ElButton>
          </div>

          <!-- 连线（简化显示） -->
          <svg class="edges-layer">
            <line
              v-for="(edge, index) in edgeList"
              :key="index"
              :x1="(nodeList.find((n) => n.id === edge.from)?.x ?? 0) + 60"
              :y1="(nodeList.find((n) => n.id === edge.from)?.y ?? 0) + 30"
              :x2="(nodeList.find((n) => n.id === edge.to)?.x ?? 0) + 60"
              :y2="(nodeList.find((n) => n.id === edge.to)?.y ?? 0) + 30"
              stroke="#409eff"
              stroke-width="2"
              marker-end="url(#arrowhead)"
            />
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#409eff" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      <!-- 节点配置面板 -->
      <div v-if="selectedNode" class="node-config mt-3 rounded border bg-white p-3">
        <h4 class="mb-2 text-sm font-medium">节点配置</h4>
        <ElForm label-width="80px">
          <ElFormItem label="节点名称">
            <ElInput :model-value="selectedNode.name" @update:model-value="handleNodeNameChange" />
          </ElFormItem>
          <ElFormItem label="任务ID">
            <ElInput v-model="selectedNode.jobId" placeholder="关联任务ID" />
          </ElFormItem>
        </ElForm>
      </div>

      <!-- 依赖关系列表 -->
      <div v-if="edgeList.length > 0" class="edge-list mt-3">
        <h4 class="mb-2 text-sm font-medium">依赖关系（{{ edgeList.length }}）</h4>
        <div class="flex flex-wrap gap-2">
          <div v-for="(edge, index) in edgeList" :key="index" class="flex items-center gap-1 rounded border px-2 py-1">
            <span class="text-xs">{{ nodeList.find((n) => n.id === edge.from)?.name }}</span>
            <span class="text-xs text-gray-400">→</span>
            <span class="text-xs">{{ nodeList.find((n) => n.id === edge.to)?.name }}</span>
            <ElButton size="small" link type="danger" @click="handleDeleteEdge(index)">删除</ElButton>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.dag-designer {
  min-height: 500px;
}

.dag-form {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 12px;
}

.designer-canvas {
  position: relative;
  min-height: 400px;
}

.canvas-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.dag-node {
  position: absolute;
  width: 120px;
  padding: 8px 12px;
  background: #fff;
  border: 2px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.dag-node:hover {
  border-color: #409eff;
}

.dag-node.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.node-header {
  font-size: 13px;
  font-weight: 500;
}

.node-delete {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 16px;
}

.edges-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
