<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Graph } from '@antv/g6';

interface EngineNode {
  id: string;
  label: string;
  port: number;
  engineKey: string;
}

interface TopologyData {
  nodes: EngineNode[];
  edges: ReadonlyArray<{ source: string; target: string; label?: string }>;
}

const topologyData: TopologyData = {
  nodes: [
    { id: 'gateway', label: 'API 网关', port: 9000, engineKey: '' },
    { id: 'system', label: '系统引擎', port: 9001, engineKey: 'system' },
    { id: 'userinfo', label: '身份引擎', port: 9002, engineKey: 'userinfo' },
    { id: 'nextwiki', label: '文件引擎', port: 9003, engineKey: 'nextwiki' },
    { id: 'message', label: '消息引擎', port: 9004, engineKey: 'message' },
    { id: 'workflow', label: '流程引擎', port: 9005, engineKey: 'workflow' },
    { id: 'cronjob', label: '任务引擎', port: 9006, engineKey: 'cronjob' },
    { id: 'literule', label: '规则引擎', port: 9007, engineKey: 'literule' },
    { id: 'agent', label: '智能引擎', port: 9008, engineKey: 'agent' },
  ],
  edges: [
    { source: 'gateway', target: 'system', label: 'RPC' },
    { source: 'gateway', target: 'userinfo', label: 'RPC' },
    { source: 'gateway', target: 'nextwiki', label: 'REST' },
    { source: 'gateway', target: 'message', label: 'RPC' },
    { source: 'gateway', target: 'workflow', label: 'REST' },
    { source: 'gateway', target: 'cronjob', label: 'RPC' },
    { source: 'gateway', target: 'literule', label: 'RPC' },
    { source: 'gateway', target: 'agent', label: 'REST' },
    { source: 'system', target: 'userinfo', label: 'Feign' },
    { source: 'workflow', target: 'message', label: 'Feign' },
    { source: 'agent', target: 'literule', label: 'MCP' },
  ],
};

const containerRef = ref<HTMLDivElement | null>(null);
let graph: Graph | null = null;

function getPortById(port: number): string {
  const found = topologyData.nodes.find((n) => n.port === port);
  return found ? found.id : '';
}

function initGraph(): void {
  if (!containerRef.value) {
    return;
  }

  const nodes = topologyData.nodes.map((n) => ({
    id: n.id,
    type: 'rect',
    style: {
      width: 120,
      height: 48,
      radius: 8,
      fill: n.id === 'gateway' ? '#1a6dff' : '#e8f0fe',
      stroke: n.id === 'gateway' ? '#0044cc' : '#1a6dff',
      lineWidth: 1.5,
      text: n.label,
      fontSize: 13,
      fontWeight: 600,
      fillText: n.id === 'gateway' ? '#ffffff' : '#1a1a2e',
      ports: [{ group: 'port' }],
    },
  }));

  const edges = topologyData.edges.map((e) => ({
    source: e.source,
    target: e.target,
    type: 'line',
    style: {
      stroke: '#a0a0bb',
      lineWidth: 1.5,
      endArrow: true,
      label: e.label ?? '',
      fontSize: 10,
      fill: '#5a5a72',
    },
  }));

  graph = new Graph({
    container: containerRef.value,
    width: containerRef.value.clientWidth,
    height: 560,
    data: { nodes, edges },
    layout: {
      type: 'dagre',
      rankdir: 'TB',
      nodesep: 24,
      ranksep: 60,
    },
    behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node'],
  });

  graph.render();

  graph.on('node:click', (event) => {
    const nodeData = event.item?.getData();
    if (nodeData) {
      const engineNode = topologyData.nodes.find((n) => n.id === nodeData.id);
      if (engineNode && engineNode.engineKey) {
        window.location.href = `/engines/${engineNode.engineKey}`;
      }
    }
  });
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    initGraph();
  }
});

onBeforeUnmount(() => {
  if (graph) {
    graph.destroy();
    graph = null;
  }
});
</script>

<template>
  <div class="g6-topology-wrapper">
    <p class="hint">点击任意引擎节点（蓝色）可跳转到对应引擎专页；拖拽/缩放可自由调整布局</p>
    <div ref="containerRef" class="g6-topology-container" />
  </div>
</template>

<style scoped>
.g6-topology-wrapper {
  margin: 12px 0;
}

.hint {
  font-size: 12px;
  color: var(--ydsz-text-secondary);
  margin: 0 0 8px;
}
</style>
