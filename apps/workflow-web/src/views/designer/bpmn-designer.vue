<!--
 * BPMN 可视化设计器页签入口
 *
 * <p>布局：左侧节点工具栏 + 中间画布 + 右侧属性面板；
 * 工具栏：保存、导入文件、导出 XML、撤销/重做、缩放适配；
 * 画布组件 BpmnCanvas + 属性面板 BpmnPropertyPanel。
 *
 * <p>通过 ref 调用子组件方法；通过 event 从子组件获取 selection 与错误信息。
 *
 * @path apps\workflow-web\src\views\designer\bpmn-designer.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * BPMN 可视化设计器页签入口
 *
 * <p>组合 BpmnCanvas + BpmnPropertyPanel，提供完整的流程设计能力。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { PropertyElement } from './bpmn-property-panel.vue';
import BpmnCanvas from './bpmn-canvas.vue';
import BpmnPropertyPanel from './bpmn-property-panel.vue';
import { createLogger } from '@ydsz-core/shared/utils';
import { showToast } from '@ydsz/notification';
import { $t } from '#/locales';
import {
  fetchBpmnXml,
  saveBpmnXml,
  deployBpmnXml,
} from '#/api/bpmnDesigner';

const logger = createLogger('bpmn-designer');
const route = useRoute();

/** 画布组件 ref（调用 getXML / loadXml 等） */
const canvasRef = ref<InstanceType<typeof BpmnCanvas> | null>(null);
/** 当前选中元素 */
const selectedElement = ref<PropertyElement | null>(null);
/** 当前流程定义 ID（来自路由 /:id） */
const definitionId = ref<string>('');
const isLoading = ref(false);
const isSaving = ref(false);

/** 隐藏的文件 input（用于导入本地 .bpmn 文件） */
const fileInputRef = ref<HTMLInputElement | null>(null);

/**
 * 生命周期 — 若路由带 id 则尝试加载后端 BPMN XML
 */
onMounted(async () => {
  const idFromRoute = (route.params.id as string) || (route.query.id as string) || '';
  if (idFromRoute) {
    definitionId.value = idFromRoute;
    await loadFromServer(idFromRoute);
  }
});

/** 卸载前释放资源 */
onBeforeUnmount(() => {
  canvasRef.value = null;
});

/**
 * 从服务端加载 BPMN XML 并渲染到画布
 *
 * @param id - 流程定义 ID
 */
async function loadFromServer(id: string): Promise<void> {
  isLoading.value = true;
  try {
    const data = await fetchBpmnXml(id);
    if (data?.bpmnXml) {
      await canvasRef.value?.loadXml(data.bpmnXml);
      showToast.success($t('workflowDesigner.loadSuccess'));
    } else {
      // 无 XML 时使用空骨架
      await canvasRef.value?.loadXml('');
    }
  } catch (error) {
    logger.warn('加载 BPMN XML 失败', error);
    showToast.error($t('workflowDesigner.loadFailed'));
    await canvasRef.value?.loadXml('');
  } finally {
    isLoading.value = false;
  }
}

/**
 * 保存 BPMN XML 到服务端（不发发布）
 *
 * <p>优先使用 definitionId 保存到已有定义，否则走新建部署流程。
 */
async function handleSave(): Promise<void> {
  if (!canvasRef.value) return;
  isSaving.value = true;
  try {
    const xml = await canvasRef.value.getXML();
    if (definitionId.value) {
      await saveBpmnXml(definitionId.value, xml);
      showToast.success($t('workflowDesigner.saveSuccess'));
    } else {
      const result = await deployBpmnXml(xml);
      definitionId.value = result.id;
      showToast.success($t('workflowDesigner.deploySuccess'));
    }
  } catch (error) {
    logger.warn('保存 BPMN XML 失败', error);
    showToast.error($t('workflowDesigner.saveFailed'));
  } finally {
    isSaving.value = false;
  }
}

/**
 * 处理选中元素变化
 *
 * @param element - 当前选中的元素（null 表示取消选中）
 */
