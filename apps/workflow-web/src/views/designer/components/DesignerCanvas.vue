<!--
 * 流程设计器画布组件
 *
 * <p>基于 LogicFlow 的核心画布，负责流程图的渲染、节点拖拽、连线编辑。
 *
 * @path apps\workflow-web\src\views\designer\components\DesignerCanvas.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程设计器画布组件（v4.4.1 重构：对齐逻辑提取至 use-canvas-alignment）。
 *
 * <p>封装 LogicFlow 实例，提供节点操作 API。
 * 对齐/分布操作已提取至{@link useCanvasAlignment}，
 * 本文件聚焦于画布生命周期、节点注册与事件绑定。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import '@logicflow/core/dist/style/index.css';
import { LogicFlow } from '@logicflow/core';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { DesignerNodeConfig, LfGraphNode } from '../types';
import { DesignerNodeType } from '../types';
import { useCanvasAlignment } from '../use-canvas-alignment';

// LfGraphNode 已迁移至 ../types，通过 import type 引入

interface Props {
  /** 流程定义 ID */
  definitionId: string;
  /** 是否锁定（只读） */
  locked: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  locked: false,
});

const emit = defineEmits<{
  nodeSelect: [nodeId: string, config: DesignerNodeConfig | null];
}>();

const containerRef = ref<HTMLDivElement>();
const lfRef = ref<LogicFlow | null>(null);
let lf: LogicFlow | null = null;

/** 对齐/分布操作（从 composable 获取） */
const alignment = useCanvasAlignment(() => lfRef.value);

/**
 * 初始化 LogicFlow 实例。
 *
 * 配置网格、键盘交互、样式；注册自定义节点并绑定事件后执行首帧渲染。
 */
function initLogicFlow() {
  if (!containerRef.value) return;

  lf = new LogicFlow({
    container: containerRef.value,
    grid: {
      size: 20,
      visible: true,
      type: 'dot',
      config: { color: '#ababab', thickness: 1 },
    },
    keyboard: { enabled: true },
    edgeTextDraggable: true,
    nodeTextDraggable: true,
    hideAnchors: false,
    adjustNodePosition: true,
    stopScrollGraph: true,
    stopZoomGraph: true,
    style: {
      rect: {
        radius: 8,
        strokeWidth: 2,
      },
      circle: {
        r: 30,
        strokeWidth: 2,
      },
      polygon: {
        strokeWidth: 2,
      },
    },
  });
  lfRef.value = lf;

  // 注册自定义节点
  registerCustomNodes();

  // 绑定事件
  bindEvents();

  // 渲染
  lf.render({});
}

/**
 * 注册自定义节点类型。
 *
 * 包含：开始节点、结束节点、审批节点、AI 审批节点、服务节点、条件节点。
 * 每种节点定义 getNodeStyle/getTextStyle 以控制外观。
 *
 * v4.4.1：condition-node 使用 Record 类型注解替代 any（云顶规范 §3.1 豁免条款 —— LogicFlow 基类签名使用 any）。
 */
