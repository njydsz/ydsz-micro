<!--
 * BPMN 可视化设计器画布组件
 *
 * <p>基于 bpmn-js (Modeler) 提供标准 BPMN 2.0 流程编辑能力：
 * 加载 BPMN XML、编辑节点与连线、属性面板、导出 XML/SVG、缩放适配。
 *
 * <p>暴露 API：getXML / getSVG / zoomToFit / clearDiagram / loadXml /
 * undo / redo / updateElementProperties。Modeler 实例本身不外泄，
 * 撤销重做与属性写入均由画布内部服务完成。
 *
 * <p>v-on 事件：selection-change （选中元素变化时触发，用于同步属性面板属性）。
 *
 * @path apps\workflow-web\src\views\designer\bpmn-canvas.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * BPMN 可视化设计器画布组件
 * <p>封装 bpmn-js Modeler 实例，提供画布生命周期管理与节点选中事件。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
// bpmn-js-properties-panel v5 起不再自带样式：面板样式实际由 @bpmn-io/properties-panel 提供
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { YdSpinner } from '@ydsz-core/ydsz-ui';
import { getModdleExtensions, getPropertiesProvider } from './bpmn-customizations';
import type BpmnModeler from 'bpmn-js/lib/Modeler';
import type { BpmnPropertiesPanelModule } from 'bpmn-js-properties-panel';
import type {
  BpmnCanvasService,
  BpmnCommandStackService,
  BpmnElementDescriptor,
  BpmnElementRegistryService,
  BpmnEventBus,
  BpmnModelingService,
  BpmnPropertyChanges,
  BpmnSelectionService,
} from './types';

interface Props {
  /** 初始 BPMN 2.0 XML（空字符串时使用空骨架） */
  xml?: string;
  /** 是否禁用编辑（只读预览） */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  xml: '',
  disabled: false,
});

const emit = defineEmits<{
  /** 当前选中元素变化时触发（null 表示取消选中） */
  selectionChange: [element: BpmnElementDescriptor | null];
  /** 画布模型加载完成时触发 */
  ready: [];
}>();

const containerRef = shallowRef<HTMLDivElement>();
const propertiesPanelRef = shallowRef<HTMLDivElement>();
/**
 * Modeler 实例用 shallowRef 持有：bpmn-js 内部是自建的对象图，
 * 深响应式代理会破坏其节点身份判断并拖慢画布。
 */
const modelerRef = shallowRef<BpmnModeler | null>(null);

/** 画布引擎是否就绪（动态加载完成后置 true） */
const isReady = ref(false);
/** 动态导入 bpmn-js 失败时的错误信息 */
const loadError = ref('');

const EMPTY_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true" />
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

/**
 * 初始化 bpmn-js Modeler 实例。
 *
 * <p>配置：
 * - Canvas 网格、默认缩放
 * - Properties Panel 注入右侧 DOM
 * - 自定义属性 provider（业务扩展字段）
 * - Moddle extensions（Camunda 描述符）
 */
async function initModeler(
  BpmnModelerClass: typeof BpmnModeler,
  PanelModule: typeof BpmnPropertiesPanelModule,
) {
  if (!containerRef.value) return;

  const modeler = new BpmnModelerClass({
    container: containerRef.value,
    propertiesPanel: propertiesPanelRef.value
      ? { parent: propertiesPanelRef.value }
      : undefined,
    keyboard: { bindTo: window },
    additionalModules: [
      PanelModule,
      ...getPropertiesProvider(),
    ],
    moddleExtensions: getModdleExtensions(),
  });

  modelerRef.value = modeler;

  // 绑定元素选中事件
  modeler.get<BpmnEventBus>('eventBus').on('selection.changed', () => {
    const [element] = modeler.get<BpmnSelectionService>('selection').get();
    if (!element) {
      emit('selectionChange', null);
      return;
    }
    emit('selectionChange', element);
  });

  emit('ready');
}

/**
 * 异步加载 BPMN XML 字符串到画布。
 *
 * @param xml - BPMN 2.0 XML 文本（为空时使用空骨架）
 */
async function loadXml(xml: string): Promise<void> {
  const modeler = modelerRef.value;
  if (!modeler) return;
  const content = xml?.trim() ? xml : EMPTY_BPMN_XML;
  try {
    await modeler.importXML(content);
  } catch {
    // 首次加载失败时使用空骨架兜底
    await modeler.importXML(EMPTY_BPMN_XML);
  }
}

/**
 * 获取当前 BPMN XML（异步返回）。
 *
 * @returns BPMN 2.0 XML 字符串
 */
async function getXML(): Promise<string> {
  const modeler = modelerRef.value;
  if (!modeler) return EMPTY_BPMN_XML;
  try {
    const { xml } = await modeler.saveXML({ format: true });
    return xml ?? EMPTY_BPMN_XML;
  } catch {
    return EMPTY_BPMN_XML;
  }
}

/**
 * 获取当前 BPMN 渲染为 SVG（异步返回）。
 *
 * @returns SVG 字符串
 */
async function getSVG(): Promise<string> {
  const modeler = modelerRef.value;
  if (!modeler) return '';
  try {
    const { svg } = await modeler.saveSVG();
    return svg ?? '';
  } catch {
    return '';
  }
}