function handleSelectionChange(element: PropertyElement | null): void {
  selectedElement.value = element;
}

/**
 * 处理属性面板字段变更 → 调用 modeling.updateProperties
 *
 * <p>由于 bpmn-canvas 通过 bpmn-js-properties-panel 已把大部分属性编辑收归内置面板，
 * 此钩子作为兜底：用于业务扩展字段（ydsz:xxx）和轻量定制场景。
 *
 * @param elementId - 节点 ID
 * @param properties - 变更后的属性
 */
function handlePropertyChange(elementId: string, properties: Record<string, any>): void {
  const modeler = (canvasRef.value as any)?.modeler;
  if (!modeler) {
    return;
  }
  const modeling = modeler.get('modeling');
  const elementRegistry = modeler.get('elementRegistry');
  const element = elementRegistry.get(elementId);
  if (!element || !modeling) return;
  try {
    modeling.updateProperties(element, properties);
  } catch (error) {
    logger.warn('更新节点属性失败', error);
  }
}

/**
 * 选择文件 → 读取 BPMN XML → 加载到画布
 */
function triggerImport(): void {
  fileInputRef.value?.click();
}

/**
 * 读取用户选中的 .bpmn / .xml 文件然后加载
 *
 * @param event - 文件选择事件
 */
async function handleFileSelected(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    await canvasRef.value?.loadXml(text);
    showToast.success($t('workflowDesigner.importSuccess'));
  } catch (error) {
    logger.warn('导入 BPMN 文件失败', error);
    showToast.error($t('workflowDesigner.importFailed'));
  } finally {
    // 清空 input 以便同一文件可再次选择
    target.value = '';
  }
}

/**
 * 导出当前画布为 BPMN XML 文件（下载）
 */
async function handleExportXml(): Promise<void> {
  const xml = await canvasRef.value?.getXML();
  if (!xml) return;
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `process_${definitionId.value || 'new'}.bpmn20.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast.success($t('workflowDesigner.exportSuccess'));
}

/**
 * 导出当前画布为 SVG 图像
 */
async function handleExportSvg(): Promise<void> {
  const svg = await canvasRef.value?.getSVG();
  if (!svg) return;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `process_${definitionId.value || 'new'}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast.success($t('workflowDesigner.exportSuccess'));
}

/**
 * 撤销（通过 bpmn-js commandStack）
 */
function handleUndo(): void {
  const modeler = (canvasRef.value as any)?.modeler;
  const commandStack = modeler?.get?.('commandStack');
  commandStack?.undo?.();
}

/**
 * 重做
 */
function handleRedo(): void {
  const modeler = (canvasRef.value as any)?.modeler;
  const commandStack = modeler?.get?.('commandStack');
  commandStack?.redo?.();
}

/**
 * 缩放适配
 */
function handleZoomToFit(): void {
  canvasRef.value?.zoomToFit();
}

/**
 * 清空画布
 */
async function handleClear(): Promise<void> {
  await canvasRef.value?.clearDiagram();
}

/**
 * 准备就绪（canvas 初始化完成后触发，用于启用工具栏按钮）
 */
function handleReady(): void {
  canvasRef.value?.zoomToFit();
}
</script>

