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
 * 流程设计器画布组件
 * <p>封装 LogicFlow 实例，提供节点操作 API。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { LogicFlow } from '@logicflow/core';
import '@logicflow/core/dist/style/index.css';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { register } from '@logicflow/core';
import type { DesignerNodeConfig } from '../types';
import { DesignerNodeType } from '../types';

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
let lf: LogicFlow | null = null;

/**
 * 初始化 LogicFlow 实例
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

  // 注册自定义节点
  registerCustomNodes();

  // 绑定事件
  bindEvents();

  // 渲染
  lf.render({});
}

/**
 * 注册自定义节点
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
      // 非标准 API 收窄：LogicFlow 基类方法签名使用 any，覆写时保持兼容
      initNodeData(data: Record<string, unknown>) {
        super.initNodeData(data as Record<string, unknown>);
        this.points = [[50, 0], [100, 50], [50, 100], [0, 50]];
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
 * 绑定画布事件
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
 * 获取节点默认名称
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
 * 加载图数据
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
 * 获取图数据
 */
function getGraphData() {
  if (!lf) return null;
  return lf.getGraphData();
}

/**
 * 更新节点属性
 */
function updateNodeProperties(nodeId: string, config: DesignerNodeConfig) {
  if (!lf || !nodeId) return;
  lf.setProperties(nodeId, config as Record<string, unknown>);
}

/**
 * 添加节点
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

watch(() => props.locked, (locked) => {
  if (lf) {
    lf.options.isSilentMode = locked;
  }
});

// ==================== 缩放操作 ====================

/** 放大 */
function zoomIn() {
  if (!lf) return;
  const currentZoom = lf.getTransform().SCALE_X || 1;
  const newZoom = Math.min(currentZoom + 0.1, 2);
  lf.zoom(newZoom);
}

/** 缩小 */
function zoomOut() {
  if (!lf) return;
  const currentZoom = lf.getTransform().SCALE_X || 1;
  const newZoom = Math.max(currentZoom - 0.1, 0.5);
  lf.zoom(newZoom);
}

/** 重置缩放 */
function zoomReset() {
  if (!lf) return;
  lf.resetZoom();
  lf.translate(0, 0);
}

// ==================== 对齐操作 ====================

/** 获取选中的节点 */
function getSelectedNodes(): Array<{ id: string; x: number; y: number; width: number; height: number }> {
  if (!lf) return [];
  const selectedIds = lf.graphModel.nodes
    .filter((n: any) => n.isSelected)
    .map((n: any) => n.id);
  if (selectedIds.length < 2) return [];

  return selectedIds.map((id: string) => {
    const node = lf!.graphModel.nodes.find((n: any) => n.id === id);
    const { x, y, width, height } = node || {};
    return { id, x: x || 0, y: y || 0, width: width || 100, height: height || 50 };
  });
}

/** 左对齐 */
function alignLeft() {
  const nodes = getSelectedNodes();
  if (nodes.length < 2) return;
  const minX = Math.min(...nodes.map((n) => n.x));
  nodes.forEach((n) => {
    lf?.updateNode(n.id, { x: minX });
  });
}

/** 水平居中 */
function alignCenter() {
  const nodes = getSelectedNodes();
  if (nodes.length < 2) return;
  const avgX = nodes.reduce((sum, n) => sum + n.x + n.width / 2, 0) / nodes.length;
  nodes.forEach((n) => {
    lf?.updateNode(n.id, { x: avgX - n.width / 2 });
  });
}

/** 右对齐 */
function alignRight() {
  const nodes = getSelectedNodes();
  if (nodes.length < 2) return;
  const maxRight = Math.max(...nodes.map((n) => n.x + n.width));
  nodes.forEach((n) => {
    lf?.updateNode(n.id, { x: maxRight - n.width });
  });
}

/** 上对齐 */
function alignTop() {
  const nodes = getSelectedNodes();
  if (nodes.length < 2) return;
  const minY = Math.min(...nodes.map((n) => n.y));
  nodes.forEach((n) => {
    lf?.updateNode(n.id, { y: minY });
  });
}

/** 垂直居中 */
function alignMiddle() {
  const nodes = getSelectedNodes();
  if (nodes.length < 2) return;
  const avgY = nodes.reduce((sum, n) => sum + n.y + n.height / 2, 0) / nodes.length;
  nodes.forEach((n) => {
    lf?.updateNode(n.id, { y: avgY - n.height / 2 });
  });
}

/** 下对齐 */
function alignBottom() {
  const nodes = getSelectedNodes();
  if (nodes.length < 2) return;
  const maxBottom = Math.max(...nodes.map((n) => n.y + n.height));
  nodes.forEach((n) => {
    lf?.updateNode(n.id, { y: maxBottom - n.height });
  });
}

/** 水平分布 */
function distributeHorizontal() {
  const nodes = getSelectedNodes();
  if (nodes.length < 3) return;
  const sorted = [...nodes].sort((a, b) => a.x - b.x);
  const totalWidth = sorted.reduce((sum, n) => sum + n.width, 0);
  const span = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
  const gap = (span - totalWidth) / (sorted.length - 1);
  let cursor = sorted[0].x;
  sorted.forEach((n) => {
    lf?.updateNode(n.id, { x: cursor });
    cursor += n.width + gap;
  });
}

/** 垂直分布 */
function distributeVertical() {
  const nodes = getSelectedNodes();
  if (nodes.length < 3) return;
  const sorted = [...nodes].sort((a, b) => a.y - b.y);
  const totalHeight = sorted.reduce((sum, n) => sum + n.height, 0);
  const span = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height - sorted[0].y;
  const gap = (span - totalHeight) / (sorted.length - 1);
  let cursor = sorted[0].y;
  sorted.forEach((n) => {
    lf?.updateNode(n.id, { y: cursor });
    cursor += n.height + gap;
  });
}

onMounted(() => {
  initLogicFlow();
});

onBeforeUnmount(() => {
  lf?.destroy();
  lf = null;
});

defineExpose({
  loadGraph,
  getGraphData,
  updateNodeProperties,
  addNode,
  zoomIn,
  zoomOut,
  zoomReset,
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontal,
  distributeVertical,
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