function registerCustomNodes() {
  if (!lf) return;

  // 开始节点
  lf.register('start-node', ({ CircleNode, CircleNodeModel }) => {
    class StartNode extends CircleNode {}
    class StartNodeModel extends CircleNodeModel {
      getAnchorStyle() {
        return { stroke: '#67c23a', fill: '#67c23a', strokeWidth: 2 };
      }
      getTextStyle() {
        return { fontSize: 14, fill: '#303133', fontWeight: 'bold' };
      }
    }
    return { view: StartNode, model: StartNodeModel };
  });

  // 结束节点
  lf.register('end-node', ({ CircleNode, CircleNodeModel }) => {
    class EndNode extends CircleNode {}
    class EndNodeModel extends CircleNodeModel {
      getAnchorStyle() {
        return { stroke: '#f56c6c', fill: '#f56c6c', strokeWidth: 2 };
      }
      getTextStyle() {
        return { fontSize: 14, fill: '#303133', fontWeight: 'bold' };
      }
    }
    return { view: EndNode, model: EndNodeModel };
  });

  // 审批节点
  lf.register('approve-node', ({ RectNode, RectNodeModel }) => {
    class ApproveNode extends RectNode {}
    class ApproveNodeModel extends RectNodeModel {
      getNodeStyle() {
        return {
          fill: '#fff',
          stroke: '#409eff',
          strokeWidth: 2,
          radius: 8,
        };
      }
      getTextStyle() {
        return { fontSize: 14, fill: '#303133' };
      }
    }
    return { view: ApproveNode, model: ApproveNodeModel };
  });

  // AI 审批节点
  lf.register('ai-agent-node', ({ RectNode, RectNodeModel }) => {
    class AiAgentNode extends RectNode {}
    class AiAgentNodeModel extends RectNodeModel {
      getNodeStyle() {
        return {
          fill: '#fff',
          stroke: '#9254de',
          strokeWidth: 2,
          radius: 8,
        };
      }
      getTextStyle() {
        return { fontSize: 14, fill: '#303133' };
      }
    }
    return { view: AiAgentNode, model: AiAgentNodeModel };
  });

  // 服务节点
  lf.register('service-node', ({ RectNode, RectNodeModel }) => {
    class ServiceNode extends RectNode {}
    class ServiceNodeModel extends RectNodeModel {
      getNodeStyle() {
        return {
          fill: '#fff',
          stroke: '#e6a23c',
          strokeWidth: 2,
          radius: 8,
        };
      }
      getTextStyle() {
        return { fontSize: 14, fill: '#303133' };
      }
    }
    return { view: ServiceNode, model: ServiceNodeModel };
  });

  // 条件节点
  lf.register('condition-node', ({ PolygonNode, PolygonNodeModel }) => {
    class ConditionNode extends PolygonNode {}
    class ConditionNodeModel extends PolygonNodeModel {
      /**
       * 非标准 API 收窄：LogicFlow 基类方法签名使用 any，覆写时保持兼容。
       *
       * @param data - 初始化节点数据
       */
      initNodeData(data: Record<string, unknown>) {
        super.initNodeData(data as Record<string, unknown>);
        this.points = [
          [50, 0],
          [100, 50],
          [50, 100],
          [0, 50],
        ];
      }
      getNodeStyle() {
        return {
          fill: '#fff',
          stroke: '#909399',
          strokeWidth: 2,
        };
      }
      getTextStyle() {
        return { fontSize: 12, fill: '#303133' };
      }
    }
    return { view: ConditionNode, model: ConditionNodeModel };
  });
}

/**
 * 绑定画布事件。
 *
 * 监听：
 * - node:click：选中节点，emit nodeSelect
 * - blank:click：取消选中
 * - node:dnd-add：新拖拽节点添加后设置默认配置
 */
function bindEvents() {
  if (!lf) return;

  // 节点点击
  lf.on('node:click', ({ data }) => {
    if (!data) return;
    const properties = (data.properties as DesignerNodeConfig) || null;
    emit('nodeSelect', data.id, properties);
  });

  // 画布点击（取消选中）
  lf.on('blank:click', () => {
    emit('nodeSelect', '', null);
  });

  // 节点添加
  lf.on('node:dnd-add', ({ data }) => {
    if (!data) return;
    // 新节点默认配置
    const defaultConfig: DesignerNodeConfig = {
      nodeCode: `node_${Date.now()}`,
      nodeName: getDefaultNodeName(data.type as string),
    };
    lf?.setProperties(data.id, defaultConfig as Record<string, unknown>);
    emit('nodeSelect', data.id, defaultConfig);
  });
}

/**
 * 根据节点类型获取默认名称。
 *
 * @param type - 节点类型标识（如 'start-node'）
 * @returns 默认中文名称，未匹配时返回 '节点'
 */
function getDefaultNodeName(type: string): string {
  const nameMap: Record<string, string> = {
    'start-node': '开始',
    'end-node': '结束',
    'approve-node': '审批',
    'ai-agent-node': 'AI审批',
    'service-node': '服务',
    'condition-node': '条件',
  };
  return nameMap[type] || '节点';
}