<template>
  <div class="bpmn-designer">
    <!-- 顶部工具栏 -->
    <header class="bpmn-designer__toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">
          {{ $t('workflowDesigner.title') }}
        </span>
        <span v-if="definitionId" class="toolbar-id">(#{{ definitionId }})</span>
      </div>
      <div class="toolbar-center">
        <button class="tool-btn" :disabled="isLoading" @click="handleUndo" :title="$t('workflowDesigner.undo')">
          ↶ {{ $t('workflowDesigner.undo') }}
        </button>
        <button class="tool-btn" :disabled="isLoading" @click="handleRedo" :title="$t('workflowDesigner.redo')">
          ↷ {{ $t('workflowDesigner.redo') }}
        </button>
        <span class="toolbar-divider" />
        <button class="tool-btn" :disabled="isLoading" @click="handleZoomToFit" :title="$t('workflowDesigner.zoomToFit')">
          ⤢ {{ $t('workflowDesigner.zoomToFit') }}
        </button>
        <button class="tool-btn" :disabled="isLoading" @click="handleClear">
          🗑 {{ $t('workflowDesigner.clear') }}
        </button>
      </div>
      <div class="toolbar-right">
        <button class="tool-btn" :disabled="isLoading" @click="triggerImport" :title="$t('workflowDesigner.import')">
          ⬆ {{ $t('workflowDesigner.import') }}
        </button>
        <button class="tool-btn" :disabled="isLoading" @click="handleExportXml" :title="$t('workflowDesigner.exportXml')">
          ⬇ XML
        </button>
        <button class="tool-btn" :disabled="isLoading" @click="handleExportSvg" :title="$t('workflowDesigner.exportSvg')">
          ⬇ SVG
        </button>
        <button
          class="tool-btn tool-btn--primary"
          :disabled="isLoading || isSaving"
          @click="handleSave"
        >
          💾 {{ definitionId ? $t('workflowDesigner.save') : $t('workflowDesigner.deploy') }}
        </button>
      </div>
    </header>

    <!-- 隐藏的文件 input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".bpmn,.bpmn20.xml,.xml"
      style="display: none"
      @change="handleFileSelected"
    />

    <!-- 主体：左侧节点工具栏 + 中间画布+属性面板 + 右侧属性面板 -->
    <div class="bpmn-designer__body">
      <!-- 左侧节点操作面板（参考 bpmn-js palette） -->
      <aside class="bpmn-designer__palette">
        <div class="palette-title">{{ $t('workflowDesigner.palette') }}</div>
        <p class="palette-hint">{{ $t('workflowDesigner.paletteHint') }}</p>
      </aside>

      <!-- 中间画布 + 内置 Properties Panel -->
      <main class="bpmn-designer__main">
        <BpmnCanvas
          ref="canvasRef"
          :xml="''"
          :disabled="isLoading"
          @selection-change="handleSelectionChange"
          @ready="handleReady"
        />
      </main>

      <!-- 右侧自定义属性面板（兜底业务字段） -->
      <aside class="bpmn-designer__property-panel">
        <BpmnPropertyPanel :element="selectedElement" @property-change="handlePropertyChange" />
      </aside>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="isLoading || isSaving" class="bpmn-designer__loading">
      <div class="loading-spinner" />
      <div class="loading-text">{{ isLoading ? $t('workflowDesigner.loading') : $t('workflowDesigner.saving') }}</div>
    </div>
  </div>
</template>

<style scoped>
.bpmn-designer {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: hsl(var(--bg-canvas, #fafafa));
}

.bpmn-designer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid hsl(var(--border-subtle, #e5e7eb));
  flex: 0 0 48px;
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.toolbar-id {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.toolbar-center {
  gap: 6px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: hsl(var(--border-subtle, #e5e7eb));
  margin: 0 4px;
}

.toolbar-right {
  gap: 6px;
}

.tool-btn {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #303133;
  transition: background 0.2s, border-color 0.2s;
}

.tool-btn:hover:not(:disabled) {
  background: #ecf5ff;
  border-color: #409eff;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-btn--primary {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.tool-btn--primary:hover:not(:disabled) {
  background: #66b1ff;
  border-color: #66b1ff;
}

.bpmn-designer__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.bpmn-designer__palette {
  width: 160px;
  background: #fff;
  border-right: 1px solid hsl(var(--border-subtle, #e5e7eb));
  padding: 12px;
}

.palette-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.palette-hint {
  font-size: 12px;
  color: #909399;
}

.bpmn-designer__main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.bpmn-designer__property-panel {
  width: 360px;
  background: #fff;
  border-left: 1px solid hsl(var(--border-subtle, #e5e7eb));
  overflow-y: auto;
}

.bpmn-designer__loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: bpmn-spin 0.8s linear infinite;
}

@keyframes bpmn-spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #606266;
}
</style>
