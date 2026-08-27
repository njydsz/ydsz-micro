<!--
 * 流程设计器主页面（LogicFlow + 后端转换器）
 *
 * <p>基于 LogicFlow 的流程设计器 MVP，提供可视化流程编排能力。
 * 包含：节点面板、画布、属性配置面板、工具栏。
 *
 * <p><b>核心功能：</b>
 * <ul>
 *   <li>拖拽创建节点（开始、结束、审批、服务、条件、子流程）
 *   <li>节点连线与折弯点编辑
 *   <li>节点属性配置（办理人、表单、SLA、监听器）
 *   <li>保存/加载设计数据（与后端 FlowDesignerController 交互）
 *   <li>协作锁（防止多人同时编辑）
 *   <li>撤销/重做（历史记录管理）
 *   <li>缩放控制（50%-200%）
 *   <li>对齐操作（左/中/右/上/下/居中/分布）
 * </ul>
 *
 * @path apps\workflow-web\src\views\designer\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程设计器主页面
 * <p>基于 LogicFlow 1.2.x 构建，集成后端 BPMN 转换器。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ElMessage, ElMessageBox } from 'element-plus';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DesignerCanvas from './components/DesignerCanvas.vue';
import DesignerPalette from './components/DesignerPalette.vue';
import DesignerPropertyPanel from './components/DesignerPropertyPanel.vue';
import DesignerToolbar from './components/DesignerToolbar.vue';
import type { DesignerNodeConfig, DesignerState } from './types';
import { getDesignerData, lockDefinition, saveDesignerData, unlockDefinition } from '#/api/flowDesigner';
import { $t } from '#/locales';

const route = useRoute();
const definitionId = ref<string>('');
const isLoading = ref(false);
const isSaving = ref(false);
const isLocked = ref(false);
const lockedBy = ref('');

/** 设计器状态 */
const designerState = ref<DesignerState>({
  selectedNodeId: '',
  nodeConfig: null,
});

/** 画布组件引用 */
const canvasRef = ref<InstanceType<typeof DesignerCanvas>>();

/** 历史记录栈（用于撤销/重做） */
const historyStack = ref<string[]>([]);
const historyIndex = ref(-1);
const maxHistorySize = 50;

/**
 * 加载设计数据
 *
 * <p>从后端获取流程图 JSON 并渲染到画布。
 */
async function loadDesignerData() {
  if (!definitionId.value) return;
  isLoading.value = true;
  try {
    const data = await getDesignerData({ id: definitionId.value });
    if (data?.diagramJson) {
      canvasRef.value?.loadGraph(data.diagramJson);
      // 初始化历史记录
      pushHistory(data.diagramJson);
    }
    ElMessage.success($t('wf.designer.loadSuccess'));
  } catch {
    ElMessage.error($t('wf.designer.loadFailed'));
  } finally {
    isLoading.value = false;
  }
}

/**
 * 保存设计数据
 *
 * <p>将画布数据序列化后提交到后端保存。
 */
async function handleSave() {
  if (!definitionId.value) return;
  isSaving.value = true;
  try {
    const graphData = canvasRef.value?.getGraphData();
    await saveDesignerData({ id: definitionId.value }, { designerData: JSON.stringify(graphData) });
    ElMessage.success($t('wf.designer.saveSuccess'));
  } catch {
    ElMessage.error($t('wf.designer.saveFailed'));
  } finally {
    isSaving.value = false;
  }
}

/**
 * 锁定定义（协作编辑）
 */
async function acquireLock() {
  if (!definitionId.value) return;
  try {
    const success = await lockDefinition({ id: definitionId.value });
    if (success) {
      isLocked.value = true;
      ElMessage.success($t('wf.designer.lockAcquired'));
    } else {
      ElMessage.warning($t('wf.designer.lockFailed'));
    }
  } catch {
    ElMessage.error($t('wf.designer.lockError'));
  }
}

/**
 * 释放锁
 */
async function releaseLock() {
  if (!definitionId.value || !isLocked.value) return;
  try {
    await unlockDefinition({ id: definitionId.value });
    isLocked.value = false;
  } catch {
    // 忽略释放锁失败
  }
}

/**
 * 处理节点选中
 *
 * @param nodeId 节点 ID
 * @param config 节点配置
 */
