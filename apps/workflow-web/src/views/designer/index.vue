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