/**
 * 缩放以适配画布（zoom to fit）。
 *
 * <p>使整张流程图完整显示在当前视口内。
 */
function zoomToFit(): void {
  modelerRef.value?.get<BpmnCanvasService>('canvas').zoom('fit-viewport');
}

/** 撤销上一步建模操作（bpmn-js commandStack）。 */
function undo(): void {
  modelerRef.value?.get<BpmnCommandStackService>('commandStack').undo();
}

/** 重做被撤销的建模操作。 */
function redo(): void {
  modelerRef.value?.get<BpmnCommandStackService>('commandStack').redo();
}

/**
 * 更新指定元素的 BPMN 属性。
 *
 * <p>属性写入由 bpmn-js Modeling 服务负责，调用方无需持有 Modeler 实例。
 *
 * @param elementId - 元素 ID（bpmn 中的 id 属性）
 * @param properties - 属性键值（camunda:* 使用完整命名空间键）
 */
function updateElementProperties(
  elementId: string,
  properties: BpmnPropertyChanges,
): void {
  const modeler = modelerRef.value;
  if (!modeler) return;
  const element = modeler
    .get<BpmnElementRegistryService>('elementRegistry')
    .get(elementId);
  if (!element) return;
  modeler.get<BpmnModelingService>('modeling').updateProperties(element, properties);
}

/**
 * 清空当前流程图（回到空骨架）。
 *
 * <p>移除所有节点和连线，保留空的 process 容器。
 */
async function clearDiagram(): Promise<void> {
  await loadXml(EMPTY_BPMN_XML);
}

/** 销毁 bpmn-js Modeler 实例（防止内存泄漏）。 */
function destroyModeler(): void {
  const modeler = modelerRef.value;
  if (!modeler) return;
  try {
    modeler.destroy();
  } catch {
    // ignore
  }
  modelerRef.value = null;
}

/** 监听外部 xml 变化后重新加载 */
watch(
  () => props.xml,
  async (nextXml) => {
    if (nextXml && nextXml !== '' && modelerRef.value) {
      await loadXml(nextXml);
    }
  },
);

onMounted(() => {
  isReady.value = false;
  loadError.value = '';
  doInitModeler();
});

/**
 * 动态加载 bpmn-js 并初始化 Modeler 实例。
 *
 * 两阶段并行加载 Modeler + PropertiesPanel 依赖后组装实例；
 * 失败时写入 loadError，供上层展示友好提示。
 */
async function doInitModeler(): Promise<void> {
  try {
    const [{ default: BpmnModelerClass }, panelModule] = await Promise.all([
      import('bpmn-js/lib/Modeler'),
      import('bpmn-js-properties-panel'),
    ]);
    await initModeler(BpmnModelerClass as typeof BpmnModeler, panelModule.BpmnPropertiesPanelModule);
    isReady.value = true;
    await loadXml(props.xml || EMPTY_BPMN_XML);
  } catch (err) {
    loadError.value = (err as Error)?.message || 'BPMN 引擎加载失败，请刷新页面重试';
    console.error('[BpmnCanvas] 动态导入 bpmn-js 失败:', err);
  }
}

onBeforeUnmount(() => {
  destroyModeler();
});

defineExpose({
  getXML,
  getSVG,
  zoomToFit,
  clearDiagram,
  loadXml,
  undo,
  redo,
  updateElementProperties,
});
</script>

<template>
  <div class="bpmn-canvas-root">
    <!-- 画布容器（必填，ref 绑定 DOM） -->
    <div ref="containerRef" class="bpmn-canvas" :class="{ 'is-disabled': disabled }" />
    <!-- 属性面板容器（与 bpmn-js-properties-panel 对接） -->
    <div ref="propertiesPanelRef" class="bpmn-properties-panel" />
    <!-- 动态加载期间的遮罩 -->
    <YdSpinner :spinning="!isReady && !loadError" />
    <div v-if="loadError" class="bpmn-canvas-error">
      <span class="bpmn-canvas-error__icon">⚠</span>
      <p class="bpmn-canvas-error__msg">{{ loadError }}</p>
    </div>
  </div>
</template>

<style scoped>
.bpmn-canvas-root {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
}

.bpmn-canvas {
  flex: 1;
  height: 100%;
  background-color: #fafafa;
  background-image:
    linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
    linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px);
  background-size: 20px 20px;
}

.bpmn-canvas.is-disabled {
  filter: grayscale(0.5);
  pointer-events: none;
}

.bpmn-properties-panel {
  width: 360px;
  height: 100%;
  overflow-y: auto;
  border-left: 1px solid hsl(var(--border-subtle, #e5e7eb));
  background: #fff;
  position: relative;
  z-index: 2;
}

.bpmn-canvas-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fafafa;
  z-index: 10;
}

.bpmn-canvas-error__icon {
  font-size: 32px;
  color: #f56c6c;
}

.bpmn-canvas-error__msg {
  margin: 0;
  font-size: 14px;
  color: #606266;
  text-align: center;
  max-width: 320px;
}
</style>