function handleNodeSelect(nodeId: string, config: DesignerNodeConfig | null) {
  designerState.value.selectedNodeId = nodeId;
  designerState.value.nodeConfig = config;
}

/**
 * 处理节点配置变更
 *
 * @param config 节点配置
 */
function handleNodeConfigChange(config: DesignerNodeConfig) {
  if (designerState.value.selectedNodeId) {
    canvasRef.value?.updateNodeProperties(designerState.value.selectedNodeId, config);
  }
}

// ========== 撤销/重做 ==========

/**
 * 推入历史记录
 *
 * @param data 画布数据 JSON 字符串
 */
function pushHistory(data: string): void {
  // 如果当前不在历史记录末尾，截断后面的记录
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  }
  historyStack.value.push(data);
  // 超出最大记录数时移除最早的记录
  if (historyStack.value.length > maxHistorySize) {
    historyStack.value.shift();
  }
  historyIndex.value = historyStack.value.length - 1;
}

/** 撤销 */
function handleUndo(): void {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    const data = historyStack.value[historyIndex.value];
    canvasRef.value?.loadGraph(data);
  }
}

/** 重做 */
function handleRedo(): void {
  if (historyIndex.value < historyStack.value.length - 1) {
    historyIndex.value++;
    const data = historyStack.value[historyIndex.value];
    canvasRef.value?.loadGraph(data);
  }
}

// ========== 缩放控制 ==========

/** 放大 */
function handleZoomIn(): void {
  canvasRef.value?.zoomIn();
}

/** 缩小 */
function handleZoomOut(): void {
  canvasRef.value?.zoomOut();
}

/** 重置缩放 */
function handleZoomReset(): void {
  canvasRef.value?.zoomReset();
}

// ========== 对齐操作 ==========

/** 左对齐 */
function handleAlignLeft(): void {
  canvasRef.value?.alignLeft();
}

/** 水平居中 */
function handleAlignCenter(): void {
  canvasRef.value?.alignCenter();
}

/** 右对齐 */
function handleAlignRight(): void {
  canvasRef.value?.alignRight();
}

/** 上对齐 */
function handleAlignTop(): void {
  canvasRef.value?.alignTop();
}

/** 垂直居中 */
function handleAlignMiddle(): void {
  canvasRef.value?.alignMiddle();
}

/** 下对齐 */
function handleAlignBottom(): void {
  canvasRef.value?.alignBottom();
}

/** 水平分布 */
function handleDistributeHorizontal(): void {
  canvasRef.value?.distributeHorizontal();
}

/** 垂直分布 */
function handleDistributeVertical(): void {
  canvasRef.value?.distributeVertical();
}

onMounted(async () => {
  definitionId.value = route.query.id as string || '';
  if (definitionId.value) {
    await acquireLock();
    await loadDesignerData();
  }
});

onBeforeUnmount(async () => {
  await releaseLock();
});
</script>

<template>
  <div class="designer-container">
    <!-- 顶部工具栏 -->
    <DesignerToolbar
      :loading="isLoading"
      :saving="isSaving"
      :locked="isLocked"
      @save="handleSave"
      @undo="handleUndo"
      @redo="handleRedo"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @zoom-reset="handleZoomReset"
      @align-left="handleAlignLeft"
      @align-center="handleAlignCenter"
      @align-right="handleAlignRight"
      @align-top="handleAlignTop"
      @align-middle="handleAlignMiddle"
      @align-bottom="handleAlignBottom"
      @distribute-horizontal="handleDistributeHorizontal"
      @distribute-vertical="handleDistributeVertical"
    />
    <div class="designer-body">
      <!-- 左侧节点面板 -->
      <DesignerPalette />
      <!-- 中间画布 -->
      <div class="designer-canvas-wrapper">
        <DesignerCanvas
          ref="canvasRef"
          :definition-id="definitionId"
          :locked="isLocked"
          @node-select="handleNodeSelect"
        />
      </div>
      <!-- 右侧属性面板 -->
      <DesignerPropertyPanel
        :node-id="designerState.selectedNodeId"
        :node-config="designerState.nodeConfig"
        @config-change="handleNodeConfigChange"
      />
    </div>
  </div>
</template>

<style scoped>
.designer-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: var(--el-bg-color-page);
}

.designer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.designer-canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