/**
 * 加载图数据。
 *
 * @param diagramJson - 序列化的图数据 JSON 字符串
 */
function loadGraph(diagramJson: string) {
  if (!lf || !diagramJson) return;
  try {
    const graphData = JSON.parse(diagramJson);
    lf.render(graphData);
  } catch {
    lf.render({});
  }
}

/**
 * 获取图数据。
 *
 * @returns 序列化后的图数据，未初始化时返回 null
 */
function getGraphData() {
  if (!lf) return null;
  return lf.getGraphData();
}

/**
 * 更新节点属性。
 *
 * @param nodeId - 目标节点 ID
 * @param config - 新节点配置
 */
function updateNodeProperties(nodeId: string, config: DesignerNodeConfig) {
  if (!lf || !nodeId) return;
  lf.setProperties(nodeId, config as Record<string, unknown>);
}

/**
 * 在画布上添加新节点。
 *
 * @param type - 节点类型枚举
 * @param x - 横坐标
 * @param y - 纵坐标
 * @param text - 显示文本
 */
function addNode(type: DesignerNodeType, x: number, y: number, text: string) {
  if (!lf) return;
  const nodeTypeMap: Record<DesignerNodeType, string> = {
    [DesignerNodeType.START]: 'start-node',
    [DesignerNodeType.END]: 'end-node',
    [DesignerNodeType.APPROVE]: 'approve-node',
    [DesignerNodeType.SERVICE]: 'service-node',
    [DesignerNodeType.CONDITION]: 'condition-node',
    [DesignerNodeType.SUB_PROCESS]: 'approve-node',
    [DesignerNodeType.AI_AGENT]: 'ai-agent-node',
  };
  lf.addNode({
    type: nodeTypeMap[type] || 'approve-node',
    x,
    y,
    text,
    properties: {
      nodeCode: `node_${Date.now()}`,
      nodeName: text,
    },
  });
}

// ==================== 缩放操作 ====================

/** 放大画布（最大 200%）。 */
function zoomIn() {
  if (!lf) return;
  const currentZoom = lf.getTransform().SCALE_X || 1;
  const newZoom = Math.min(currentZoom + 0.1, 2);
  lf.zoom(newZoom);
}

/** 缩小画布（最小 50%）。 */
function zoomOut() {
  if (!lf) return;
  const currentZoom = lf.getTransform().SCALE_X || 1;
  const newZoom = Math.max(currentZoom - 0.1, 0.5);
  lf.zoom(newZoom);
}

/** 重置缩放与位移。 */
function zoomReset() {
  if (!lf) return;
  lf.resetZoom();
  lf.translate(0, 0);
}

// ==================== 锁定状态同步 ====================

watch(
  () => props.locked,
  (locked) => {
    if (lf) {
      lf.options.isSilentMode = locked;
    }
  },
);

onMounted(() => {
  initLogicFlow();
});

onBeforeUnmount(() => {
  lf?.destroy();
  lf = null;
  lfRef.value = null;
});

/**
 * 暴露公共方法供父组件调用。
 *
 * 包含：图数据加载/获取、节点增删改、缩放、对齐与分布。
 */
defineExpose({
  loadGraph,
  getGraphData,
  updateNodeProperties,
  addNode,
  zoomIn,
  zoomOut,
  zoomReset,
  alignLeft: alignment.alignLeft,
  alignCenter: alignment.alignCenter,
  alignRight: alignment.alignRight,
  alignTop: alignment.alignTop,
  alignMiddle: alignment.alignMiddle,
  alignBottom: alignment.alignBottom,
  distributeHorizontal: alignment.distributeHorizontal,
  distributeVertical: alignment.distributeVertical,
});
</script>

<template>
  <div ref="containerRef" class="designer-canvas" />
</template>

<style scoped>
.designer-canvas {
  width: 100%;
  height: 100%;
  background: #fafafa;
}
</style>
